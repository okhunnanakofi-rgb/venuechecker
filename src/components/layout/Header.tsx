import { Users, ScanLine, History, UserPlus, LogOut, BarChart3, Calendar, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: Users },
  { id: 'register', label: 'Register', icon: UserPlus },
  { id: 'scan', label: 'Scan', icon: ScanLine },
  { id: 'history', label: 'History', icon: History },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ScanLine className="h-5 w-5" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight">VenueCheck</h1>
              <p className="text-xs text-muted-foreground">Attendance Management</p>
            </div>
          </div>
          
          <nav className="hidden xl:flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:block text-right">
                <p className="text-xs text-muted-foreground">Signed in as</p>
                <p className="text-sm font-medium truncate max-w-[120px]">{user.email}</p>
              </div>
            )}
            
            <div className="xl:hidden">
              <select
                value={activeTab}
                onChange={(e) => onTabChange(e.target.value)}
                className="bg-secondary border-none rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
