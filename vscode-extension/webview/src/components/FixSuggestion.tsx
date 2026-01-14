/**
 * FixSuggestion - Component for displaying and applying fixes
 */

import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Code, FileCode } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

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
  
  const handleApply = () => {
    onApply(fix.id);
    setApplied(true);
  };
  
  const confidenceColor = 
    fix.confidence >= 0.8 ? 'text-green-400' :
    fix.confidence >= 0.6 ? 'text-amber-400' :
    'text-red-400';
  
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
            <pre className="text-xs bg-zinc-950 border border-zinc-800 rounded p-3 overflow-x-auto">
              <code className="text-zinc-300">{fix.diff}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function getFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}
