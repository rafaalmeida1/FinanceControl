import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Wallet, Settings, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCreateMovement } from '@/contexts/CreateMovementContext';

export const BottomNavigation = () => {
  const location = useLocation();
  const { setOpen } = useCreateMovement();

  const navItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Início',
    },
    {
      to: '/debts',
      icon: FileText,
      label: 'Movimentações',
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
      {/* Navegação Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border md:hidden shadow-2xl overflow-visible">
        <div className="flex items-center justify-around h-20 px-1 sm:px-2 safe-area-bottom overflow-visible">
          {navItems.slice(0, 2).map((item) => {
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

          {/* Botão Central - Criar Movimentação */}
          <div className="flex items-center justify-center flex-1 h-full relative overflow-visible">
            <Button
              size="lg"
              className={cn(
                'h-16 w-16 rounded-full shadow-2xl hover:shadow-3xl transition-all',
                'bg-primary hover:bg-primary/90 text-primary-foreground',
                'flex items-center justify-center',
                'absolute -top-6 z-20',
                'ring-4 ring-background/95',
                'border-2 border-background'
              )}
              onClick={() => setOpen(true)}
            >
              <Receipt className="h-7 w-7" />
            </Button>
          </div>

          {navItems.slice(2).map((item) => {
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
