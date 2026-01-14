/**
 * Centralized ID Generator
 * Provides guaranteed unique IDs for all entities in the system
 */

class IDGenerator {
    private static _instance: IDGenerator;
    private _counter: number = 0;

    private constructor() {
        // Private constructor for singleton
    }

    static getInstance(): IDGenerator {
        if (!IDGenerator._instance) {
            IDGenerator._instance = new IDGenerator();
        }
        return IDGenerator._instance;
    }

    /**
     * Generate unique ID with auto-incrementing counter
     * @param prefix Optional prefix for the ID (e.g., 'error', 'fix', 'analysis')
     * @param context Optional context data to include in hash
     * @returns Unique base64 ID
     */
    generateId(prefix: string = 'id', context?: Record<string, any>): string {
        this._counter++;

        // Build hash string
        const timestamp = Date.now();
        const contextStr = context
            ? Object.entries(context)
                .map(([k, v]) => `${k}:${v}`)
                .join('|')
            : '';

        const hashInput = `${prefix}-${this._counter}-${timestamp}-${contextStr}`;
        const hash = Buffer.from(hashInput).toString('base64');

        // Return first 24 characters for reasonable length
        return hash.slice(0, 24);
    }

    /**
     * Generate sequential counter-based ID (simple incrementing number)
     * @returns Number representing the current counter
     */
    generateCounter(): number {
        this._counter++;
        return this._counter;
    }

    /**
     * Get current counter value without incrementing
     */
    getCurrentCounter(): number {
        return this._counter;
    }

    /**
     * Reset counter (useful for testing or regeneration)
     */
    resetCounter(): void {
        this._counter = 0;
    }
}

// Export singleton instance
export const idGenerator = IDGenerator.getInstance();
