export interface IDisposable {
  dispose(): void;
}

/**
 * Collects disposables and disposes in reverse order.
 */
export class DisposableStore implements IDisposable {
  private items: IDisposable[] = [];
  private isDisposed = false;

  add<T extends IDisposable>(item: T): T {
    if (this.isDisposed) {
      item.dispose();
      throw new Error('DisposableStore already disposed');
    }

    this.items.push(item);
    return item;
  }

  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      try {
        this.items[i].dispose();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error disposing item:', error);
      }
    }

    this.items = [];
  }
}
