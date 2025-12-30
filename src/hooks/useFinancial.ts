import { useQuery } from '@tanstack/react-query';
import { financialService, MonthlyFinancialSummary, FinancialHistory } from '@/services/financial.service';

export function useFinancial(month?: number, year?: number, walletId?: string | null) {
  const currentDate = new Date();
  const currentMonth = month || currentDate.getMonth() + 1;
  const currentYear = year || currentDate.getFullYear();

  const { data: monthlySummary, isLoading: isLoadingSummary } = useQuery<MonthlyFinancialSummary>({
    queryKey: ['financial', 'monthly-summary', currentMonth, currentYear, walletId],
    queryFn: () => financialService.getMonthlySummary(currentMonth, currentYear, walletId || undefined),
  });

  const { data: history, isLoading: isLoadingHistory } = useQuery<FinancialHistory[]>({
    queryKey: ['financial', 'history'],
    queryFn: () => financialService.getHistory(12),
  });

  const { data: totalBalance, isLoading: isLoadingBalance } = useQuery<number>({
    queryKey: ['financial', 'total-balance', walletId],
    queryFn: () => financialService.getTotalBalance(walletId || undefined),
  });

  return {
    monthlySummary,
    history,
    totalBalance,
    isLoading: isLoadingSummary || isLoadingHistory || isLoadingBalance,
  };
}

