import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsService } from '@/services/debts.service';
import toast from 'react-hot-toast';

export const useDebts = (type?: 'personal' | 'third-party' | 'all', archived?: boolean) => {
  const queryClient = useQueryClient();

  const { data: debts, isLoading } = useQuery({
    queryKey: ['debts', type, archived],
    queryFn: () => debtsService.getAll({ 
      ...(type ? { type } : {}),
      ...(archived !== undefined ? { archived } : {}),
    }),
  });

  const createMutation = useMutation({
    mutationFn: debtsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
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

