import { Navigate } from 'react-router-dom';
import { authStore } from '@/stores/authStore';
import { MainLayout } from '@/components/layout/MainLayout';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated } = authStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

