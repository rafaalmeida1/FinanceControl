import api from '@/lib/axios';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionSource {
  CHARGE_PAID = 'CHARGE_PAID',
  CHARGE_CREATED = 'CHARGE_CREATED',
  DEBT_CREATED = 'DEBT_CREATED',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  RECURRING_CHARGE = 'RECURRING_CHARGE',
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  source: TransactionSource;
  amount: number;
  previousBalance: number;
  newBalance: number;
  description?: string;
  debtId?: string;
  chargeId?: string;
  paymentId?: string;
  debtDescription?: string;
  debtorEmail?: string;
  debtorName?: string;
  creditorEmail?: string;
  creditorName?: string;
  isPersonalDebt?: boolean;
  pixKeyId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  wallet?: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  debt?: {
    id: string;
    description?: string;
    totalAmount: number;
    status: string;
  };
  charge?: {
    id: string;
    amount: number;
    dueDate: string;
    status: string;
    description?: string;
  };
  payment?: {
    id: string;
    method: string;
    gateway?: string;
    status: string;
  };
  pixKey?: {
    id: string;
    keyType: string;
    keyValue: string;
    label: string;
  };
}

export interface StatementResponse {
  transactions: WalletTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export const walletTransactionsService = {
  getStatement: async (params?: {
    walletId?: string;
    startDate?: string;
    endDate?: string;
    type?: TransactionType;
    source?: TransactionSource;
    limit?: number;
    offset?: number;
  }): Promise<StatementResponse> => {
    const response = await api.get('/wallet-transactions', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<WalletTransaction> => {
    const response = await api.get(`/wallet-transactions/${id}`);
    return response.data;
  },
};

