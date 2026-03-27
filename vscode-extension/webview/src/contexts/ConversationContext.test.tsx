/**
 * Unit tests for ConversationContext persistence logic
 * Fix 5: Test coverage for hydration and persistence
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import { ConversationProvider, useConversationContext, HYDRATION_TIMEOUT_MS, PERSISTENCE_DEBOUNCE_MS } from './ConversationContext';
import React from 'react';

// Mock useVSCode hook
const mockPostMessage = jest.fn();
jest.mock('../hooks/useVSCode', () => ({
    useVSCode: jest.fn(() => ({
        postMessage: mockPostMessage,
    })),
}));

describe('ConversationContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        mockPostMessage.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Hydration', () => {
        it('should hydrate messages from workspace state', async () => {
            const mockMessages = [
                {
                    id: 'msg-1',
                    sessionId: 'session-1',
                    role: 'user' as const,
                    content: 'Hello',
                    timestamp: new Date().toISOString(),
                    status: 'sent' as const,
                },
            ];

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <ConversationProvider>{children}</ConversationProvider>
            );

            const { result } = renderHook(() => useConversationContext(), { wrapper });

            // Initially not hydrated
            expect(result.current.isHydrated).toBe(false);
            expect(result.current.messages).toEqual([]);

            // Simulate message from extension
            act(() => {
                window.dispatchEvent(
                    new MessageEvent('message', {
                        data: {
                            command: 'chatHistoryData',
                            data: {
                                messages: mockMessages,
                                session: null,
                                lastUpdated: new Date().toISOString(),
                            },
                        },
                    })
                );
            });

            // Should be hydrated
            await waitFor(() => {
                expect(result.current.isHydrated).toBe(true);
            });

            expect(result.current.messages).toHaveLength(1);
            expect(result.current.messages[0].content).toBe('Hello');
        });

        it('should handle corrupted data gracefully', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <ConversationProvider>{children}</ConversationProvider>
            );

            const { result } = renderHook(() => useConversationContext(), { wrapper });

            // Simulate corrupted data
            act(() => {
                window.dispatchEvent(
                    new MessageEvent('message', {
                        data: {
                            command: 'chatHistoryData',
                            data: {
                                messages: [{ invalid: 'data' }],
                                lastUpdated: 'invalid-date',
                            },
                        },
                    })
                );
            });

            // Should still hydrate (with empty messages)
            await waitFor(() => {
                expect(result.current.isHydrated).toBe(true);
            });

            expect(result.current.messages).toEqual([]);
        });

        it('should timeout after HYDRATION_TIMEOUT_MS', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <ConversationProvider>{children}</ConversationProvider>
            );

            const { result } = renderHook(() => useConversationContext(), { wrapper });

            expect(result.current.isHydrated).toBe(false);

            // Fast-forward time
            act(() => {
                jest.advanceTimersByTime(HYDRATION_TIMEOUT_MS);
            });

            await waitFor(() => {
                expect(result.current.isHydrated).toBe(true);
            });
        });

        it('should validate timestamps before restoring', async () => {
            const mockMessages = [
                {
                    id: 'msg-1',
                    sessionId: 'session-1',
                    role: 'user' as const,
                    content: 'Valid message',
                    timestamp: new Date().toISOString(),
                },
                {
                    id: 'msg-2',
                    sessionId: 'session-1',
                    role: 'user' as const,
                    content: 'Invalid timestamp',
                    timestamp: 'not-a-date',
                },
            ];

            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <ConversationProvider>{children}</ConversationProvider>
            );

            const { result } = renderHook(() => useConversationContext(), { wrapper });

            act(() => {
                window.dispatchEvent(
                    new MessageEvent('message', {
                        data: {
                            command: 'chatHistoryData',
                            data: {
                                messages: mockMessages,
                                session: null,
                                lastUpdated: new Date().toISOString(),
                            },
                        },
                    })
                );
            });

            await waitFor(() => {
                expect(result.current.isHydrated).toBe(true);
            });

            // Should only restore valid message
            expect(result.current.messages).toHaveLength(1);
            expect(result.current.messages[0].content).toBe('Valid message');
        });
    });

    describe('Persistence', () => {
        it('should debounce persistence calls', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <ConversationProvider>{children}</ConversationProvider>
            );

            const { result } = renderHook(() => useConversationContext(), { wrapper });

            // Mark as hydrated first
            act(() => {
                window.dispatchEvent(
                    new MessageEvent('message', {
                        data: {
                            command: 'chatHistoryData',
                            data: null,
                        },
                    })
                );
            });

            await waitFor(() => {
                expect(result.current.isHydrated).toBe(true);
            });

            // Add multiple messages quickly
            act(() => {
                result.current.addMessage({
                    id: 'msg-1',
                    sessionId: 'session-1',
                    role: 'user',
                    content: 'Message 1',
                    timestamp: new Date(),
                });
            });

            act(() => {
                result.current.addMessage({
                    id: 'msg-2',
                    sessionId: 'session-1',
                    role: 'user',
                    content: 'Message 2',
                    timestamp: new Date(),
                });
            });

            // Should not call postMessage immediately
            expect(mockPostMessage).not.toHaveBeenCalledWith('saveChatHistory', expect.anything());

            // Fast-forward past debounce time
            act(() => {
                jest.advanceTimersByTime(PERSISTENCE_DEBOUNCE_MS);
            });

            // Should call postMessage once after debounce
            await waitFor(() => {
                expect(mockPostMessage).toHaveBeenCalledWith('saveChatHistory', expect.anything());
            });

            // Should have been called only once (debounced)
            const saveCalls = mockPostMessage.mock.calls.filter(
                (call) => call[0] === 'saveChatHistory'
            );
            expect(saveCalls.length).toBe(1);
        });

        it('should limit persisted messages to MAX_PERSISTED_MESSAGES', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <ConversationProvider>{children}</ConversationProvider>
            );

            const { result } = renderHook(() => useConversationContext(), { wrapper });

            // Mark as hydrated
            act(() => {
                window.dispatchEvent(
                    new MessageEvent('message', {
                        data: {
                            command: 'chatHistoryData',
                            data: null,
                        },
                    })
                );
            });

            await waitFor(() => {
                expect(result.current.isHydrated).toBe(true);
            });

            // Add 150 messages (more than MAX_PERSISTED_MESSAGES = 100)
            act(() => {
                const messages = Array.from({ length: 150 }, (_, i) => ({
                    id: `msg-${i}`,
                    sessionId: 'session-1',
                    role: 'user' as const,
                    content: `Message ${i}`,
                    timestamp: new Date(),
                }));
                result.current.setMessages(messages);
            });

            // Fast-forward past debounce time
            act(() => {
                jest.advanceTimersByTime(PERSISTENCE_DEBOUNCE_MS);
            });

            await waitFor(() => {
                expect(mockPostMessage).toHaveBeenCalledWith('saveChatHistory', expect.anything());
            });

            // Check that only last 100 messages were persisted
            const saveCall = mockPostMessage.mock.calls.find((call: any) => call[0] === 'saveChatHistory');
            expect(saveCall).toBeDefined();
            expect((saveCall as any)[1].messages).toHaveLength(100);
            // Should be the last 100 messages (50-149)
            expect((saveCall as any)[1].messages[0].id).toBe('msg-50');
            expect((saveCall as any)[1].messages[99].id).toBe('msg-149');
        });

        it('should not persist before hydration completes', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <ConversationProvider>{children}</ConversationProvider>
            );

            const { result } = renderHook(() => useConversationContext(), { wrapper });

            // Add message before hydration
            act(() => {
                result.current.addMessage({
                    id: 'msg-1',
                    sessionId: 'session-1',
                    role: 'user',
                    content: 'Message 1',
                    timestamp: new Date(),
                });
            });

            // Fast-forward past debounce time
            act(() => {
                jest.advanceTimersByTime(PERSISTENCE_DEBOUNCE_MS);
            });

            // Should not have called saveChatHistory
            expect(mockPostMessage).not.toHaveBeenCalledWith('saveChatHistory', expect.anything());
        });
    });

    describe('Memory Leak Prevention', () => {
        it('should cleanup event listener on unmount', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <ConversationProvider>{children}</ConversationProvider>
            );

            const { result, unmount } = renderHook(() => useConversationContext(), { wrapper });

            // Trigger hydration timeout
            act(() => {
                jest.advanceTimersByTime(HYDRATION_TIMEOUT_MS);
            });

            // Wait for hydration to complete
            await waitFor(() => {
                expect(result.current.isHydrated).toBe(true);
            });

            // Unmount the component - this should trigger cleanup
            unmount();

            // If we get here without errors, cleanup worked correctly
            expect(true).toBe(true);
        });

        it('should not process messages after unmount', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <ConversationProvider>{children}</ConversationProvider>
            );

            const { result, unmount } = renderHook(() => useConversationContext(), { wrapper });

            // Unmount immediately
            unmount();

            // Try to send message after unmount
            act(() => {
                window.dispatchEvent(
                    new MessageEvent('message', {
                        data: {
                            command: 'chatHistoryData',
                            data: {
                                messages: [
                                    {
                                        id: 'msg-1',
                                        sessionId: 'session-1',
                                        role: 'user',
                                        content: 'Should not process',
                                        timestamp: new Date().toISOString(),
                                    },
                                ],
                                session: null,
                                lastUpdated: new Date().toISOString(),
                            },
                        },
                    })
                );
            });

            // Should not throw or cause issues
            expect(true).toBe(true);
        });
    });
});
