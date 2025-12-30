import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useStats } from '@/hooks/useStats';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { useFinancial } from '@/hooks/useFinancial';
import { useWallets } from '@/hooks/useWallets';
import { useWindowSize } from '@/hooks/useWindowSize';
import { getSocket } from '@/lib/socket';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Wallet,
  Calendar,
  DollarSign,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  const { data: stats, isLoading: isLoadingStats } = useStats();
  const { profile, isLoading: isLoadingProfile } = useFinancialProfile();
  const { monthlySummary, history, totalBalance, isLoading: isLoadingFinancial } = useFinancial();
  const { wallets, isLoading: isLoadingWallets } = useWallets();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { width } = useWindowSize();
  const chartHeight = width < 768 ? 200 : 280;
  const queryClient = useQueryClient();

  const isLoading = isLoadingStats || isLoadingProfile || isLoadingFinancial || isLoadingWallets;

  // Escutar eventos WebSocket para atualizar dados em tempo real
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleDataUpdated = () => {
      // Invalidar queries relevantes quando dados forem atualizados
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
    };

    socket.on('data.updated', handleDataUpdated);
    socket.on('debt.created', handleDataUpdated);
    socket.on('payment.received', handleDataUpdated);

    return () => {
      socket.off('data.updated', handleDataUpdated);
      socket.off('debt.created', handleDataUpdated);
      socket.off('payment.received', handleDataUpdated);
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
    <div className="space-y-6 pb-6">
      {/* Banner de Onboarding */}
      {!isLoadingProfile && (!profile || !profile.onboardingCompleted) && (
        <Alert className="border-primary bg-gradient-to-r from-primary/10 to-primary/5">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Complete seu perfil financeiro</AlertTitle>
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm">
              Configure seu salário e dia de pagamento para uma experiência personalizada.
            </span>
            <Button
              size="sm"
              onClick={() => navigate('/onboarding')}
              className="shrink-0"
            >
              Completar Agora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header com Saldo Total - Estilo App Bancário */}
      <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground border-0 shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <CardHeader className="relative z-10 pb-3">
          <div className="flex items-center justify-between mb-2">
            <CardDescription className="text-primary-foreground/80">
              Saldo Total
            </CardDescription>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
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
            {balanceVisible ? formatCurrency(totalBalance || 0) : '••••••'}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-xs text-primary-foreground/70 mb-1 truncate">Receitas do Mês</p>
              <p className="text-lg font-semibold truncate">
                {formatCurrency(monthlySummary?.totalIncome || 0)}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-primary-foreground/70 mb-1 truncate">Despesas do Mês</p>
              <p className="text-lg font-semibold truncate">
                {formatCurrency(monthlySummary?.totalExpenses || 0)}
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
          onClick={() => navigate('/debts/create')}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium">Nova Dívida</span>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
          onClick={() => navigate('/wallets')}
        >
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <span className="text-sm font-medium">Carteiras</span>
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
        <Card className="border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 dark:border-green-800/50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-200">
                Para Receber
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-500/20 dark:bg-green-500/30 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-200 mb-1 truncate">
              {formatCurrency(monthlySummary?.pendingIncome || 0)}
            </div>
            <p className="text-xs text-green-600 dark:text-green-300 truncate">
              Receitas do mês: {formatCurrency(monthlySummary?.totalIncome || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Para Pagar */}
        <Card className="border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30 dark:border-red-800/50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-200">
                Para Pagar
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-500/20 dark:bg-red-500/30 flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-300" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-200 mb-1 truncate">
              {formatCurrency(monthlySummary?.pendingExpenses || 0)}
            </div>
            <p className="text-xs text-red-600 dark:text-red-300 truncate">
              Despesas do mês: {formatCurrency(monthlySummary?.totalExpenses || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Sobra no Mês */}
        <Card className="border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 dark:border-blue-800/50 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-200">
                Sobra no Mês
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/20 dark:bg-blue-500/30 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-700 dark:text-blue-200 mb-1 truncate">
              {formatCurrency(monthlySummary?.projectedBalance || 0)}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 truncate">
              Saldo atual: {formatCurrency(monthlySummary?.balance || 0)}
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
                  {stats.upcomingCharges.slice(0, 5).map((charge: any) => (
                    <div
                      key={charge.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/charges/${charge.id}`)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
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
                      <div className="text-right ml-4 flex-shrink-0 min-w-0">
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
                    </div>
                  ))}
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

          {/* Carteiras */}
          {wallets && wallets.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Suas Carteiras</CardTitle>
                    <CardDescription>{wallets.length} carteira(s) ativa(s)</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/wallets')}
                  >
                    Gerenciar
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {wallets.slice(0, 3).map((wallet) => (
                    <div
                      key={wallet.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/wallets')}
                      style={{
                        borderLeft: `4px solid ${wallet.color || '#10b981'}`,
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: `${wallet.color || '#10b981'}20` }}
                        >
                          {wallet.icon || '💳'}
                        </div>
                        <div>
                          <p className="font-medium">{wallet.name}</p>
                          {wallet.isDefault && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Padrão
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(wallet.balance || 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
