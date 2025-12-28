import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { debtsService } from '@/services/debts.service';
import { chargesService } from '@/services/charges.service';
import { notificationsStore } from '@/stores/notificationsStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@/hooks/useSocket';

export default function Activity() {
  const navigate = useNavigate();
  // Inicializar WebSocket para atualizações em tempo real
  useSocket();
  // Usar selector para garantir reatividade
  const notifications = notificationsStore((state) => state.notifications);

  // Buscar dívidas recentes
  const { data: debts, isLoading: debtsLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => debtsService.getAll(),
  });

  // Buscar cobranças recentes
  const { data: charges, isLoading: chargesLoading } = useQuery({
    queryKey: ['charges'],
    queryFn: () => chargesService.getAll(),
  });

  // Combinar e ordenar atividades - usar useMemo para garantir reatividade
  const activities = useMemo(() => [
    ...(notifications || []).map((notif) => ({
      type: 'notification' as const,
      id: notif.id,
      title: notif.subject,
      description: notif.message,
      timestamp: new Date(notif.timestamp),
      link: notif.link,
      icon: CheckCircle,
    })),
    ...(debts || [])
      .filter((d) => d.status === 'PENDING' || d.status === 'PARTIAL')
      .map((debt) => ({
        type: 'debt' as const,
        id: debt.id,
        title: `Dívida: ${debt.description || 'Sem descrição'}`,
        description: `${debt.debtorName || debt.debtorEmail} - ${formatCurrency(Number(debt.totalAmount))}`,
        timestamp: new Date(debt.createdAt),
        link: `/debts/${debt.id}`,
        icon: FileText,
      })),
    ...(charges || [])
      .filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE')
      .map((charge) => ({
        type: 'charge' as const,
        id: charge.id,
        title: `Cobrança: ${charge.description || 'Sem descrição'}`,
        description: `Vence em ${formatDateShort(charge.dueDate)} - ${formatCurrency(Number(charge.amount))}`,
        timestamp: new Date(charge.dueDate),
        link: `/charges/${charge.id}`,
        icon: DollarSign,
      })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 50), // Últimas 50 atividades
    [notifications, debts, charges]
  );

  if (debtsLoading || chargesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Atividade Recente</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as atividades do sistema em tempo real
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Atividades</CardTitle>
            <CardDescription>
              Notificações, dívidas e cobranças atualizadas em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma atividade recente
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-all duration-300 cursor-pointer animate-in fade-in"
                      style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'both' }}
                      onClick={() => {
                        if (activity.link) {
                          navigate(activity.link);
                        }
                      }}
                    >
                      <div className="p-2 rounded-full bg-primary/10 animate-pulse">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(activity.timestamp, {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {activity.type === 'notification'
                              ? 'Notificação'
                              : activity.type === 'debt'
                                ? 'Dívida'
                                : 'Cobrança'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

