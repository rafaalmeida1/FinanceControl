import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useStats } from '@/hooks/useStats';
import { useFinancial } from '@/hooks/useFinancial';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useSocket } from '@/hooks/useSocket';
import { getSocket } from '@/lib/socket';
import { useCreateMovement } from '@/contexts/CreateMovementContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { QuickAddMovement } from '@/components/debt/QuickAddMovement';
import { DisputesList } from '@/components/disputes/DisputesList';
import { SalaryConfirmationCard } from '@/components/salary/SalaryConfirmationCard';
import { DashboardPaymentModal } from '@/components/payment/DashboardPaymentModal';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setOpen } = useCreateMovement();
  const { data: stats, isLoading: isLoadingStats } = useStats();
  const { history, isLoading: isLoadingFinancial } = useFinancial();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { width } = useWindowSize();
  const chartHeight = width < 768 ? 200 : 280;
  const queryClient = useQueryClient();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [selectedCharges, setSelectedCharges] = useState<any[]>([]);

  const isLoading = isLoadingStats || isLoadingFinancial;

  // Inicializar WebSocket para atualizações em tempo real
  useSocket();

  // Pull-to-refresh para PWA
  const { isRefreshing, pullProgress } = usePullToRefresh({
    enabled: true,
    threshold: 80,
  });

  // Escutar eventos WebSocket específicos para invalidar queries do dashboard
  useEffect(() => {
    const handleDataUpdated = (_data?: { type: string }) => {
      // Invalidar TODAS as queries relevantes quando dados forem atualizados
      // Usar queryKey prefix para invalidar todas as variações
      queryClient.invalidateQueries({ queryKey: ['stats'] }); // Invalida ['stats'] e ['stats', walletId]
      queryClient.invalidateQueries({ queryKey: ['financial'] }); // Invalida todas as queries ['financial', ...]
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['compiled-debts'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      
      // Se for atualização específica, invalidar também
      if (_data?.type === 'debts' || _data?.type === 'all') {
        queryClient.invalidateQueries({ queryKey: ['debts'] });
      }
      if (_data?.type === 'charges' || _data?.type === 'all') {
        queryClient.invalidateQueries({ queryKey: ['charges'] });
      }
      if (_data?.type === 'salary-confirmation') {
        queryClient.invalidateQueries({ queryKey: ['salary-status'] });
      }
    };

    // Removed - not used

    // O useSocket já registra os listeners básicos, mas adicionamos listeners específicos aqui
    // para garantir que o dashboard seja atualizado imediatamente
    const socket = getSocket();
    if (!socket) return;

    socket.on('data.updated', handleDataUpdated);
    socket.on('debt.created', handleDataUpdated);
    socket.on('payment.received', handleDataUpdated);

    return () => {
      socket.off('data.updated', handleDataUpdated);
      socket.off('debt.created', handleDataUpdated);
      socket.off('payment.received', handleDataUpdated);
    };
  }, [queryClient]);

  // Invalidar queries quando voltar para a tela (focus/visibility)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Quando a página volta a ficar visível, invalidar queries
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        queryClient.invalidateQueries({ queryKey: ['financial'] });
      }
    };

    const handleFocus = () => {
      // Quando a janela recebe foco, invalidar queries
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [queryClient]);

  // Preparar dados do gráfico
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  const chartData = history?.map((item) => ({
    month: `${monthNames[item.month - 1]}/${item.year.toString().slice(-2)}`,
    Receitas: item.totalIncome,
    Despesas: item.totalExpenses,
    Saldo: item.balance,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 relative">
      {/* Indicador de Pull-to-Refresh */}
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Atualizando...</span>
          </div>
        </div>
      )}
      
      {/* Indicador visual durante o pull */}
      {pullProgress > 0 && !isRefreshing && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 bg-background/95 backdrop-blur-sm border-b transition-opacity"
          style={{ 
            opacity: Math.min(pullProgress, 1),
            transform: `translateY(${Math.max(0, (pullProgress - 1) * 100)}px)`,
          }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <ArrowDownRight className={`h-5 w-5 transition-transform ${pullProgress >= 1 ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium">
              {pullProgress >= 1 ? 'Solte para atualizar' : 'Puxe para atualizar'}
            </span>
          </div>
        </div>
      )}
      {/* Confirmação de Salário */}
      {searchParams.get('salaryConfirm') === 'true' && <SalaryConfirmationCard />}
      {!searchParams.get('salaryConfirm') && <SalaryConfirmationCard />}

      {/* Card de Adição Rápida */}
      <QuickAddMovement />

      {/* Contestações Pendentes */}
      <DisputesList />


      {/* Header com Saldo Total - Estilo App Bancário */}
      <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-primary-foreground dark:text-slate-50 border-0 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/10 dark:bg-grid-white/5 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-center justify-between mb-2">
            <CardDescription className="text-primary-foreground/80 dark:text-slate-300">
              Saldo Total
            </CardDescription>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground/80 dark:text-slate-300 hover:text-primary-foreground dark:hover:text-slate-50 hover:bg-primary-foreground/10 dark:hover:bg-slate-700"
              onClick={() => setBalanceVisible(!balanceVisible)}
            >
              {balanceVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>
          <CardTitle className="text-4xl md:text-5xl font-bold truncate">
            {balanceVisible ? formatCurrency(stats?.totalBalance || 0) : '••••••'}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-xs text-primary-foreground/70 dark:text-slate-300 mb-1 truncate">Receitas do Mês</p>
              <p className="text-lg font-semibold truncate">
                {balanceVisible ? formatCurrency(stats?.monthlyIncome || 0) : '••••••'}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-primary-foreground/70 dark:text-slate-300 mb-1 truncate">Despesas do Mês</p>
              <p className="text-lg font-semibold truncate">
                {balanceVisible ? formatCurrency(stats?.monthlyExpenses || 0) : '••••••'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Ação Rápida */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
          onClick={() => setOpen(true)}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium">Nova Movimentação</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
          onClick={() => navigate('/charges')}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium">Cobranças</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
          onClick={() => navigate('/debts')}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium">Ver Todas</span>
        </Button>
      </div>

      {/* Cards Principais - Para Receber, Para Pagar, Sobra */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Para Receber */}
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/20 dark:border-green-800/50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-100">
                  Para Receber
                </CardTitle>
                <CardDescription className="text-xs text-green-600/80 dark:text-green-300/80 mt-0.5">
                  Cobranças do mês atual
                </CardDescription>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-500/20 dark:bg-green-500/20 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-100 mb-1 truncate">
              {balanceVisible ? formatCurrency(stats?.totalToReceive || 0) : '••••••'}
            </div>
            <p className="text-xs text-green-600 dark:text-green-300 truncate">
              Receitas do mês: {balanceVisible ? formatCurrency(stats?.monthlyIncome || 0) : '••••••'}
            </p>
          </CardContent>
        </Card>

        {/* Para Pagar */}
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/20 dark:border-red-800/50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-100">
                  Para Pagar
                </CardTitle>
                <CardDescription className="text-xs text-red-600/80 dark:text-red-300/80 mt-0.5">
                  Cobranças do mês atual
                </CardDescription>
              </div>
              <div className="h-8 w-8 rounded-full bg-red-500/20 dark:bg-red-500/20 flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-100 mb-1 truncate">
              {balanceVisible ? formatCurrency(stats?.totalToPay || 0) : '••••••'}
            </div>
            <p className="text-xs text-red-600 dark:text-red-300 truncate">
              Despesas do mês: {balanceVisible ? formatCurrency(stats?.monthlyExpenses || 0) : '••••••'}
            </p>
          </CardContent>
        </Card>

        {/* Sobra no Mês */}
        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/20 dark:border-blue-800/50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-100">
                  Sobra no Mês
                </CardTitle>
                <CardDescription className="text-xs text-blue-600/80 dark:text-blue-300/80 mt-0.5">
                  Após pagamentos e recebimentos
                </CardDescription>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-500/20 dark:bg-blue-500/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <div className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-100 truncate">
                {balanceVisible ? formatCurrency(stats?.monthlySurplus || 0) : '••••••'}
              </div>
              {stats?.isProjection && (
                <Badge variant="secondary" className="text-xs">
                  Projeção
                </Badge>
              )}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 truncate">
              {stats?.isProjection 
                ? 'Baseado no salário esperado' 
                : 'Baseado no salário confirmado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Gráficos e Dados */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Gráfico de Linha */}
          {chartData && chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Evolução Financeira</CardTitle>
                <CardDescription>Últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                    <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Line
                      type="monotone"
                      dataKey="Receitas"
                      stroke="hsl(142, 71%, 45%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(142, 71%, 45%)', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Despesas"
                      stroke="hsl(0, 84%, 60%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(0, 84%, 60%)', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Saldo"
                      stroke="hsl(217, 91%, 60%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(217, 91%, 60%)', r: 4 }}
                      activeDot={{ r: 6 }}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Próximas Cobranças */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Próximas Cobranças</CardTitle>
                  <CardDescription>
                    {stats?.upcomingCharges?.length || 0} cobrança(s) nos próximos dias
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/charges')}
                >
                  Ver Todas
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.upcomingCharges && stats.upcomingCharges.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcomingCharges.slice(0, 5).map((charge: any) => {
                    // Verificar se o usuário é o devedor desta cobrança
                    const isUserDebtor = charge.debt?.isPersonalDebt || 
                                        charge.debt?.debtorUserId === charge.debt?.userId;
                    
                    return (
                      <div
                        key={charge.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (charge.debt?.id) {
                              navigate(`/debts/${charge.debt.id}`);
                            } else {
                              navigate('/charges');
                            }
                          }}
                        >
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            charge.status === 'OVERDUE' ? 'bg-red-100 dark:bg-red-900/30' :
                            charge.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900/30' :
                            'bg-green-100 dark:bg-green-900/30'
                          }`}>
                            {charge.status === 'OVERDUE' ? (
                              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            ) : charge.status === 'PAID' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {charge.debt?.description || charge.description || 'Cobrança'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateShort(charge.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right min-w-0">
                            <p className="font-semibold truncate">{formatCurrency(charge.amount)}</p>
                            <Badge
                              variant={
                                charge.status === 'OVERDUE' ? 'destructive' :
                                charge.status === 'PAID' ? 'default' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {charge.status === 'OVERDUE' ? 'Atrasado' :
                               charge.status === 'PAID' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                          {isUserDebtor && charge.status !== 'PAID' && charge.debt && (
                            <Button
                              size="sm"
                              variant="default"
                              className="ml-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDebt(charge.debt);
                                setSelectedCharges([charge]);
                                setPaymentModalOpen(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}
      </div>

      {/* Modal de Pagamento */}
      {selectedDebt && selectedCharges.length > 0 && (
        <DashboardPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          debt={selectedDebt}
          charges={selectedCharges}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['charges'] });
            queryClient.invalidateQueries({ queryKey: ['financial'] });
          }}
        />
      )}
    </div>
  );
})}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma cobrança próxima</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          {/* Gráfico de Barras */}
          {chartData && chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparativo Mensal</CardTitle>
                <CardDescription>Receitas vs Despesas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--popover-foreground))',
                      }}
                      labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
                    />
                    <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="Receitas" fill="hsl(142, 71%, 45%)" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Despesas" fill="hsl(0, 84%, 60%)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

        </TabsContent>
      </Tabs>
    </div>
  );
}
