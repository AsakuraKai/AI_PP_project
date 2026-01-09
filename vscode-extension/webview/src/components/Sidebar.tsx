import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { SettingsSection } from './SettingsSection';
import { NavigationSection } from './NavigationSection';

interface SidebarProps {
  onRouteChange?: (route: string) => void;
}

export function Sidebar({ onRouteChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('/');

  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    onRouteChange?.(route);
  };

  return (
    <div
      className={`flex flex-col h-screen bg-zinc-950 border-r border-zinc-800 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-zinc-50">RCA Agent</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      {/* Settings Section */}
      <div className="border-b border-zinc-800">
        <SettingsSection collapsed={isCollapsed} />
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto">
        <NavigationSection
          collapsed={isCollapsed}
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 text-center">
            RCA Agent v3.0
          </p>
        </div>
      )}
    </div>
  );
}
