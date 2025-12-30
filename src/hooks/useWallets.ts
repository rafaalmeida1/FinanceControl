import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletsService, Wallet, CreateWalletDto, UpdateWalletDto } from '@/services/wallets.service';
import toast from 'react-hot-toast';

export function useWallets() {
  const queryClient = useQueryClient();

  const { data: wallets = [], isLoading, error } = useQuery<Wallet[]>({
    queryKey: ['wallets'],
    queryFn: () => walletsService.getAll(),
  });

  const { data: defaultWallet } = useQuery<Wallet>({
    queryKey: ['wallets', 'default'],
    queryFn: () => walletsService.getDefault(),
    enabled: wallets.length > 0,
  });

  const createWallet = useMutation({
    mutationFn: (data: CreateWalletDto) => walletsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Carteira criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar carteira');
    },
  });

  const updateWallet = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWalletDto }) =>
      walletsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Carteira atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar carteira');
    },
  });

  const deleteWallet = useMutation({
    mutationFn: (id: string) => walletsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Carteira deletada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao deletar carteira');
    },
  });

  const setDefaultWallet = useMutation({
    mutationFn: (id: string) => walletsService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Carteira padrão atualizada!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao definir carteira padrão');
    },
  });

  return {
    wallets,
    defaultWallet,
    isLoading,
    error,
    createWallet,
    updateWallet,
    deleteWallet,
    setDefaultWallet,
  };
}

