import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsService } from '@/services/accounts.service';
import toast from 'react-hot-toast';

export const useAccounts = () => {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: accountsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar conta');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => accountsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta atualizada!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar conta');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: accountsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta removida!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover conta');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => {
      return accountsService.setDefault(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Conta definida como padrão!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao definir conta padrão');
    },
  });

  return {
    accounts,
    isLoading,
    createAccount: createMutation.mutate,
    updateAccount: updateMutation.mutate,
    deleteAccount: deleteMutation.mutate,
    setDefaultAccount: setDefaultMutation.mutate,
  };
};

