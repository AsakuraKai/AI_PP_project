/**
 * Jest Test Setup
 * 
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll } from '@jest/globals';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock VS Code API
global.acquireVsCodeApi = () => ({
  postMessage: jest.fn(),
  setState: jest.fn(),
  getState: jest.fn(),
});

// Mock window.matchMedia for reduced motion and responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Suppress console errors in tests (optional)
beforeAll(() => {
  // Only suppress expected errors, not all errors
  const originalError = console.error;
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    // Suppress specific React warnings that are expected in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: useLayoutEffect'))
    ) {
      return;
    }
    originalError(...args);
  });
});
