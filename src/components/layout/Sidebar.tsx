import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, Settings, Shield, PlayCircle, Layers } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { authStore } from '@/stores/authStore';

export const Sidebar = () => {
  const { sidebarOpen } = useUIStore();
  const { user } = authStore();

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/debts', icon: FileText, label: 'Dívidas' },
    { to: '/debts/compiled', icon: Layers, label: 'Dívidas Compiladas' },
    { to: '/charges', icon: CreditCard, label: 'Cobranças' },
    { to: '/accounts', icon: CreditCard, label: 'Contas' },
    { to: '/settings', icon: Settings, label: 'Configurações' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/debts', icon: FileText, label: 'Dívidas' },
    { to: '/debts/compiled', icon: Layers, label: 'Dívidas Compiladas' },
    { to: '/charges', icon: CreditCard, label: 'Cobranças' },
    { to: '/accounts', icon: CreditCard, label: 'Contas' },
    { to: '/admin', icon: Shield, label: 'Admin' },
    { to: '/admin/jobs', icon: PlayCircle, label: 'Rotinas' },
    { to: '/settings', icon: Settings, label: 'Configurações' },
  ];

  const links = user?.role === 'ADMIN' ? adminLinks : userLinks;

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed left-0 top-16 bottom-0 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <link.icon size={20} />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

