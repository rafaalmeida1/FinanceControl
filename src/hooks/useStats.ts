import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';

export const useStats = (walletId?: string | null) => {
  return useQuery({
    queryKey: ['stats', walletId],
    queryFn: () => usersService.getStats(walletId || undefined),
  });
};

