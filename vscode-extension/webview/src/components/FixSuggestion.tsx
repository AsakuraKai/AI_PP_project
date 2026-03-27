/**
 * FixSuggestion - Component for displaying and applying fixes
 */

import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Code, FileCode, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import './FixSuggestion.css';

export interface CodeFix {
  id: string;
  filePath: string;
  description: string;
  diff: string;
  confidence: number;
}

export interface FixSuggestionProps {
  fix: CodeFix;
  onApply: (fixId: string) => void;
  onReject?: (fixId: string) => void;
  className?: string;
}

export function FixSuggestion({ fix, onApply, onReject, className }: FixSuggestionProps) {
  const [expanded, setExpanded] = useState(false);
  const [applied, setApplied] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmApply = async () => {
    setShowConfirmDialog(false);
    setIsApplying(true);
    try {
      await onApply(fix.id);
      setApplied(true);
    } catch (error) {
      console.error('Failed to apply fix:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancelApply = () => {
    setShowConfirmDialog(false);
  };

  const handleReject = () => {
    if (onReject) {
      onReject(fix.id);
      setRejected(true);
    }
  };

  const confidenceColor =
    fix.confidence >= 0.8 ? 'text-green-400' :
      fix.confidence >= 0.6 ? 'text-amber-400' :
        'text-red-400';

  const renderDiff = () => {
    const lines = fix.diff.split('\n');
    return lines.map((line, idx) => {
      let className = 'diff-line';
      let content = line;

      if (line.startsWith('+')) {
        className += ' diff-add';
        content = line.substring(1); // Strip leading +
      } else if (line.startsWith('-')) {
        className += ' diff-remove';
        content = line.substring(1); // Strip leading -
      }

      return (
        <div key={idx} className={className} role="row">
          {content}
        </div>
      );
    });
  };

  if (rejected) {
    return null;
  }

  return (
    <div className={cn('bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden', className)}>
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Apply Fix?</h3>
            <p className="text-sm text-zinc-400 mb-4">
              This will modify <span className="font-mono text-zinc-200">{fix.filePath}</span>
            </p>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-3 mb-4">
              <p className="text-xs text-zinc-300">{fix.description}</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelApply}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmApply}
                className="gap-2"
              >
                <Check className="h-3 w-3" />
                Apply Fix
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FileCode className="h-4 w-4 text-zinc-400 shrink-0" />
              <span className="text-sm font-mono text-zinc-400 truncate">
                {getFileName(fix.filePath)}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs', confidenceColor)}
              >
                {Math.round(fix.confidence * 100)}% confidence
              </Badge>
            </div>
            <p className="text-sm text-zinc-200">{fix.description}</p>
          </div>

          <div className="flex items-center gap-2">
            {!applied ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReject}
                  className="gap-2 text-zinc-400 hover:text-red-400"
                  disabled={isApplying}
                >
                  <X className="h-3 w-3" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyClick}
                  className="gap-2"
                  disabled={isApplying}
                >
                  <Check className="h-3 w-3" />
                  {isApplying ? 'Applying...' : 'Accept'}
                </Button>
              </>
            ) : (
              <Badge variant="outline" className="text-green-400 border-green-400/30">
                <Check className="h-3 w-3 mr-1" />
                Applied
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Diff Preview */}
      {expanded && (
        <div className="border-t border-zinc-700 bg-zinc-900/50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Code className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-200">Code Changes</span>
            </div>

            {fix.diff && fix.diff.trim().length > 0 ? (
              <pre className="text-xs bg-zinc-950 border border-zinc-800 rounded overflow-x-auto">
                <code className={`language-diff`}>
                  {renderDiff()}
                </code>
              </pre>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
                <p className="text-xs text-amber-300 mb-2">
                  <strong>Manual fix required:</strong>
                </p>
                <p className="text-xs text-zinc-300">
                  {fix.description}
                </p>
                <p className="text-xs text-zinc-500 mt-2 italic">
                  Automatic code diff not available. Please apply this fix manually to your code.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}
