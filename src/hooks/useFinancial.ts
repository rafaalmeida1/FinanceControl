import { useQuery } from '@tanstack/react-query';
import { financialService, MonthlyFinancialSummary, FinancialHistory } from '@/services/financial.service';

export function useFinancial(month?: number, year?: number) {
  const currentDate = new Date();
  const currentMonth = month || currentDate.getMonth() + 1;
  const currentYear = year || currentDate.getFullYear();

  const { data: monthlySummary, isLoading: isLoadingSummary } = useQuery<MonthlyFinancialSummary>({
    queryKey: ['financial', 'monthly-summary', currentMonth, currentYear],
    queryFn: () => financialService.getMonthlySummary(currentMonth, currentYear),
  });

  const { data: history, isLoading: isLoadingHistory } = useQuery<FinancialHistory[]>({
    queryKey: ['financial', 'history'],
    queryFn: () => financialService.getHistory(12),
  });

  const { data: totalBalance, isLoading: isLoadingBalance } = useQuery<number>({
    queryKey: ['financial', 'total-balance'],
    queryFn: () => financialService.getTotalBalance(),
  });

  return {
    monthlySummary,
    history,
    totalBalance,
    isLoading: isLoadingSummary || isLoadingHistory || isLoadingBalance,
  };
}

