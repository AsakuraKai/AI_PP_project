/**
 * AgentState View Tests
 * 
 * Tests for the AgentState view component including:
 * - Phase status display and transitions
 * - Thought process rendering
 * - Live region updates
 * - Loading states
 * - Accessibility with screen readers
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentState } from '../../src/views/AgentState';

// Mock agent state data
const mockAgentState = {
  status: 'analyzing',
  currentPhase: 'root_cause_analysis',
  progress: 65,
  thoughts: [
    {
      id: '1',
      phase: 'error_detection',
      content: 'Identified 5 errors in build output',
      timestamp: Date.now() - 5000,
      confidence: 0.95
    },
    {
      id: '2',
      phase: 'root_cause_analysis',
      content: 'Analyzing dependency conflicts...',
      timestamp: Date.now() - 2000,
      confidence: 0.80
    }
  ],
  stats: {
    totalErrors: 5,
    errorsAnalyzed: 3,
    fixesGenerated: 2,
    confidence: 0.87
  }
};

jest.mock('../../src/hooks/useAgentState', () => ({
  useAgentState: () => ({
    agentState: mockAgentState,
    loading: false,
    pauseAgent: jest.fn(),
    resumeAgent: jest.fn(),
    stopAgent: jest.fn()
  })
}));

describe('AgentState', () => {
  describe('Rendering', () => {
    test('renders without crashing', () => {
      render(<AgentState />);
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('displays correct heading', () => {
      render(<AgentState />);
      expect(screen.getByRole('heading', { name: /agent state/i })).toBeInTheDocument();
    });

    test('displays current phase correctly', () => {
      render(<AgentState />);
      expect(screen.getByText(/root cause analysis/i)).toBeInTheDocument();
    });

    test('displays progress bar with correct value', () => {
      render(<AgentState />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '65');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    test('renders all statistics cards', () => {
      render(<AgentState />);
      
      expect(screen.getByLabelText(/5 total errors/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/3 errors analyzed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/2 fixes generated/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/87 percent confidence/i)).toBeInTheDocument();
    });

    test('renders thought process list', () => {
      render(<AgentState />);
      
      expect(screen.getByText('Identified 5 errors in build output')).toBeInTheDocument();
      expect(screen.getByText('Analyzing dependency conflicts...')).toBeInTheDocument();
    });
  });

  describe('Phase Status', () => {
    test('displays phase badge with correct variant', () => {
      render(<AgentState />);
      
      const phaseBadge = screen.getByText(/root cause analysis/i);
      expect(phaseBadge).toBeInTheDocument();
    });

    test('shows status indicator with correct state', () => {
      render(<AgentState />);
      
      const statusIndicator = screen.getByLabelText(/status: analyzing/i);
      expect(statusIndicator).toBeInTheDocument();
    });
  });

  describe('Control Actions', () => {
    test('pause button is rendered when analyzing', () => {
      render(<AgentState />);
      
      const pauseButton = screen.getByRole('button', { name: /pause agent/i });
      expect(pauseButton).toBeInTheDocument();
    });

    test('calls pauseAgent when pause button is clicked', async () => {
      const pauseAgent = jest.fn();
      jest.mock('../../src/hooks/useAgentState', () => ({
        useAgentState: () => ({
          agentState: mockAgentState,
          loading: false,
          pauseAgent,
          resumeAgent: jest.fn(),
          stopAgent: jest.fn()
        })
      }));

      render(<AgentState />);
      
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await userEvent.click(pauseButton);
      
      await waitFor(() => {
        expect(pauseAgent).toHaveBeenCalled();
      });
    });

    test('calls stopAgent when stop button is clicked', async () => {
      const stopAgent = jest.fn();
      jest.mock('../../src/hooks/useAgentState', () => ({
        useAgentState: () => ({
          agentState: mockAgentState,
          loading: false,
          pauseAgent: jest.fn(),
          resumeAgent: jest.fn(),
          stopAgent
        })
      }));

      render(<AgentState />);
      
      const stopButton = screen.getByRole('button', { name: /stop/i });
      await userEvent.click(stopButton);
      
      await waitFor(() => {
        expect(stopAgent).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    test('displays loading skeletons when loading', () => {
      jest.mock('../../src/hooks/useAgentState', () => ({
        useAgentState: () => ({
          agentState: null,
          loading: true,
          pauseAgent: jest.fn(),
          resumeAgent: jest.fn(),
          stopAgent: jest.fn()
        })
      }));

      render(<AgentState />);
      
      const loadingIndicators = screen.getAllByRole('status');
      expect(loadingIndicators.length).toBeGreaterThan(0);
    });

    test('shows StatsCardSkeleton for loading statistics', () => {
      jest.mock('../../src/hooks/useAgentState', () => ({
        useAgentState: () => ({
          agentState: null,
          loading: true,
          pauseAgent: jest.fn(),
          resumeAgent: jest.fn(),
          stopAgent: jest.fn()
        })
      }));

      render(<AgentState />);
      
      // Should have 4 skeleton cards for stats
      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Empty States', () => {
    test('displays idle state when agent is not active', () => {
      jest.mock('../../src/hooks/useAgentState', () => ({
        useAgentState: () => ({
          agentState: { ...mockAgentState, status: 'idle' },
          loading: false,
          pauseAgent: jest.fn(),
          resumeAgent: jest.fn(),
          stopAgent: jest.fn()
        })
      }));

      render(<AgentState />);
      
      expect(screen.getByText(/agent is idle/i)).toBeInTheDocument();
    });

    test('displays empty thought process message', () => {
      jest.mock('../../src/hooks/useAgentState', () => ({
        useAgentState: () => ({
          agentState: { ...mockAgentState, thoughts: [] },
          loading: false,
          pauseAgent: jest.fn(),
          resumeAgent: jest.fn(),
          stopAgent: jest.fn()
        })
      }));

      render(<AgentState />);
      
      expect(screen.getByText(/no thoughts yet/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('main content has proper role and label', () => {
      render(<AgentState />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', 'Agent State Monitor');
    });

    test('progress bar has descriptive label', () => {
      render(<AgentState />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label');
      expect(progressBar.getAttribute('aria-label')).toContain('65%');
    });

    test('statistics have screen reader labels', () => {
      render(<AgentState />);
      
      expect(screen.getByLabelText(/5 total errors/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/3 errors analyzed/i)).toBeInTheDocument();
    });

    test('control buttons have ARIA labels', () => {
      render(<AgentState />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    test('thought items have proper article role', () => {
      render(<AgentState />);
      
      const thoughts = screen.getAllByRole('article');
      expect(thoughts.length).toBe(2);
      thoughts.forEach(thought => {
        expect(thought).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Live Regions', () => {
    test('has live region for status updates', () => {
      const { container } = render(<AgentState />);
      
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    test('announces phase changes to screen readers', async () => {
      const { container, rerender } = render(<AgentState />);
      
      // Update to new phase
      jest.mock('../../src/hooks/useAgentState', () => ({
        useAgentState: () => ({
          agentState: {
            ...mockAgentState,
            currentPhase: 'fix_generation'
          },
          loading: false,
          pauseAgent: jest.fn(),
          resumeAgent: jest.fn(),
          stopAgent: jest.fn()
        })
      }));

      rerender(<AgentState />);
      
      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live]');
        expect(liveRegion).toBeInTheDocument();
      });
    });

    test('status region has appropriate aria-atomic', () => {
      const { container } = render(<AgentState />);
      
      const statusRegion = container.querySelector('[role="status"]');
      expect(statusRegion).toBeInTheDocument();
    });
  });

  describe('Thought Process', () => {
    test('displays thoughts in chronological order', () => {
      render(<AgentState />);
      
      const thoughts = screen.getAllByRole('article');
      expect(thoughts[0]).toHaveTextContent('Identified 5 errors');
      expect(thoughts[1]).toHaveTextContent('Analyzing dependency');
    });

    test('shows confidence level for each thought', () => {
      render(<AgentState />);
      
      expect(screen.getByText(/95% confidence/i)).toBeInTheDocument();
      expect(screen.getByText(/80% confidence/i)).toBeInTheDocument();
    });

    test('displays phase badge for each thought', () => {
      render(<AgentState />);
      
      expect(screen.getByText(/error detection/i)).toBeInTheDocument();
      expect(screen.getByText(/root cause analysis/i)).toBeInTheDocument();
    });

    test('shows timestamp for each thought', () => {
      render(<AgentState />);
      
      const articles = screen.getAllByRole('article');
      articles.forEach(article => {
        expect(article).toHaveTextContent(/ago|seconds|minutes/i);
      });
    });
  });

  describe('Dynamic Updates', () => {
    test('updates progress bar when progress changes', async () => {
      const { rerender } = render(<AgentState />);
      
      const initialProgress = screen.getByRole('progressbar');
      expect(initialProgress).toHaveAttribute('aria-valuenow', '65');
      
      // Update progress
      jest.mock('../../src/hooks/useAgentState', () => ({
        useAgentState: () => ({
          agentState: { ...mockAgentState, progress: 85 },
          loading: false,
          pauseAgent: jest.fn(),
          resumeAgent: jest.fn(),
          stopAgent: jest.fn()
        })
      }));

      rerender(<AgentState />);
      
      await waitFor(() => {
        const updatedProgress = screen.getByRole('progressbar');
        expect(updatedProgress).toHaveAttribute('aria-valuenow', '85');
      });
    });

    test('adds new thoughts to the list', async () => {
      const { rerender } = render(<AgentState />);
      
      expect(screen.getAllByRole('article')).toHaveLength(2);
      
      // Add new thought
      jest.mock('../../src/hooks/useAgentState', () => ({
        useAgentState: () => ({
          agentState: {
            ...mockAgentState,
            thoughts: [
              ...mockAgentState.thoughts,
              {
                id: '3',
                phase: 'fix_generation',
                content: 'Generated 2 code fixes',
                timestamp: Date.now(),
                confidence: 0.92
              }
            ]
          },
          loading: false,
          pauseAgent: jest.fn(),
          resumeAgent: jest.fn(),
          stopAgent: jest.fn()
        })
      }));

      rerender(<AgentState />);
      
      await waitFor(() => {
        expect(screen.getAllByRole('article')).toHaveLength(3);
        expect(screen.getByText('Generated 2 code fixes')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('all control buttons are keyboard focusable', () => {
      render(<AgentState />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    test('focus ring is applied to interactive elements', () => {
      render(<AgentState />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.className).toContain('focus-ring');
      });
    });
  });
});
