import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chargesService } from '@/services/charges.service';
import toast from 'react-hot-toast';

export const useCharges = () => {
  const queryClient = useQueryClient();

  const { data: charges, isLoading } = useQuery({
    queryKey: ['charges'],
    queryFn: () => chargesService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: chargesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      toast.success('Cobrança criada!');
    },
  });

  const createRecurringMutation = useMutation({
    mutationFn: chargesService.createRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      toast.success('Cobrança recorrente criada!');
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => chargesService.markPaid(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Cobrança marcada como paga!');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: chargesService.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      toast.success('Cobrança cancelada!');
    },
  });

  const forceChargeMutation = useMutation({
    mutationFn: (debtorEmail?: string) => chargesService.forceCharge(debtorEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      toast.success('Cobranças enviadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao forçar cobrança');
    },
  });

  return {
    charges,
    isLoading,
    createCharge: createMutation.mutate,
    createRecurring: createRecurringMutation.mutate,
    markPaid: markPaidMutation.mutate,
    cancelCharge: cancelMutation.mutate,
    forceCharge: forceChargeMutation.mutate,
  };
};

export const useCharge = (id: string) => {
  return useQuery({
    queryKey: ['charge', id],
    queryFn: () => chargesService.getOne(id),
    enabled: !!id,
  });
};

