import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { RoleRoute } from './RoleRoute';

// Public pages
import Login from '@/pages/public/Login';
import MagicLink from '@/pages/public/MagicLink';
import ResetPassword from '@/pages/public/ResetPassword';
import DebtorView from '@/pages/public/DebtorView';
import DisputeDebt from '@/pages/public/DisputeDebt';
import DisputeCompiledDebts from '@/pages/public/DisputeCompiledDebts';
import ConfirmPayment from '@/pages/public/ConfirmPayment';
import PaymentConfirmed from '@/pages/public/PaymentConfirmed';

// User pages
import Dashboard from '@/pages/user/Dashboard';
import Debts from '@/pages/user/Debts';
import Charges from '@/pages/user/Charges';
import CreateDebt from '@/pages/user/CreateDebt';
import Settings from '@/pages/user/Settings';
import Accounts from '@/pages/user/Accounts';
import CreateAccount from '@/pages/user/CreateAccount';
import MercadoPagoCallback from '@/pages/settings/MercadoPagoCallback';
import CompiledDebts from '@/pages/user/CompiledDebts';

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard';
import JobsControl from '@/pages/admin/JobsControl';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/auth/magic-link/:token" element={<MagicLink />} />
      <Route path="/auth/reset-password/:token" element={<ResetPassword />} />
      <Route path="/debtor/:token" element={<DebtorView />} />
      <Route path="/debtor/:debtId/dispute" element={<DisputeDebt />} />
      <Route path="/debts/dispute/compiled" element={<DisputeCompiledDebts />} />
      <Route path="/payments/confirm/:token" element={<ConfirmPayment />} />
      <Route path="/payments/confirm/:token/success" element={<PaymentConfirmed />} />

      {/* User routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/debts"
        element={
          <PrivateRoute>
            <Debts />
          </PrivateRoute>
        }
      />
      <Route
        path="/debts/new"
        element={
          <PrivateRoute>
            <CreateDebt />
          </PrivateRoute>
        }
      />
      <Route
        path="/charges"
        element={
          <PrivateRoute>
            <Charges />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings/callback/mercadopago"
        element={
          <PrivateRoute>
            <MercadoPagoCallback />
          </PrivateRoute>
        }
      />
      <Route
        path="/accounts"
        element={
          <PrivateRoute>
            <Accounts />
          </PrivateRoute>
        }
      />
      <Route
        path="/accounts/new"
        element={
          <PrivateRoute>
            <CreateAccount />
          </PrivateRoute>
        }
      />
      <Route
        path="/debts/compiled"
        element={
          <PrivateRoute>
            <CompiledDebts />
          </PrivateRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <RoleRoute requiredRole="ADMIN">
            <AdminDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/admin/jobs"
        element={
          <RoleRoute requiredRole="ADMIN">
            <JobsControl />
          </RoleRoute>
        }
      />

      {/* Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

