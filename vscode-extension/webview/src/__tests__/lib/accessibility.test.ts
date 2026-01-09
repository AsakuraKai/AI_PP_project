/**
 * Accessibility Utilities Tests
 * 
 * Tests for keyboard navigation and screen reader helpers
 */

import { handleListKeyboard, createButtonProps, announce } from '@/lib/accessibility';

describe('Accessibility Utilities', () => {
  describe('handleListKeyboard', () => {
    it('navigates down with ArrowDown key', () => {
      const onNavigate = jest.fn();
      const event = {
        key: 'ArrowDown',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any;

      handleListKeyboard(event, {
        currentIndex: 0,
        itemCount: 5,
        onNavigate,
        wrap: false
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(1);
    });

    it('navigates up with ArrowUp key', () => {
      const onNavigate = jest.fn();
      const event = {
        key: 'ArrowUp',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any;

      handleListKeyboard(event, {
        currentIndex: 2,
        itemCount: 5,
        onNavigate,
        wrap: false
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(1);
    });

    it('calls onSelect when Enter is pressed', () => {
      const onSelect = jest.fn();
      const event = {
        key: 'Enter',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any;

      handleListKeyboard(event, {
        currentIndex: 0,
        itemCount: 5,
        onSelect,
        wrap: false
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onSelect).toHaveBeenCalled();
    });

    it('wraps around when wrap is true', () => {
      const onNavigate = jest.fn();
      const event = {
        key: 'ArrowDown',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any;

      handleListKeyboard(event, {
        currentIndex: 4,
        itemCount: 5,
        onNavigate,
        wrap: true
      });

      expect(onNavigate).toHaveBeenCalledWith(0);
    });

    it('does not wrap when wrap is false', () => {
      const onNavigate = jest.fn();
      const event = {
        key: 'ArrowDown',
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
      } as any;

      handleListKeyboard(event, {
        currentIndex: 4,
        itemCount: 5,
        onNavigate,
        wrap: false
      });

      expect(onNavigate).not.toHaveBeenCalled();
    });
  });

  describe('createButtonProps', () => {
    it('creates proper button accessibility props', () => {
      const props = createButtonProps('Click me to do something');
      
      expect(props).toHaveProperty('aria-label', 'Click me to do something');
    });

    it('returns object with aria-label', () => {
      const props = createButtonProps('Test label');
      
      expect(typeof props).toBe('object');
      expect(Object.keys(props)).toContain('aria-label');
    });
  });

  describe('announce', () => {
    beforeEach(() => {
      // Clear any existing live regions
      document.body.innerHTML = '';
    });

    it('creates live region with message', () => {
      announce('Test message', 'polite');
      
      const liveRegion = document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion?.textContent).toBe('Test message');
    });

    it('creates assertive live region', () => {
      announce('Important message', 'assertive');
      
      const liveRegion = document.querySelector('[aria-live="assertive"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('removes live region after delay', async () => {
      jest.useFakeTimers();
      
      announce('Test message', 'polite');
      
      expect(document.querySelector('[aria-live]')).toBeInTheDocument();
      
      jest.advanceTimersByTime(1000);
      
      expect(document.querySelector('[aria-live]')).not.toBeInTheDocument();
      
      jest.useRealTimers();
    });
  });
});
