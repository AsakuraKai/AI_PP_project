/**
 * Dashboard View Tests
 * 
 * Tests for the Dashboard view component including:
 * - Rendering with different states
 * - Statistics display
 * - Recent analyses list
 * - Keyboard navigation
 * - Loading states
 * - Accessibility
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from '../../src/views/Dashboard';

// Mock dependencies
jest.mock('../../src/hooks/useDashboard', () => ({
  useDashboard: () => ({
    stats: {
      totalErrors: 42,
      analyzedToday: 12,
      successRate: 85,
      avgTime: 2.5
    },
    recentAnalyses: [
      {
        id: '1',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 min ago
        status: 'success',
        errorCount: 5,
        fixesGenerated: 3
      },
      {
        id: '2',
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        status: 'partial',
        errorCount: 8,
        fixesGenerated: 4
      }
    ],
    loading: false,
    refreshStats: jest.fn()
  })
}));

describe('Dashboard', () => {
  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<Dashboard />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('displays correct heading', () => {
      render(<Dashboard />);
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    test('renders all statistics cards', () => {
      render(<Dashboard />);
      
      expect(screen.getByLabelText(/42 total errors/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/12 analyzed today/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/85 percent success rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/2\.5 seconds average time/i)).toBeInTheDocument();
    });

    test('renders recent analyses list', () => {
      render(<Dashboard />);
      
      const analyses = screen.getAllByRole('article');
      expect(analyses).toHaveLength(2);
    });
  });

  describe('Loading States', () => {
    test('displays loading skeletons when loading', () => {
      jest.mock('../../src/hooks/useDashboard', () => ({
        useDashboard: () => ({
          stats: null,
          recentAnalyses: [],
          loading: true,
          refreshStats: jest.fn()
        })
      }));

      render(<Dashboard />);
      
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    });
  });

  describe('Interactions', () => {
    test('calls refresh when refresh button is clicked', async () => {
      const refreshStats = jest.fn();
      
      jest.mock('../../src/hooks/useDashboard', () => ({
        useDashboard: () => ({
          stats: { totalErrors: 42, analyzedToday: 12, successRate: 85, avgTime: 2.5 },
          recentAnalyses: [],
          loading: false,
          refreshStats
        })
      }));

      render(<Dashboard />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await userEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(refreshStats).toHaveBeenCalled();
      });
    });

    test('navigates to new analysis when button is clicked', async () => {
      const { container } = render(<Dashboard />);
      
      const newAnalysisButton = screen.getByRole('button', { name: /new analysis/i });
      await userEvent.click(newAnalysisButton);
      
      // Check that proper event was triggered
      expect(container.querySelector('[data-view="analyze"]')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels on all interactive elements', () => {
      render(<Dashboard />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh dashboard statistics/i });
      expect(refreshButton).toHaveAttribute('aria-label');
    });

    test('statistics have screen reader accessible labels', () => {
      render(<Dashboard />);
      
      expect(screen.getByLabelText(/42 total errors/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/85 percent success rate/i)).toBeInTheDocument();
    });

    test('recent analyses have proper article role', () => {
      render(<Dashboard />);
      
      const analyses = screen.getAllByRole('article');
      expect(analyses[0]).toHaveAttribute('aria-label');
    });

    test('main content has role and label', () => {
      render(<Dashboard />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Dashboard');
    });
  });

  describe('Keyboard Navigation', () => {
    test('all interactive elements are focusable', () => {
      render(<Dashboard />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    test('focus ring classes are applied', () => {
      render(<Dashboard />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton.className).toContain('focus-ring');
    });
  });

  describe('Empty States', () => {
    test('displays empty state when no recent analyses', () => {
      jest.mock('../../src/hooks/useDashboard', () => ({
        useDashboard: () => ({
          stats: { totalErrors: 0, analyzedToday: 0, successRate: 0, avgTime: 0 },
          recentAnalyses: [],
          loading: false,
          refreshStats: jest.fn()
        })
      }));

      render(<Dashboard />);
      
      expect(screen.getByText(/no analyses yet/i)).toBeInTheDocument();
    });
  });
});
