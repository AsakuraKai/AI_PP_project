import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './views/Dashboard';
import { ErrorQueue } from './views/ErrorQueue';
import { Analyze } from './views/Analyze';
import { History } from './views/History';
import { AgentState } from './views/AgentState';
import { FixManager } from './views/FixManager';
import { Metrics } from './views/Metrics';

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

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50">
      <Sidebar onRouteChange={setCurrentRoute} />
      <main className="flex-1 overflow-auto">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
