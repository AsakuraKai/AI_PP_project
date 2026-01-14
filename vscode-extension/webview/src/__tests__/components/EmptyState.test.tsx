/**
 * EmptyState Component Tests
 * 
 * Tests for the reusable EmptyState component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/EmptyState';
import { Calendar } from 'lucide-react';

describe('EmptyState Component', () => {
  it('renders without crashing', () => {
    render(
      <EmptyState
        icon={Calendar}
        title="No Data"
        description="There is no data to display."
      />
    );
    
    expect(screen.getByText('No Data')).toBeInTheDocument();
    expect(screen.getByText('There is no data to display.')).toBeInTheDocument();
  });

  it('renders with action button when provided', () => {
    const handleAction = jest.fn();
    
    render(
      <EmptyState
        icon={Calendar}
        title="No Data"
        description="There is no data to display."
        action={{
          label: 'Add Data',
          onClick: handleAction
        }}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Add Data' });
    expect(button).toBeInTheDocument();
  });

  it('calls action handler when button is clicked', async () => {
    const user = userEvent.setup();
    const handleAction = jest.fn();
    
    render(
      <EmptyState
        icon={Calendar}
        title="No Data"
        description="There is no data to display."
        action={{
          label: 'Add Data',
          onClick: handleAction
        }}
      />
    );
    
    const button = screen.getByRole('button', { name: 'Add Data' });
    await user.click(button);
    
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    render(
      <EmptyState
        icon={Calendar}
        title="No Data"
        description="There is no data to display."
      />
    );
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <EmptyState
        icon={Calendar}
        title="No Data"
        description="There is no data to display."
      />
    );
    
    // Check for live region
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});
