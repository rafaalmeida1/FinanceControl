import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsService } from '@/services/debts.service';
import toast from 'react-hot-toast';

export const useDebts = (type?: 'personal' | 'third-party' | 'all', archived?: boolean, status?: string) => {
  const queryClient = useQueryClient();

  const { data: debts, isLoading } = useQuery({
    queryKey: ['debts', type, archived, status],
    queryFn: () => debtsService.getAll({ 
      ...(type ? { type } : {}),
      ...(archived !== undefined ? { archived } : {}),
      ...(status ? { status } : {}),
    }),
  });

  const createMutation = useMutation({
    mutationFn: debtsService.create,
    onSuccess: () => {
      // Invalidar todas as queries relevantes quando uma movimentação é criada
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['compiled-debts'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Dívida criada com sucesso!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => debtsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: debtsService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      toast.success('Dívida cancelada!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: debtsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Dívida deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao deletar dívida');
    },
  });

  const sendLinkMutation = useMutation({
    mutationFn: debtsService.sendLink,
    onSuccess: () => {
      toast.success('Link enviado com sucesso!');
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => debtsService.markAsPaid(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Dívida marcada como paga!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao marcar dívida como paga');
    },
  });

  return {
    debts,
    isLoading,
    createDebt: createMutation.mutate,
    deleteDebt: deleteMutation.mutate,
    isDeletingDebt: deleteMutation.isPending,
    isCreatingDebt: createMutation.isPending,
    updateDebt: (params: { id: string; data: any }, options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
      updateMutation.mutate(params, {
        onSuccess: () => {
          toast.success('Dívida atualizada!');
          options?.onSuccess?.();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Erro ao atualizar dívida');
          options?.onError?.(error);
        },
      });
    },
    isUpdatingDebt: updateMutation.isPending,
    cancelDebt: cancelMutation.mutate,
    isCancelingDebt: cancelMutation.isPending,
    sendLink: sendLinkMutation.mutate,
    isSendingLink: sendLinkMutation.isPending,
    markAsPaid: markAsPaidMutation.mutate,
    isMarkingAsPaid: markAsPaidMutation.isPending,
  };
};

export const useDebt = (id: string) => {
  return useQuery({
    queryKey: ['debt', id],
    queryFn: () => debtsService.getOne(id),
    enabled: !!id,
  });
};

