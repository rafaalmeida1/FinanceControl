import { Navigate } from 'react-router-dom';
import { authStore } from '@/stores/authStore';
import { MainLayout } from '@/components/layout/MainLayout';

interface RoleRouteProps {
  children: React.ReactNode;
  requiredRole: 'USER' | 'ADMIN';
}

export const RoleRoute = ({ children, requiredRole }: RoleRouteProps) => {
  const { isAuthenticated, user } = authStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

