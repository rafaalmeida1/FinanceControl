import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Play, Clock, Info } from 'lucide-react';
import { jobsService } from '@/services/jobs.service';

export default function JobsControl() {
  const [lastExecution, setLastExecution] = useState<Record<string, string>>({});

  const runRemindersMutation = useMutation({
    mutationFn: () => jobsService.runReminders(),
    onSuccess: (data) => {
      toast.success(data.message || 'Lembretes executados com sucesso!');
      setLastExecution((prev) => ({ ...prev, reminders: data.timestamp || new Date().toISOString() }));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao executar lembretes');
    },
  });

  const runOverdueMutation = useMutation({
    mutationFn: () => jobsService.runOverdue(),
    onSuccess: (data) => {
      toast.success(data.message || 'Notificações de atraso executadas com sucesso!');
      setLastExecution((prev) => ({ ...prev, overdue: data.timestamp || new Date().toISOString() }));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao executar notificações');
    },
  });

  const runRecurringMutation = useMutation({
    mutationFn: () => jobsService.runRecurring(),
    onSuccess: (data) => {
      toast.success(data.message || 'Cobranças recorrentes executadas com sucesso!');
      setLastExecution((prev) => ({ ...prev, recurring: data.timestamp || new Date().toISOString() }));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao executar cobranças');
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Controle de Rotinas</h1>
        <p className="text-muted-foreground mt-2">
          Execute manualmente as rotinas de lembretes e notificações
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funcionam as rotinas</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">
            As rotinas são executadas automaticamente em horários específicos:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Lembretes de Cobrança:</strong> Todos os dias às 8h (D-5, D-2, D-0)</li>
            <li><strong>Notificações de Atraso:</strong> Todos os dias às 9h</li>
            <li><strong>Cobranças Recorrentes:</strong> Todos os dias à meia-noite</li>
          </ul>
          <p className="mt-2 text-sm">
            Use os botões abaixo para executar manualmente quando necessário.
          </p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Lembretes de Cobrança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lembretes de Cobrança
            </CardTitle>
            <CardDescription>
              Envia emails de lembrete para devedores (D-5, D-2, D-0)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastExecution.reminders && (
              <p className="text-sm text-muted-foreground">
                Última execução: {new Date(lastExecution.reminders).toLocaleString('pt-BR')}
              </p>
            )}
            <Button
              onClick={() => runRemindersMutation.mutate()}
              disabled={runRemindersMutation.isPending}
              className="w-full"
            >
              {runRemindersMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Executar Agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notificações de Atraso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Notificações de Atraso
            </CardTitle>
            <CardDescription>
              Envia emails para devedores com pagamentos atrasados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastExecution.overdue && (
              <p className="text-sm text-muted-foreground">
                Última execução: {new Date(lastExecution.overdue).toLocaleString('pt-BR')}
              </p>
            )}
            <Button
              onClick={() => runOverdueMutation.mutate()}
              disabled={runOverdueMutation.isPending}
              className="w-full"
            >
              {runOverdueMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Executar Agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Cobranças Recorrentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cobranças Recorrentes
            </CardTitle>
            <CardDescription>
              Gera novas cobranças baseadas em recorrências configuradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastExecution.recurring && (
              <p className="text-sm text-muted-foreground">
                Última execução: {new Date(lastExecution.recurring).toLocaleString('pt-BR')}
              </p>
            )}
            <Button
              onClick={() => runRecurringMutation.mutate()}
              disabled={runRecurringMutation.isPending}
              className="w-full"
            >
              {runRecurringMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Executar Agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

