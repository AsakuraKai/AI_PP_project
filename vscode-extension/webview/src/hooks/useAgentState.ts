/**
 * useAgentState - Hook for Agent State view data
 * 
 * Provides:
 * - Real-time agent state updates during analysis
 * - Iteration progress tracking
 * - Hypothesis and observation history
 * - Tool usage metrics
 * - Consensus building progress
 */

import { useState, useEffect, useCallback } from 'react';
import { useVSCode } from './useVSCode';

export interface AgentState {
  iteration: number;
  maxIterations: number;
  progress: number;
  currentThought?: string;
  hypothesis?: string;
  confidence?: number;
  recentActions?: Array<{
    tool: string;
    params: any;
    timestamp: number;
  }>;
  recentObservations?: Array<{
    result: string;
    timestamp: number;
    isFinal?: boolean;
  }>;
  elapsed?: number;
  isActive: boolean;
  phase?: 'parsing' | 'analyzing' | 'generating' | 'consensus' | 'complete';
}

export interface ToolMetrics {
  toolName: string;
  callCount: number;
  totalDuration: number;
  avgDuration: number;
  successRate: number;
}

export function useAgentState() {
  const { postMessage } = useVSCode();
  
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [toolMetrics, setToolMetrics] = useState<ToolMetrics[]>([]);
  const [consensusData, setConsensusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Callbacks
  const subscribeToAgentState = useCallback(() => {
    postMessage('subscribeAgentState');
  }, [postMessage]);
  
  const unsubscribeFromAgentState = useCallback(() => {
    postMessage('unsubscribeAgentState');
  }, [postMessage]);
  
  const getToolMetrics = useCallback(() => {
    postMessage('getToolMetrics');
  }, [postMessage]);
  
  const resetAgentState = useCallback(() => {
    setAgentState(null);
    setToolMetrics([]);
    setConsensusData(null);
  }, []);
  
  // Subscribe to agent state updates on mount
  useEffect(() => {
    subscribeToAgentState();
    getToolMetrics();
    
    // Cleanup on unmount
    return () => {
      unsubscribeFromAgentState();
    };
  }, [subscribeToAgentState, unsubscribeFromAgentState, getToolMetrics]);
  
  // Listen for updates from extension
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      
      switch (message.command) {
        case 'agentStateUpdate':
          setAgentState(message.state);
          setLoading(false);
          break;
          
        case 'agentIterationUpdate':
          setAgentState(prev => prev ? {
            ...prev,
            iteration: message.iteration,
            maxIterations: message.maxIterations,
            progress: message.progress || (message.iteration / message.maxIterations)
          } : null);
          break;
          
        case 'agentThoughtUpdate':
          setAgentState(prev => prev ? {
            ...prev,
            currentThought: message.thought
          } : null);
          break;
          
        case 'agentActionUpdate':
          setAgentState(prev => {
            if (!prev) return null;
            const newAction = {
              tool: message.tool,
              params: message.params,
              timestamp: Date.now()
            };
            return {
              ...prev,
              recentActions: [...(prev.recentActions || []), newAction].slice(-10) // Keep last 10
            };
          });
          break;
          
        case 'agentObservationUpdate':
          setAgentState(prev => {
            if (!prev) return null;
            const newObservation = {
              result: message.observation,
              timestamp: Date.now(),
              isFinal: message.isFinal
            };
            return {
              ...prev,
              recentObservations: [...(prev.recentObservations || []), newObservation].slice(-10) // Keep last 10
            };
          });
          break;
          
        case 'agentHypothesisUpdate':
          setAgentState(prev => prev ? {
            ...prev,
            hypothesis: message.hypothesis,
            confidence: message.confidence
          } : null);
          break;
          
        case 'agentPhaseUpdate':
          setAgentState(prev => prev ? {
            ...prev,
            phase: message.phase
          } : null);
          break;
          
        case 'agentComplete':
          setAgentState(prev => prev ? {
            ...prev,
            isActive: false,
            phase: 'complete'
          } : null);
          break;
          
        case 'agentError':
          setAgentState(prev => prev ? {
            ...prev,
            isActive: false
          } : null);
          setLoading(false);
          break;
          
        case 'toolMetricsData':
          setToolMetrics(message.metrics || []);
          break;
          
        case 'consensusData':
          setConsensusData(message.data);
          break;
          
        case 'analysisStarted':
          setLoading(true);
          setAgentState({
            iteration: 0,
            maxIterations: message.maxIterations || 6,
            progress: 0,
            isActive: true,
            phase: 'parsing'
          });
          break;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Calculate derived metrics
  const metrics = {
    totalIterations: agentState?.iteration || 0,
    progressPercentage: agentState?.progress ? Math.round(agentState.progress * 100) : 0,
    elapsedTime: agentState?.elapsed || 0,
    actionsCount: agentState?.recentActions?.length || 0,
    observationsCount: agentState?.recentObservations?.length || 0,
    currentPhase: agentState?.phase || 'idle'
  };
  
  return {
    agentState,
    toolMetrics,
    consensusData,
    loading,
    metrics,
    subscribeToAgentState,
    unsubscribeFromAgentState,
    getToolMetrics,
    resetAgentState
  };
}
