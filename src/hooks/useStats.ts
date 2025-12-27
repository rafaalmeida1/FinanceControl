import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users.service';

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: usersService.getStats,
  });
};

