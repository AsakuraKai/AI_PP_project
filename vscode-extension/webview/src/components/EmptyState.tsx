/**
 * Empty State Component
 * 
 * Reusable empty state with icon, message, and optional action
 * Follows design system and accessibility best practices
 */

import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className="h-16 w-16 text-zinc-600 mb-4" aria-hidden="true" />
      <h3 className="text-xl font-light text-zinc-200 mb-2">{title}</h3>
      <p className="text-zinc-400 max-w-md mb-6">{description}</p>
      {action && (
        <Button
          onClick={action.onClick}
          variant="default"
          aria-label={action.label}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
