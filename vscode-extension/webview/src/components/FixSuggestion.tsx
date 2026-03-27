/**
 * FixSuggestion - Component for displaying and applying fixes
 */

import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronRight, Code, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-diff';
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
  className?: string;
}

export function FixSuggestion({ fix, onApply, className }: FixSuggestionProps) {
  const [expanded, setExpanded] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (expanded) {
      Prism.highlightAll();
    }
  }, [expanded, fix.diff]);

  const handleApply = () => {
    onApply(fix.id);
    setApplied(true);
  };

  const confidenceColor =
    fix.confidence >= 0.8 ? 'text-green-400' :
      fix.confidence >= 0.6 ? 'text-amber-400' :
        'text-red-400';

  const getLanguageFromPath = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'kt': 'kotlin',
      'java': 'java',
      'py': 'python',
    };
    return langMap[ext || ''] || 'typescript';
  };

  const renderDiff = () => {
    const lines = fix.diff.split('\n');
    return lines.map((line, idx) => {
      let className = 'diff-line';
      if (line.startsWith('+')) {
        className += ' diff-add';
      } else if (line.startsWith('-')) {
        className += ' diff-remove';
      }
      return (
        <div key={idx} className={className}>
          {line}
        </div>
      );
    });
  };

  return (
    <div className={cn('bg-zinc-800/50 border border-zinc-700 rounded-lg overflow-hidden', className)}>
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
              <Button
                size="sm"
                onClick={handleApply}
                className="gap-2"
              >
                <Check className="h-3 w-3" />
                Apply
              </Button>
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
