import { Home, AlertCircle, Search, History, Bot, Wrench, BarChart, type LucideIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { useVSCode } from '../hooks/useVSCode';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  route: string;
  badge?: number;
  hidden?: boolean; // Set to true to hide from navigation
}

interface NavigationSectionProps {
  collapsed: boolean;
  currentRoute: string;
  onNavigate: (route: string) => void;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: Home, label: 'Dashboard', route: '/' },
  { id: 'errors', icon: AlertCircle, label: 'Error Queue', route: '/errors', badge: 0 },
  { id: 'analyze', icon: Search, label: 'Analyze', route: '/analyze' },
  { id: 'history', icon: History, label: 'History', route: '/history' },
  { id: 'agent', icon: Bot, label: 'Agent State', route: '/agent', hidden: true },
  { id: 'fixes', icon: Wrench, label: 'Fix Manager', route: '/fixes', hidden: true },
  { id: 'metrics', icon: BarChart, label: 'Metrics', route: '/metrics', hidden: true },
];

export function NavigationSection({ collapsed, currentRoute, onNavigate }: NavigationSectionProps) {
  const { postMessage } = useVSCode();

  const handleNavigate = (route: string) => {
    onNavigate(route);
    postMessage('navigate', { route });
  };

  // Filter out hidden navigation items
  const visibleNavItems = navItems.filter(item => !item.hidden);

  return (
    <nav className="py-2">
      {visibleNavItems.map((item) => (
        <NavItem
          key={item.id}
          item={item}
          active={currentRoute === item.route}
          collapsed={collapsed}
          onClick={() => handleNavigate(item.route)}
        />
      ))}
    </nav>
  );
}

interface NavItemProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function NavItem({ item, active, collapsed, onClick }: NavItemProps) {
  const Icon = item.icon;

  const activeClasses = active
    ? 'bg-zinc-800 text-zinc-50 border-l-2 border-blue-500'
    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-50 border-l-2 border-transparent';

  if (collapsed) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-center p-3 transition-all duration-200 ${activeClasses}`}
        title={item.label}
      >
        <div className="relative">
          <Icon size={20} />
          {item.badge && item.badge > 0 && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-200 ${activeClasses}`}
    >
      <Icon size={20} />
      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
      {item.badge && item.badge > 0 && (
        <Badge variant="destructive" className="ml-auto text-xs px-1.5 py-0">
          {item.badge}
        </Badge>
      )}
    </button>
  );
}
