import { Moon, Sun, Menu, LogOut } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '../notifications/NotificationBell';

export const Header = () => {
  const { theme, toggleTheme, toggleSidebar } = useUIStore();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
            Finance Control
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {user && <NotificationBell />}
          
          <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {user && (
            <>
              <div className="text-sm">
                <p className="font-medium">{user.name || user.email}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs">{user.role}</p>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-red-600"
              >
                <LogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

