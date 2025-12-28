import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, CreditCard, Settings, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { authStore } from '@/stores/authStore';

export const BottomNavigation = () => {
  const location = useLocation();
  // const { user } = authStore();

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Início',
    },
    {
      to: '/debts',
      icon: FileText,
      label: 'Dívidas',
    },
    {
      to: '/charges',
      icon: CreditCard,
      label: 'Cobranças',
    },
    {
      to: '/debts/compiled',
      icon: Layers,
      label: 'Compiladas',
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Config',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden shadow-lg">
      <div className="flex items-center justify-around h-16 px-1 sm:px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || 
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          
          // Special handling for compiled debts
          const isCompiledActive = item.to === '/debts/compiled' && location.pathname === '/debts/compiled';
          const isDebtsActive = item.to === '/debts' && location.pathname.startsWith('/debts') && location.pathname !== '/debts/compiled';
          
          const active = item.to === '/debts/compiled' 
            ? isCompiledActive 
            : item.to === '/debts' 
            ? isDebtsActive 
            : isActive;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 py-1.5 transition-all duration-200 rounded-t-lg',
                active
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-0.5 transition-all",
                active
                  ? "scale-110"
                  : "scale-100"
              )} />
              <span className="text-[10px] sm:text-xs font-medium truncate w-full text-center leading-tight">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
