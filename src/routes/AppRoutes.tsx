import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { RoleRoute } from './RoleRoute';

// Public pages
import Login from '@/pages/public/Login';
import MagicLink from '@/pages/public/MagicLink';
import ResetPassword from '@/pages/public/ResetPassword';
import ForgotPassword from '@/pages/public/ForgotPassword';
import VerifyEmail from '@/pages/public/VerifyEmail';
import TermsOfService from '@/pages/public/TermsOfService';
import PrivacyPolicy from '@/pages/public/PrivacyPolicy';
import DebtorView from '@/pages/public/DebtorView';
import CompiledDebtsView from '@/pages/public/CompiledDebtsView';
import DisputeDebt from '@/pages/public/DisputeDebt';
import DisputeCompiledDebts from '@/pages/public/DisputeCompiledDebts';
import ConfirmPayment from '@/pages/public/ConfirmPayment';
import PaymentConfirmed from '@/pages/public/PaymentConfirmed';
import PaymentConfirmation from '@/pages/public/PaymentConfirmation';

// User pages
import Dashboard from '@/pages/user/Dashboard';
import Debts from '@/pages/user/Debts';
import Charges from '@/pages/user/Charges';
import CreateDebt from '@/pages/user/CreateDebt';
import CreateMercadoPagoDebt from '@/pages/user/CreateMercadoPagoDebt';
import Settings from '@/pages/user/Settings';
import MercadoPagoCallback from '@/pages/settings/MercadoPagoCallback';
import CompiledDebts from '@/pages/user/CompiledDebts';
import DebtDetail from '@/pages/user/DebtDetail';
import Activity from '@/pages/user/Activity';
import Savings from '@/pages/user/Savings';
import Wallets from '@/pages/user/Wallets';
import FinancialOnboarding from '@/pages/onboarding/FinancialOnboarding';

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
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/debtor/:token" element={<DebtorView />} />
      <Route path="/compiled-debts/:token" element={<CompiledDebtsView />} />
      <Route path="/debtor/:debtId/dispute" element={<DisputeDebt />} />
      <Route path="/debts/dispute/compiled" element={<DisputeCompiledDebts />} />
      <Route path="/payments/confirm/:token" element={<ConfirmPayment />} />
      <Route path="/payments/confirm/:token/success" element={<PaymentConfirmed />} />
      <Route path="/payment-confirmation" element={<PaymentConfirmation />} />

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
        path="/debts/create"
        element={
          <PrivateRoute>
            <CreateDebt />
          </PrivateRoute>
        }
      />
      <Route
        path="/debts/create/mercadopago"
        element={
          <PrivateRoute>
            <CreateMercadoPagoDebt />
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
        path="/debts/:id"
        element={
          <PrivateRoute>
            <DebtDetail />
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
        path="/activity"
        element={
          <PrivateRoute>
            <Activity />
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
        path="/debts/compiled"
        element={
          <PrivateRoute>
            <CompiledDebts />
          </PrivateRoute>
        }
      />
      <Route
        path="/savings"
        element={
          <PrivateRoute>
            <Savings />
          </PrivateRoute>
        }
      />
      <Route
        path="/wallets"
        element={
          <PrivateRoute>
            <Wallets />
          </PrivateRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <FinancialOnboarding />
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

