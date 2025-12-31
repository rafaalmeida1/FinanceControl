import api from '@/lib/axios';

export interface CreateDisputeDto {
  reason: string;
  correctAmount?: number;
  correctDescription?: string;
  correctDueDate?: string;
}

export interface Dispute {
  id: string;
  debtId: string;
  debtorEmail: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  items: any[]; // Formato legado para compatibilidade
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

  findPending: async (): Promise<Dispute[]> => {
    const response = await api.get('/debts/disputes/pending');
    return response.data;
  },

  findByDebt: async (debtId: string): Promise<Dispute | null> => {
    const response = await api.get(`/debts/${debtId}/dispute`);
    return response.data;
  },

  approve: async (
    debtId: string,
    disputeId: string,
    creditorResponse?: string,
    chargeIds?: string[],
  ): Promise<Dispute> => {
    const response = await api.patch(`/debts/${debtId}/dispute/${disputeId}/approve`, {
      creditorResponse,
      chargeIds,
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

