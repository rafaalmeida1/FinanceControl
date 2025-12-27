import api from '@/lib/axios';

export interface DisputeItem {
  field: 'amount' | 'description' | 'dueDate';
  currentValue: any;
  correctValue: any;
  reason: string;
}

export interface CreateDisputeDto {
  reason: string;
  items: DisputeItem[];
}

export interface Dispute {
  id: string;
  debtId: string;
  debtorEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  items: DisputeItem[];
  creditorResponse?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const disputesService = {
  create: async (debtId: string, debtorEmail: string, data: CreateDisputeDto, token?: string): Promise<Dispute> => {
    const url = `/debts/${debtId}/dispute?email=${encodeURIComponent(debtorEmail)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    const response = await api.post(url, data);
    return response.data;
  },

  findByDebt: async (debtId: string): Promise<Dispute | null> => {
    const response = await api.get(`/debts/${debtId}/dispute`);
    return response.data;
  },

  approve: async (debtId: string, disputeId: string, creditorResponse?: string): Promise<Dispute> => {
    const response = await api.patch(`/debts/${debtId}/dispute/${disputeId}/approve`, {
      creditorResponse,
    });
    return response.data;
  },

  reject: async (debtId: string, disputeId: string, creditorResponse: string): Promise<Dispute> => {
    const response = await api.patch(`/debts/${debtId}/dispute/${disputeId}/reject`, {
      creditorResponse,
    });
    return response.data;
  },

  createCompiledDispute: async (
    debtIds: string[],
    debtorEmail: string,
    data: CreateDisputeDto,
    token?: string
  ): Promise<Dispute[]> => {
    const url = `/debts/dispute/compiled?debtIds=${debtIds.join(',')}&email=${encodeURIComponent(debtorEmail)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    const response = await api.post(url, data);
    return response.data;
  },
};

