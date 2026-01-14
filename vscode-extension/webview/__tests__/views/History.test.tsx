/**
 * History View Tests
 * 
 * Tests for the History view component including:
 * - Timeline rendering
 * - Search and filters
 * - Keyboard navigation through timeline items
 * - Loading states
 * - Accessibility
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { History } from '../../src/views/History';

// Mock dependencies
const mockHistoryData = [
  {
    id: '1',
    timestamp: new Date('2024-01-15T10:30:00').getTime(),
    title: 'Android Build Error Analysis',
    status: 'success',
    errorCount: 5,
    fixesGenerated: 3,
    duration: 2500
  },
  {
    id: '2',
    timestamp: new Date('2024-01-14T15:20:00').getTime(),
    title: 'Gradle Configuration Issue',
    status: 'partial',
    errorCount: 8,
    fixesGenerated: 4,
    duration: 3200
  },
  {
    id: '3',
    timestamp: new Date('2024-01-13T09:15:00').getTime(),
    title: 'ProGuard Optimization Failed',
    status: 'failed',
    errorCount: 12,
    fixesGenerated: 0,
    duration: 1800
  }
];

jest.mock('../../src/hooks/useHistory', () => ({
  useHistory: () => ({
    historyItems: mockHistoryData,
    loading: false,
    searchQuery: '',
    setSearchQuery: jest.fn(),
    statusFilter: 'all',
    setStatusFilter: jest.fn(),
    deleteHistoryItem: jest.fn(),
    rerunAnalysis: jest.fn(),
    exportHistory: jest.fn()
  })
}));

describe('History', () => {
  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<History />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('displays correct heading', () => {
      render(<History />);
      expect(screen.getByRole('heading', { name: /analysis history/i })).toBeInTheDocument();
    });

    test('renders all timeline items', () => {
      render(<History />);
      
      const timelineItems = screen.getAllByRole('article');
      expect(timelineItems).toHaveLength(3);
    });

    test('displays timeline item details correctly', () => {
      render(<History />);
      
      expect(screen.getByText('Android Build Error Analysis')).toBeInTheDocument();
      expect(screen.getByText('Gradle Configuration Issue')).toBeInTheDocument();
      expect(screen.getByText('ProGuard Optimization Failed')).toBeInTheDocument();
    });
  });

  describe('Search and Filters', () => {
    test('search input is rendered', () => {
      render(<History />);
      
      const searchInput = screen.getByRole('searchbox', { name: /search history/i });
      expect(searchInput).toBeInTheDocument();
    });

    test('can type in search input', async () => {
      const setSearchQuery = jest.fn();
      jest.mock('../../src/hooks/useHistory', () => ({
        useHistory: () => ({
          historyItems: mockHistoryData,
          loading: false,
          searchQuery: '',
          setSearchQuery,
          statusFilter: 'all',
          setStatusFilter: jest.fn(),
          deleteHistoryItem: jest.fn(),
          rerunAnalysis: jest.fn(),
          exportHistory: jest.fn()
        })
      }));

      render(<History />);
      
      const searchInput = screen.getByRole('searchbox');
      await userEvent.type(searchInput, 'gradle');
      
      await waitFor(() => {
        expect(setSearchQuery).toHaveBeenCalled();
      });
    });

    test('status filter is rendered', () => {
      render(<History />);
      
      const statusFilter = screen.getByLabelText(/filter by status/i);
      expect(statusFilter).toBeInTheDocument();
    });

    test('can change status filter', async () => {
      const setStatusFilter = jest.fn();
      jest.mock('../../src/hooks/useHistory', () => ({
        useHistory: () => ({
          historyItems: mockHistoryData,
          loading: false,
          searchQuery: '',
          setSearchQuery: jest.fn(),
          statusFilter: 'all',
          setStatusFilter,
          deleteHistoryItem: jest.fn(),
          rerunAnalysis: jest.fn(),
          exportHistory: jest.fn()
        })
      }));

      render(<History />);
      
      const statusFilter = screen.getByLabelText(/filter by status/i);
      await userEvent.click(statusFilter);
      
      const successOption = screen.getByText('Success');
      await userEvent.click(successOption);
      
      await waitFor(() => {
        expect(setStatusFilter).toHaveBeenCalledWith('success');
      });
    });
  });

  describe('Timeline Interactions', () => {
    test('can expand timeline item', async () => {
      render(<History />);
      
      const firstItem = screen.getAllByRole('article')[0];
      const expandButton = within(firstItem).getByRole('button', { name: /view details/i });
      
      await userEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText(/details expanded/i)).toBeInTheDocument();
      });
    });

    test('can rerun analysis from timeline item', async () => {
      const rerunAnalysis = jest.fn();
      jest.mock('../../src/hooks/useHistory', () => ({
        useHistory: () => ({
          historyItems: mockHistoryData,
          loading: false,
          searchQuery: '',
          setSearchQuery: jest.fn(),
          statusFilter: 'all',
          setStatusFilter: jest.fn(),
          deleteHistoryItem: jest.fn(),
          rerunAnalysis,
          exportHistory: jest.fn()
        })
      }));

      render(<History />);
      
      const firstItem = screen.getAllByRole('article')[0];
      const rerunButton = within(firstItem).getByRole('button', { name: /rerun analysis/i });
      
      await userEvent.click(rerunButton);
      
      await waitFor(() => {
        expect(rerunAnalysis).toHaveBeenCalledWith('1');
      });
    });

    test('can delete timeline item', async () => {
      const deleteHistoryItem = jest.fn();
      jest.mock('../../src/hooks/useHistory', () => ({
        useHistory: () => ({
          historyItems: mockHistoryData,
          loading: false,
          searchQuery: '',
          setSearchQuery: jest.fn(),
          statusFilter: 'all',
          setStatusFilter: jest.fn(),
          deleteHistoryItem,
          rerunAnalysis: jest.fn(),
          exportHistory: jest.fn()
        })
      }));

      render(<History />);
      
      const firstItem = screen.getAllByRole('article')[0];
      const deleteButton = within(firstItem).getByRole('button', { name: /delete/i });
      
      await userEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(deleteHistoryItem).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('timeline items are keyboard navigable', () => {
      render(<History />);
      
      const timelineItems = screen.getAllByRole('article');
      timelineItems.forEach(item => {
        expect(item).toHaveAttribute('tabindex', '0');
      });
    });

    test('arrow keys navigate through timeline items', async () => {
      render(<History />);
      
      const timelineItems = screen.getAllByRole('article');
      const firstItem = timelineItems[0];
      
      firstItem.focus();
      expect(document.activeElement).toBe(firstItem);
      
      await userEvent.keyboard('{ArrowDown}');
      
      await waitFor(() => {
        expect(document.activeElement).toBe(timelineItems[1]);
      });
    });

    test('Home key moves to first timeline item', async () => {
      render(<History />);
      
      const timelineItems = screen.getAllByRole('article');
      timelineItems[2].focus();
      
      await userEvent.keyboard('{Home}');
      
      await waitFor(() => {
        expect(document.activeElement).toBe(timelineItems[0]);
      });
    });

    test('End key moves to last timeline item', async () => {
      render(<History />);
      
      const timelineItems = screen.getAllByRole('article');
      timelineItems[0].focus();
      
      await userEvent.keyboard('{End}');
      
      await waitFor(() => {
        expect(document.activeElement).toBe(timelineItems[2]);
      });
    });
  });

  describe('Loading States', () => {
    test('displays loading skeletons when loading', () => {
      jest.mock('../../src/hooks/useHistory', () => ({
        useHistory: () => ({
          historyItems: [],
          loading: true,
          searchQuery: '',
          setSearchQuery: jest.fn(),
          statusFilter: 'all',
          setStatusFilter: jest.fn(),
          deleteHistoryItem: jest.fn(),
          rerunAnalysis: jest.fn(),
          exportHistory: jest.fn()
        })
      }));

      render(<History />);
      
      const loadingIndicators = screen.getAllByRole('status');
      expect(loadingIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Empty States', () => {
    test('displays empty state when no history items', () => {
      jest.mock('../../src/hooks/useHistory', () => ({
        useHistory: () => ({
          historyItems: [],
          loading: false,
          searchQuery: '',
          setSearchQuery: jest.fn(),
          statusFilter: 'all',
          setStatusFilter: jest.fn(),
          deleteHistoryItem: jest.fn(),
          rerunAnalysis: jest.fn(),
          exportHistory: jest.fn()
        })
      }));

      render(<History />);
      
      expect(screen.getByText(/no history found/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('main content has proper role and label', () => {
      render(<History />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Analysis History');
    });

    test('timeline items have descriptive ARIA labels', () => {
      render(<History />);
      
      const firstItem = screen.getAllByRole('article')[0];
      expect(firstItem).toHaveAttribute('aria-label');
      expect(firstItem.getAttribute('aria-label')).toContain('Android Build Error Analysis');
    });

    test('all interactive elements have ARIA labels', () => {
      render(<History />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    test('search and filter have proper labels', () => {
      render(<History />);
      
      expect(screen.getByRole('searchbox')).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    test('announces filter changes', async () => {
      const { container } = render(<History />);
      
      const statusFilter = screen.getByLabelText(/filter by status/i);
      await userEvent.click(statusFilter);
      
      const successOption = screen.getByText('Success');
      await userEvent.click(successOption);
      
      await waitFor(() => {
        const liveRegion = container.querySelector('[role="status"]');
        expect(liveRegion).toBeInTheDocument();
      });
    });

    test('announces timeline item expansion', async () => {
      const { container } = render(<History />);
      
      const firstItem = screen.getAllByRole('article')[0];
      const expandButton = within(firstItem).getByRole('button', { name: /view details/i });
      
      await userEvent.click(expandButton);
      
      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live]');
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });
});
