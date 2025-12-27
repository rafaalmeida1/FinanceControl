import { useStats } from '@/hooks/useStats';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { TrendingDown, TrendingUp, AlertCircle, Calendar, Activity } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'OVERDUE':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PAID: 'Pago',
      PENDING: 'Pendente',
      OVERDUE: 'Atrasado',
      CANCELLED: 'Cancelado',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Bem-vindo de volta</h1>
        <p className="text-muted-foreground mt-2">
          Aqui está um resumo da sua atividade financeira
        </p>
      </div>

      {/* Métricas Rápidas - Grid Responsivo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total a Receber"
          value={formatCurrency(stats?.totalToReceive || 0)}
          icon={<TrendingUp className="h-6 w-6" />}
          description="Receitas previstas"
        />
        <StatsCard
          title="Total a Pagar"
          value={formatCurrency(stats?.totalToPay || 0)}
          icon={<TrendingDown className="h-6 w-6" />}
          description="Despesas previstas"
        />
        <StatsCard
          title="Dívidas Pendentes"
          value={String(stats?.pendingDebtsCount || 0)}
          icon={<AlertCircle className="h-6 w-6" />}
          description="Aguardando pagamento"
        />
        <StatsCard
          title="Próximos Vencimentos"
          value={String(stats?.upcomingCharges?.length || 0)}
          icon={<Calendar className="h-6 w-6" />}
          description="Nos próximos 30 dias"
        />
      </div>

      {/* Grid Transações + Atividade */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Transações Recentes */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Cobranças Próximas</CardTitle>
            <CardDescription>
              {stats?.upcomingCharges?.length || 0} cobrança(s) próxima(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.upcomingCharges && stats.upcomingCharges.length > 0 ? (
                stats.upcomingCharges.slice(0, 5).map((charge: any) => (
                  <div key={charge.id} className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(charge.description || 'C')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {charge.description || 'Cobrança'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {formatDateShort(charge.dueDate)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">
                        {formatCurrency(charge.amount)}
                      </p>
                      <Badge variant={getStatusVariant(charge.status)}>
                        {getStatusLabel(charge.status)}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma cobrança próxima
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentPayments && stats.recentPayments.length > 0 ? (
                stats.recentPayments.slice(0, 5).map((payment: any, index: number) => (
                  <div key={payment.id || index} className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-tight">
                        {payment.description || 'Pagamento recebido'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paidAt
                          ? formatDateShort(payment.paidAt)
                          : 'Data não disponível'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                  <Activity className="h-8 w-8 opacity-50" />
                  <p className="text-sm">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

