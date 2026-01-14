/**
 * StatsCard - Component for displaying statistics
 * Used in Dashboard view
 */

import React from 'react';
import { cn } from '../lib/utils';

export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

const variantStyles = {
  default: 'border-zinc-700',
  success: 'border-green-500/30 bg-green-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  error: 'border-red-500/30 bg-red-500/5',
};

const trendColors = {
  up: 'text-green-400',
  down: 'text-red-400',
  neutral: 'text-zinc-400',
};

export function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  className
}: StatsCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-zinc-900 p-6 transition-all hover:border-zinc-600',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-zinc-400 mb-2">{title}</div>
          <div className="text-3xl font-light text-zinc-50 mb-1">{value}</div>
          {subtitle && (
            <div className="text-xs text-zinc-500">{subtitle}</div>
          )}
        </div>
        {icon && (
          <div className="shrink-0 text-zinc-400">
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          <span className={cn('font-medium', trendColors[trend.direction])}>
            {trend.direction === 'up' && '↗'}
            {trend.direction === 'down' && '↘'}
            {trend.direction === 'neutral' && '→'}
            {' '}{trend.value}
          </span>
          <span className="text-zinc-500">vs last period</span>
        </div>
      )}
    </div>
  );
}
