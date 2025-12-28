import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Home, 
  FileText, 
  Receipt, 
  Wallet, 
  Settings, 
  Moon, 
  Sun, 
  Menu, 
  Search,
  LogOut,
  PlayCircle,
  Shield,
  Layers
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { authStore } from '@/stores/authStore';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { BottomNavigation } from './BottomNavigation';

interface MainLayoutProps {
  children: ReactNode;
}

const userNavigation = [
  { name: 'Início', href: '/dashboard', icon: Home },
  { name: 'Dívidas', href: '/debts', icon: FileText },
  { name: 'Dívidas Compiladas', href: '/debts/compiled', icon: Layers },
  { name: 'Cobranças', href: '/charges', icon: Receipt },
  { name: 'Contas', href: '/accounts', icon: Wallet },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

const adminNavigation = [
  { name: 'Início', href: '/dashboard', icon: Home },
  { name: 'Dívidas', href: '/debts', icon: FileText },
  { name: 'Dívidas Compiladas', href: '/debts/compiled', icon: Layers },
  { name: 'Cobranças', href: '/charges', icon: Receipt },
  { name: 'Contas', href: '/accounts', icon: Wallet },
  { name: 'Admin', href: '/admin', icon: Shield },
  { name: 'Rotinas', href: '/admin/jobs', icon: PlayCircle },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

function SidebarContent() {
  const { user } = authStore();
  const navigation = user?.role === 'ADMIN' ? adminNavigation : userNavigation;
  
  return (
    <nav className="space-y-1">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent hover:text-accent-foreground'
            )
          }
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { theme, toggleTheme } = useUIStore();
  const { user, logout } = authStore();
  const navigate = useNavigate();

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Sempre visível */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          {/* Mobile: Hambúrguer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-lg mb-6">
                  <DollarSign className="h-6 w-6" />
                  Finance Control
                </div>
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center gap-2 font-bold">
            <DollarSign className="h-6 w-6" />
            <span className="hidden sm:inline">Finance Control</span>
          </div>

          {/* Search (desktop) */}
          <div className="hidden md:flex flex-1 px-8">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-8" />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(user?.name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/debts')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Minhas Dívidas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Desktop - Fixed */}
        <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-60 lg:flex-col lg:border-r lg:pt-16">
          <nav className="flex-1 p-4">
            <SidebarContent />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-60 pt-0 pb-16 md:pb-0">
          <div className="container py-4 md:py-6 lg:py-8 px-4 md:px-6">{children}</div>
        </main>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
};

