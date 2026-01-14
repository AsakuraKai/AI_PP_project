/**
 * AnimatedStat - Animated statistics display with smooth transitions
 * 
 * Features:
 * - Smooth number transitions
 * - Pulse animation on value change
 * - Color-coded change indicators
 * - Accessible to screen readers
 */

import { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnimatedStatProps {
    value: number;
    label: string;
    icon?: React.ReactNode;
    suffix?: string;
    className?: string;
    showTrend?: boolean;
    formatValue?: (value: number) => string;
}

export function AnimatedStat({
    value,
    label,
    icon,
    suffix = '',
    className,
    showTrend = false,
    formatValue = (v) => v.toString()
}: AnimatedStatProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const [previousValue, setPreviousValue] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | undefined>(undefined);

    const animationDuration = 800; // ms

    useEffect(() => {
        if (value === displayValue) return;

        setPreviousValue(displayValue);
        setIsAnimating(true);

        const startValue = displayValue;
        const endValue = value;
        const difference = endValue - startValue;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = timestamp;
            }

            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / animationDuration, 1);

            // Easing function (ease-out cubic)
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            const current = startValue + (difference * easedProgress);
            setDisplayValue(current);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
                startTimeRef.current = undefined;
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [value]);

    const trend = value - previousValue;
    const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';

    return (
        <div
            className={cn(
                'relative transition-all duration-300',
                isAnimating && 'scale-105',
                className
            )}
            role="status"
            aria-label={`${label}: ${formatValue(Math.round(displayValue))}${suffix}`}
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={cn(
                        'p-3 rounded-lg bg-zinc-900 transition-colors duration-300',
                        isAnimating && 'bg-zinc-800'
                    )}>
                        {icon}
                    </div>
                )}

                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <span
                            className={cn(
                                'text-2xl font-semibold tabular-nums transition-colors duration-300',
                                isAnimating && 'text-primary'
                            )}
                        >
                            {formatValue(Math.round(displayValue))}{suffix}
                        </span>

                        {showTrend && trend !== 0 && !isAnimating && (
                            <div
                                className={cn(
                                    'flex items-center gap-1 text-xs font-medium',
                                    trendDirection === 'up' && 'text-green-400',
                                    trendDirection === 'down' && 'text-red-400'
                                )}
                                aria-label={`${trendDirection === 'up' ? 'Increased' : 'Decreased'} by ${Math.abs(trend)}`}
                            >
                                {trendDirection === 'up' && <TrendingUp className="h-3 w-3" />}
                                {trendDirection === 'down' && <TrendingDown className="h-3 w-3" />}
                                {trendDirection === 'neutral' && <Minus className="h-3 w-3" />}
                                <span>{Math.abs(trend)}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-zinc-400 mt-1">
                        {label}
                    </p>
                </div>
            </div>

            {/* Pulse overlay when animating */}
            {isAnimating && (
                <div
                    className="absolute inset-0 rounded-lg bg-primary/10 animate-pulse pointer-events-none"
                    aria-hidden="true"
                />
            )}
        </div>
    );
}

/**
 * AnimatedStatGrid - Grid of animated statistics
 */
interface AnimatedStatGridProps {
    stats: Array<{
        id: string;
        value: number;
        label: string;
        icon?: React.ReactNode;
        suffix?: string;
        showTrend?: boolean;
        formatValue?: (value: number) => string;
    }>;
    columns?: number;
    className?: string;
}

export function AnimatedStatGrid({
    stats,
    columns = 4,
    className
}: AnimatedStatGridProps) {
    return (
        <div
            className={cn(
                'grid gap-4',
                columns === 2 && 'grid-cols-1 md:grid-cols-2',
                columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
                className
            )}
            role="region"
            aria-label="Statistics"
        >
            {stats.map((stat) => (
                <AnimatedStat
                    key={stat.id}
                    {...stat}
                    className="p-4 rounded-lg border border-zinc-800 bg-zinc-950/50"
                />
            ))}
        </div>
    );
}
