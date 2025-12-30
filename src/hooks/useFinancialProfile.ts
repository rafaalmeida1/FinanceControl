import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  financialProfileService,
  FinancialProfile,
  CreateFinancialProfileDto,
  UpdateFinancialProfileDto,
} from '@/services/financial-profile.service';
import toast from 'react-hot-toast';

export function useFinancialProfile() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery<FinancialProfile | null>({
    queryKey: ['financial-profile'],
    queryFn: () => financialProfileService.get(),
  });

  const createProfile = useMutation({
    mutationFn: (data: CreateFinancialProfileDto) => financialProfileService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-profile'] });
      toast.success('Perfil financeiro criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar perfil financeiro');
    },
  });

  const updateProfile = useMutation({
    mutationFn: (data: UpdateFinancialProfileDto) => financialProfileService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-profile'] });
      toast.success('Perfil financeiro atualizado!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil financeiro');
    },
  });

  return {
    profile,
    isLoading,
    error,
    createProfile,
    updateProfile,
  };
}

