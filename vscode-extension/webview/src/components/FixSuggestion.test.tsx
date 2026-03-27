import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FixSuggestion, CodeFix } from './FixSuggestion';

describe('FixSuggestion', () => {
  const mockFix: CodeFix = {
    id: 'test-fix-1',
    filePath: '/path/to/file.ts',
    description: 'Fix the bug in the code',
    diff: '+  const fixed = true;\n-  const broken = false;',
    confidence: 0.85,
  };

  const mockOnApply = jest.fn();

  beforeEach(() => {
    mockOnApply.mockClear();
  });

  it('renders fix information correctly', () => {
    render(<FixSuggestion fix={mockFix} onApply={mockOnApply} />);

    expect(screen.getByText('file.ts')).toBeInTheDocument();
    expect(screen.getByText('Fix the bug in the code')).toBeInTheDocument();
    expect(screen.getByText('85% confidence')).toBeInTheDocument();
  });

  it('renders diff with +/- lines when expanded', () => {
    render(<FixSuggestion fix={mockFix} onApply={mockOnApply} />);

    const expandButton = screen.getByRole('button', { name: '' });
    fireEvent.click(expandButton);

    const diffLines = screen.getAllByRole('row');
    expect(diffLines).toHaveLength(2);
    expect(diffLines[0]).toHaveClass('diff-add');
    expect(diffLines[1]).toHaveClass('diff-remove');
  });

  it('shows empty diff fallback when diff is empty', () => {
    const emptyFix = { ...mockFix, diff: '' };
    render(<FixSuggestion fix={emptyFix} onApply={mockOnApply} />);

    const expandButton = screen.getByRole('button', { name: '' });
    fireEvent.click(expandButton);

    expect(screen.getByText(/Manual fix required/i)).toBeInTheDocument();
    expect(screen.getByText(/Automatic code diff not available/i)).toBeInTheDocument();
  });

  it('calls onApply when Apply button is clicked', () => {
    render(<FixSuggestion fix={mockFix} onApply={mockOnApply} />);

    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith('test-fix-1');
    expect(mockOnApply).toHaveBeenCalledTimes(1);
  });

  it('shows Applied badge after applying fix', () => {
    render(<FixSuggestion fix={mockFix} onApply={mockOnApply} />);

    const applyButton = screen.getByRole('button', { name: /apply/i });
    fireEvent.click(applyButton);

    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /apply/i })).not.toBeInTheDocument();
  });

  it('toggles expand/collapse state', () => {
    render(<FixSuggestion fix={mockFix} onApply={mockOnApply} />);

    expect(screen.queryByText('Code Changes')).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: '' });
    fireEvent.click(expandButton);

    expect(screen.getByText('Code Changes')).toBeInTheDocument();

    fireEvent.click(expandButton);

    expect(screen.queryByText('Code Changes')).not.toBeInTheDocument();
  });

  it('displays correct confidence color for high confidence', () => {
    const highConfidenceFix = { ...mockFix, confidence: 0.9 };
    render(<FixSuggestion fix={highConfidenceFix} onApply={mockOnApply} />);

    const badge = screen.getByText('90% confidence');
    expect(badge).toHaveClass('text-green-400');
  });

  it('displays correct confidence color for medium confidence', () => {
    const mediumConfidenceFix = { ...mockFix, confidence: 0.7 };
    render(<FixSuggestion fix={mediumConfidenceFix} onApply={mockOnApply} />);

    const badge = screen.getByText('70% confidence');
    expect(badge).toHaveClass('text-amber-400');
  });

  it('displays correct confidence color for low confidence', () => {
    const lowConfidenceFix = { ...mockFix, confidence: 0.5 };
    render(<FixSuggestion fix={lowConfidenceFix} onApply={mockOnApply} />);

    const badge = screen.getByText('50% confidence');
    expect(badge).toHaveClass('text-red-400');
  });

  it('strips leading +/- from diff lines to avoid double markers', () => {
    render(<FixSuggestion fix={mockFix} onApply={mockOnApply} />);

    const expandButton = screen.getByRole('button', { name: '' });
    fireEvent.click(expandButton);

    const diffLines = screen.getAllByRole('row');
    expect(diffLines[0].textContent).toBe('  const fixed = true;');
    expect(diffLines[1].textContent).toBe('  const broken = false;');
  });
});
