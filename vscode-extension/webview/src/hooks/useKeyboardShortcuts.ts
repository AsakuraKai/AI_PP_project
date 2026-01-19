/**
 * useKeyboardShortcuts - Global keyboard shortcuts for the chat widget
 * Phase 6: UI Polish & Accessibility
 * 
 * Provides global keyboard shortcuts that work across the entire application
 */

import { useEffect } from 'react';

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    handler: (e: KeyboardEvent) => void;
    description?: string;
}

/**
 * Hook to register global keyboard shortcuts
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 'k',
 *     ctrl: true,
 *     handler: () => focusChatInput(),
 *     description: 'Focus chat input'
 *   },
 *   {
 *     key: 'Escape',
 *     handler: () => closeChat(),
 *     description: 'Close chat'
 *   }
 * ]);
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check each shortcut
            for (const shortcut of shortcuts) {
                const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey || e.ctrlKey;
                const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey || e.shiftKey;
                const altMatch = shortcut.alt ? e.altKey : !e.altKey || e.altKey;
                const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey || e.metaKey;

                // More precise matching
                const ctrlPressed = shortcut.ctrl ? e.ctrlKey : true;
                const shiftPressed = shortcut.shift ? e.shiftKey : true;
                const altPressed = shortcut.alt ? e.altKey : true;
                const metaPressed = shortcut.meta ? e.metaKey : true;

                // Check if modifier keys that are NOT required are also NOT pressed
                const noExtraCtrl = !shortcut.ctrl ? !e.ctrlKey : true;
                const noExtraShift = !shortcut.shift ? !e.shiftKey : true;
                const noExtraAlt = !shortcut.alt ? !e.altKey : true;
                const noExtraMeta = !shortcut.meta ? !e.metaKey : true;

                if (
                    e.key.toLowerCase() === shortcut.key.toLowerCase() &&
                    ctrlPressed &&
                    shiftPressed &&
                    altPressed &&
                    metaPressed &&
                    noExtraCtrl &&
                    noExtraShift &&
                    noExtraAlt &&
                    noExtraMeta
                ) {
                    shortcut.handler(e);
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

/**
 * Default keyboard shortcuts for the chat widget
 */
export const CHAT_SHORTCUTS = {
    FOCUS_INPUT: {
        key: 'k',
        ctrl: true,
        description: 'Focus chat input (Ctrl+K)'
    },
    TOGGLE_CHAT: {
        key: 'c',
        ctrl: true,
        shift: true,
        description: 'Toggle chat widget (Ctrl+Shift+C)'
    },
    CLOSE_CHAT: {
        key: 'Escape',
        description: 'Close chat widget (Escape)'
    },
} as const;
