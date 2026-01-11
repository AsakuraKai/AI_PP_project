/**
 * Accessibility Utilities
 * 
 * WCAG 2.1 AA compliance helpers for:
 * - Keyboard navigation
 * - ARIA labels
 * - Focus management
 * - Screen reader announcements
 */

/**
 * Keyboard navigation key codes
 */
export const Keys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Handle keyboard navigation for list items
 * Arrow up/down to navigate, Enter/Space to select
 */
export function handleListKeyboard(
  event: React.KeyboardEvent,
  options: {
    currentIndex: number;
    itemCount: number;
    onNavigate: (index: number) => void;
    onSelect?: (index: number) => void;
    wrap?: boolean; // Wrap to first/last item
  }
) {
  const { currentIndex, itemCount, onNavigate, onSelect, wrap = true } = options;

  switch (event.key) {
    case Keys.ARROW_DOWN:
      event.preventDefault();
      if (currentIndex < itemCount - 1) {
        onNavigate(currentIndex + 1);
      } else if (wrap) {
        onNavigate(0);
      }
      break;

    case Keys.ARROW_UP:
      event.preventDefault();
      if (currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (wrap) {
        onNavigate(itemCount - 1);
      }
      break;

    case Keys.HOME:
      event.preventDefault();
      onNavigate(0);
      break;

    case Keys.END:
      event.preventDefault();
      onNavigate(itemCount - 1);
      break;

    case Keys.ENTER:
    case Keys.SPACE:
      event.preventDefault();
      onSelect?.(currentIndex);
      break;
  }
}

/**
 * Create accessible button props
 */
export function createButtonProps(label: string, onClick?: () => void) {
  const props: any = {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
  };

  if (onClick) {
    props.onClick = onClick;
    props.onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === Keys.ENTER || e.key === Keys.SPACE) {
        e.preventDefault();
        onClick();
      }
    };
  }

  return props;
}

/**
 * Create live region for screen reader announcements
 */
export function createLiveRegion(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
) {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', politeness);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only'; // Screen reader only
  region.textContent = message;

  document.body.appendChild(region);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(region);
  }, 1000);
}

/**
 * Announce message to screen readers
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  createLiveRegion(message, priority);
}

/**
 * Focus trap for modals/dialogs
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== Keys.TAB) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift + Tab on first element → focus last
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement?.focus();
    }
    // Tab on last element → focus first
    else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement?.focus();
    }
  };

  return handleKeyDown;
}

/**
 * Generate unique ID for ARIA labels
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Create ARIA describedby relationship
 */
export function createDescribedBy(elementId: string, descriptionId: string) {
  return {
    id: elementId,
    'aria-describedby': descriptionId,
  };
}

/**
 * Create ARIA labelledby relationship
 */
export function createLabelledBy(elementId: string, labelId: string) {
  return {
    id: elementId,
    'aria-labelledby': labelId,
  };
}

/**
 * Get appropriate ARIA role for element
 */
export function getAriaRole(element: 'list' | 'table' | 'menu' | 'dialog' | 'alert') {
  const roles = {
    list: 'list',
    table: 'table',
    menu: 'menu',
    dialog: 'dialog',
    alert: 'alert',
  };
  return roles[element];
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Accessible status badge props
 */
export function createStatusProps(
  status: 'success' | 'error' | 'warning' | 'info',
  label: string
) {
  const ariaLabels = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  };

  return {
    role: 'status',
    'aria-label': `${ariaLabels[status]}: ${label}`,
  };
}

/**
 * Accessible progress props
 */
export function createProgressProps(current: number, total: number, label?: string) {
  const percentage = Math.round((current / total) * 100);

  return {
    role: 'progressbar',
    'aria-valuenow': current,
    'aria-valuemin': 0,
    'aria-valuemax': total,
    'aria-valuetext': label || `${percentage}% complete`,
  };
}

/**
 * Skip link for keyboard navigation
 */
export function SkipLink({ targetId, children }: { targetId: string; children: React.ReactNode }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-zinc-900 focus:text-zinc-50 focus:px-4 focus:py-2 focus:rounded"
    >
      {children}
    </a>
  );
}

/**
 * Screen reader only text
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}
