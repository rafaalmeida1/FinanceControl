import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinancial } from '@/hooks/useFinancial';
// Wallet system removed - no longer needed
import { useWindowSize } from '@/hooks/useWindowSize';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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

export function FinancialDashboard() {
  const navigate = useNavigate();
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const { monthlySummary, history, totalBalance, isLoading } = useFinancial(undefined, undefined, selectedWalletId);
  // const { wallets } = useWallets(); // Wallet system removed
  const wallets: any[] = [];
  const { width } = useWindowSize();
  const chartHeight = width < 768 ? 200 : 280;

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  // Preparar dados do gráfico
  const chartData = history?.map((item) => ({
    month: `${monthNames[item.month - 1].substring(0, 3)}/${item.year.toString().slice(-2)}`,
    Receitas: item.totalIncome,
    Despesas: item.totalExpenses,
    Saldo: item.balance,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      {/* Header com Saldo Total e Filtro */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <CardDescription>Saldo Total</CardDescription>
              <CardTitle className="text-4xl font-bold">
                {formatCurrency(totalBalance || 0)}
              </CardTitle>
            </div>
            {wallets && wallets.length > 0 && (
              <div className="flex-shrink-0 w-full sm:w-auto">
                <Label htmlFor="wallet-filter" className="text-xs text-muted-foreground mb-1 block">
                  Filtrar por Carteira
                </Label>
                <Select
                  value={selectedWalletId || 'all'}
                  onValueChange={(value) => setSelectedWalletId(value === 'all' ? null : value)}
                >
                  <SelectTrigger id="wallet-filter" className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Todas as carteiras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as carteiras</SelectItem>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        <div className="flex items-center gap-2">
                          <span>{wallet.icon || '💳'}</span>
                          <span>{wallet.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/wallets')}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Ver Carteiras
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/debts/create')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Dívida
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards Principais do Mês */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Para Receber */}
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Para Receber
              </CardTitle>
              <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(monthlySummary?.pendingIncome || 0)}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Receitas do mês: {formatCurrency(monthlySummary?.totalIncome || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Para Pagar */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                Para Pagar
              </CardTitle>
              <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(monthlySummary?.pendingExpenses || 0)}
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Despesas do mês: {formatCurrency(monthlySummary?.totalExpenses || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Sobra no Mês */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Sobra no Mês
              </CardTitle>
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(monthlySummary?.projectedBalance || 0)}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Saldo atual: {formatCurrency(monthlySummary?.balance || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Histórico */}
      {chartData && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico Financeiro</CardTitle>
            <CardDescription>Últimos 12 meses de receitas e despesas</CardDescription>
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

      {/* Gráfico de Barras Comparativo */}
      {chartData && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparativo Mensal</CardTitle>
            <CardDescription>Receitas vs Despesas por mês</CardDescription>
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

      {/* Resumo por Carteira */}
      {wallets && wallets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saldo por Carteira</CardTitle>
            <CardDescription>Visão geral das suas carteiras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{
                    borderLeftColor: wallet.color || '#10b981',
                    borderLeftWidth: '4px',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${wallet.color || '#10b981'}20` }}
                  >
                    {wallet.icon || '💳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{wallet.name}</p>
                      {wallet.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {formatCurrency(wallet.balance || 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/debts/create')}
            >
              <Plus className="h-5 w-5" />
              <span>Criar Dívida</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/wallets')}
            >
              <Wallet className="h-5 w-5" />
              <span>Gerenciar Carteiras</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => navigate('/debts')}
            >
              <Calendar className="h-5 w-5" />
              <span>Ver Todas as Dívidas</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

