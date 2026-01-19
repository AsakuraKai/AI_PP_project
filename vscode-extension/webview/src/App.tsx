import { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { ErrorQueue } from './views/ErrorQueue';
import { Analyze } from './views/Analyze';
import { History } from './views/History';
import { AgentState } from './views/AgentState';
import { FixManager } from './views/FixManager';
import { Metrics } from './views/Metrics';
import { ConversationProvider } from './contexts/ConversationContext';
import { ChatWidget } from './components/conversation/ChatWidget';
import { ViewType } from './types/conversation';

function App() {
  const [currentRoute, setCurrentRoute] = useState('/');

  const renderView = () => {
    switch (currentRoute) {
      case '/':
        return <Dashboard />;
      case '/errors':
        return <ErrorQueue />;
      case '/analyze':
        return <Analyze />;
      case '/history':
        return <History />;
      case '/agent':
        return <AgentState />;
      case '/fixes':
        return <FixManager />;
      case '/metrics':
        return <Metrics />;
      default:
        return <Dashboard />;
    }
  };

  // Map route to view type for conversation context
  const getViewType = (route: string): ViewType => {
    const routeMap: Record<string, ViewType> = {
      '/': 'dashboard',
      '/errors': 'errors',
      '/analyze': 'analyze',
      '/history': 'history',
      '/agent': 'agent',
      '/fixes': 'fixes',
      '/metrics': 'metrics',
    };
    return routeMap[route] || 'dashboard';
  };

  // Create conversation context - updates when route changes
  const conversationContext = useMemo(() => ({
    viewType: getViewType(currentRoute),
    route: currentRoute,
    timestamp: Date.now(),
  }), [currentRoute]);

  return (
    <ConversationProvider>
      <div className="flex h-screen bg-zinc-950 text-zinc-50">
        <Sidebar onRouteChange={setCurrentRoute} />
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>

        {/* SINGLE ChatWidget for ALL views - persists across navigation */}
        <ChatWidget
          context={conversationContext}
          currentView={currentRoute}
        />
      </div>
    </ConversationProvider>
  );
}

export default App;
