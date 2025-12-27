/**
 * Virtual Scroll Provider
 * Optimizes rendering of large error queues and history lists
 */

import * as vscode from 'vscode';

export interface VirtualScrollConfig {
  itemHeight: number; // Height of each item in pixels
  viewportHeight: number; // Height of visible area
  overscan: number; // Number of items to render outside viewport
  estimatedItemCount?: number; // Estimated total items
}

export interface VirtualScrollState {
  scrollTop: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  totalHeight: number;
  items: any[];
}

export class VirtualScrollProvider {
  private config: VirtualScrollConfig;
  private state: VirtualScrollState;
  private scrollContainer: HTMLElement | null = null;
  private onScrollEmitter = new vscode.EventEmitter<VirtualScrollState>();
  public readonly onScroll = this.onScrollEmitter.event;

  constructor(config: VirtualScrollConfig) {
    this.config = config;
    this.state = {
      scrollTop: 0,
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      totalHeight: 0,
      items: []
    };
  }

  /**
   * Initialize virtual scrolling for a container
   */
  initialize(items: any[]): VirtualScrollState {
    this.state.items = items;
    this.state.totalHeight = items.length * this.config.itemHeight;
    this.updateVisibleRange(0);
    return this.state;
  }

  /**
   * Update items and recalculate
   */
  updateItems(items: any[]): VirtualScrollState {
    this.state.items = items;
    this.state.totalHeight = items.length * this.config.itemHeight;
    this.updateVisibleRange(this.state.scrollTop);
    return this.state;
  }

  /**
   * Handle scroll event
   */
  handleScroll(scrollTop: number): VirtualScrollState {
    this.state.scrollTop = scrollTop;
    this.updateVisibleRange(scrollTop);
    this.onScrollEmitter.fire(this.state);
    return this.state;
  }

  /**
   * Update visible range based on scroll position
   */
  private updateVisibleRange(scrollTop: number): void {
    const visibleItemCount = Math.ceil(this.config.viewportHeight / this.config.itemHeight);
    
    // Calculate visible indices with overscan
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / this.config.itemHeight) - this.config.overscan
    );
    
    const endIndex = Math.min(
      this.state.items.length - 1,
      startIndex + visibleItemCount + (2 * this.config.overscan)
    );

    this.state.visibleStartIndex = startIndex;
    this.state.visibleEndIndex = endIndex;
  }

  /**
   * Get visible items
   */
  getVisibleItems(): { items: any[]; offsetY: number } {
    const items = this.state.items.slice(
      this.state.visibleStartIndex,
      this.state.visibleEndIndex + 1
    );
    
    const offsetY = this.state.visibleStartIndex * this.config.itemHeight;
    
    return { items, offsetY };
  }

  /**
   * Generate HTML for virtual scroll container
   */
  generateVirtualScrollHTML(
    items: any[],
    renderItem: (item: any, index: number) => string
  ): string {
    this.initialize(items);
    const { items: visibleItems, offsetY } = this.getVisibleItems();

    const renderedItems = visibleItems.map((item, idx) => {
      const actualIndex = this.state.visibleStartIndex + idx;
      return renderItem(item, actualIndex);
    }).join('');

    return `
      <div class="virtual-scroll-container" 
           style="height: ${this.config.viewportHeight}px; overflow-y: auto;"
           onscroll="handleVirtualScroll(event)">
        <div class="virtual-scroll-spacer" 
             style="height: ${this.state.totalHeight}px; position: relative;">
          <div class="virtual-scroll-content" 
               style="position: absolute; top: ${offsetY}px; width: 100%;">
            ${renderedItems}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate JavaScript for virtual scroll handling
   */
  generateVirtualScrollScript(): string {
    return `
      let virtualScrollState = {
        scrollTop: 0,
        itemHeight: ${this.config.itemHeight},
        viewportHeight: ${this.config.viewportHeight},
        overscan: ${this.config.overscan},
        totalItems: 0
      };

      function handleVirtualScroll(event) {
        const scrollTop = event.target.scrollTop;
        virtualScrollState.scrollTop = scrollTop;
        
        // Notify extension of scroll
        vscode.postMessage({
          type: 'virtualScroll',
          scrollTop: scrollTop
        });
        
        // Update visible items
        requestAnimationFrame(() => {
          updateVisibleItems(scrollTop);
        });
      }

      function updateVisibleItems(scrollTop) {
        const visibleItemCount = Math.ceil(
          virtualScrollState.viewportHeight / virtualScrollState.itemHeight
        );
        
        const startIndex = Math.max(
          0,
          Math.floor(scrollTop / virtualScrollState.itemHeight) - virtualScrollState.overscan
        );
        
        const endIndex = Math.min(
          virtualScrollState.totalItems - 1,
          startIndex + visibleItemCount + (2 * virtualScrollState.overscan)
        );
        
        // Request items from extension
        vscode.postMessage({
          type: 'requestItems',
          startIndex: startIndex,
          endIndex: endIndex
        });
      }
    `;
  }

  /**
   * Get current state
   */
  getState(): VirtualScrollState {
    return { ...this.state };
  }

  /**
   * Scroll to specific index
   */
  scrollToIndex(index: number): number {
    const scrollTop = index * this.config.itemHeight;
    this.handleScroll(scrollTop);
    return scrollTop;
  }

  /**
   * Scroll to top
   */
  scrollToTop(): number {
    return this.scrollToIndex(0);
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(): number {
    return this.scrollToIndex(this.state.items.length - 1);
  }
}

/**
 * Helper: Create debounced scroll handler
 */
export function createDebouncedScrollHandler(
  handler: (scrollTop: number) => void,
  delay: number = 16 // ~60fps
): (event: Event) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastScrollTop = 0;

  return (event: Event) => {
    const target = event.target as HTMLElement;
    const scrollTop = target.scrollTop;

    // Skip if scroll position hasn't changed
    if (scrollTop === lastScrollTop) return;
    lastScrollTop = scrollTop;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      handler(scrollTop);
      timeout = null;
    }, delay);
  };
}
