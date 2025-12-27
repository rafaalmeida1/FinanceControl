import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsService } from '@/services/debts.service';
import toast from 'react-hot-toast';

export const useDebts = (type?: 'personal' | 'third-party' | 'all') => {
  const queryClient = useQueryClient();

  const { data: debts, isLoading } = useQuery({
    queryKey: ['debts', type],
    queryFn: () => debtsService.getAll(type ? { type } : undefined),
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

  return {
    debts,
    isLoading,
    createDebt: createMutation.mutate,
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
    cancelDebt: cancelMutation.mutate,
    sendLink: sendLinkMutation.mutate,
  };
};

export const useDebt = (id: string) => {
  return useQuery({
    queryKey: ['debt', id],
    queryFn: () => debtsService.getOne(id),
    enabled: !!id,
  });
};

