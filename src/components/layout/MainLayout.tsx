import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  activeView: string;
  onViewChange: (view: string) => void;
  children: React.ReactNode;
}

export function MainLayout({ activeView, onViewChange, children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 space-y-2">
          <Button
            variant={activeView === 'sites' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange('sites')}
          >
            Sites
          </Button>
          <Button
            variant={activeView === 'accounts' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange('accounts')}
          >
            Accounts
          </Button>
          <Button
            variant={activeView === 'users' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onViewChange('users')}
          >
            Users
          </Button>
        </div>
      </div>
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>
    </div>
  );
}