/**
 * ContextIndicator - Shows current view context
 */

import React from 'react';
import { ConversationContext, ViewType } from '../../types/conversation';
import {
    LayoutDashboard,
    AlertCircle,
    Search,
    History,
    Bot,
    Wrench,
    BarChart3
} from 'lucide-react';

interface ContextIndicatorProps {
    context: ConversationContext;
}

const viewConfig: Record<ViewType, { label: string; icon: React.ReactNode; color: string }> = {
    dashboard: {
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-3 w-3" />,
        color: 'bg-blue-500'
    },
    errors: {
        label: 'Error Queue',
        icon: <AlertCircle className="h-3 w-3" />,
        color: 'bg-red-500'
    },
    analyze: {
        label: 'Analyze',
        icon: <Search className="h-3 w-3" />,
        color: 'bg-purple-500'
    },
    history: {
        label: 'History',
        icon: <History className="h-3 w-3" />,
        color: 'bg-green-500'
    },
    agent: {
        label: 'Agent State',
        icon: <Bot className="h-3 w-3" />,
        color: 'bg-yellow-500'
    },
    fixes: {
        label: 'Fix Manager',
        icon: <Wrench className="h-3 w-3" />,
        color: 'bg-orange-500'
    },
    metrics: {
        label: 'Metrics',
        icon: <BarChart3 className="h-3 w-3" />,
        color: 'bg-cyan-500'
    },
};

export function ContextIndicator({ context }: ContextIndicatorProps) {
    const config = viewConfig[context.viewType];

    return (
        <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Context:</span>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-800">
                    <div className={`w-2 h-2 rounded-full ${config.color}`} />
                    {config.icon}
                    <span className="text-xs font-medium text-zinc-200">{config.label}</span>
                </div>
            </div>
        </div>
    );
}
