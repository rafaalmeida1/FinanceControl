// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'DEBTOR' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// Account types
export type AccountType = 'PERSONAL' | 'RECEIVABLE' | 'PAYABLE';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

// Debt types
export interface Debt {
  id: string;
  userId: string;
  debtorEmail: string;
  debtorName?: string;
  creditorEmail?: string;
  creditorName?: string;
  totalAmount: number;
  paidAmount: number;
  description?: string;
  dueDate?: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  installments: number;
  interestRate?: number;
  penaltyRate?: number;
  useGateway: boolean;
  preferredGateway?: 'MERCADOPAGO';
  isPersonalDebt?: boolean;
  createdAt: string;
  updatedAt: string;
  charges?: Charge[];
  accessTokens?: DebtorAccessToken[];
  pixKey?: {
    id: string;
    keyType: string;
    keyValue: string;
    label: string;
  };
}

// Charge types
export interface Charge {
  id: string;
  debtId?: string;
  accountId?: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PROCESSING';
  type: 'SINGLE' | 'INSTALLMENT' | 'RECURRING';
  installmentNumber?: number;
  totalInstallments?: number;
  recurrenceInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';
  recurrenceDay?: number;
  nextRecurrence?: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  debt?: Partial<Debt>;
  account?: Partial<Account>;
  payments?: Payment[];
}

// Payment types
export interface Payment {
  id: string;
  chargeId: string;
  amount: number;
  method: 'MERCADOPAGO' | 'MANUAL';
  gateway?: 'MERCADOPAGO';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paidAt?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Debtor Access types
export interface DebtorAccessToken {
  id: string;
  token: string;
  debtId: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
}

// Stats types
export interface UserStats {
  totalToReceive: number;
  totalToPay: number;
  pendingDebtsCount: number;
  upcomingCharges: Charge[];
  recentPayments: Payment[];
}

// Admin types
export interface AdminStats {
  users: {
    total: number;
    active: number;
  };
  debts: {
    total: number;
  };
  charges: {
    total: number;
    pending: number;
  };
  payments: {
    total: number;
    completed: number;
  };
  financialVolume: number;
}

