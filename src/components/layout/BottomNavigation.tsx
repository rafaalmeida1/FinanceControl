import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Wallet, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
      to: '/wallets',
      icon: Wallet,
      label: 'Carteiras',
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Config',
    },
  ];

  return (
    <>
      {/* Botão Flutuante de Ação Rápida */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          onClick={() => navigate('/debts/create')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Navegação Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border md:hidden shadow-2xl">
        <div className="flex items-center justify-around h-16 px-1 sm:px-2 safe-area-bottom">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || 
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
            
            const active = isActive;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 py-1.5 transition-all duration-200 relative',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <div className={cn(
                  "absolute inset-x-0 top-0 h-1 rounded-b-full transition-all",
                  active ? "bg-primary" : "bg-transparent"
                )} />
                <Icon className={cn(
                  "h-5 w-5 mb-0.5 transition-all relative z-10",
                  active
                    ? "scale-110"
                    : "scale-100"
                )} />
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium truncate w-full text-center leading-tight relative z-10",
                  active && "font-semibold"
                )}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};
