import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { disputesService } from '@/services/disputes.service';

const disputeSchema = z.object({
  reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
  correctAmount: z.number().optional(),
  correctDescription: z.string().optional(),
  correctDueDate: z.string().optional(),
}).refine(
  (data) => data.correctAmount !== undefined || data.correctDescription !== undefined || data.correctDueDate !== undefined,
  { message: 'Preencha pelo menos um campo que está incorreto' }
);

type DisputeFormData = z.infer<typeof disputeSchema>;

export default function DisputeDebt() {
  const { debtId } = useParams<{ debtId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  const [debt, setDebt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isCompiled, setIsCompiled] = useState(false);
  const [debtIds, setDebtIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    // setValue,
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      reason: '',
      correctAmount: undefined,
      correctDescription: undefined,
      correctDueDate: undefined,
    },
  });

  useEffect(() => {
    const loadDebt = async () => {
      // Verificar se é contestação compilada
      const debtIdsParam = searchParams.get('debtIds');
      if (debtIdsParam) {
        setIsCompiled(true);
        setDebtIds(debtIdsParam.split(',').filter(id => id.trim()));
        setLoading(false);
        return;
      }

      if (!debtId || !email) {
        toast.error('Parâmetros inválidos');
        setLoading(false);
        return;
      }

      try {
        // Buscar dívida via token (endpoint público)
        if (token) {
          const { debtorAccessService } = await import('@/services/debtor-access.service');
          const debtData = await debtorAccessService.getDebt(token);
          setDebt(debtData.debt);
        } else if (debtId && email) {
          toast.error('Token de acesso necessário');
        }
      } catch (error: any) {
        toast.error('Erro ao carregar dívida. Verifique se o link está correto.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDebt();
  }, [debtId, email, token, searchParams]);

  const onSubmit = async (data: DisputeFormData) => {
    if (isCompiled) {
      // Contestação compilada
      if (debtIds.length === 0 || !email) {
        toast.error('Parâmetros inválidos');
        return;
      }

      setSubmitting(true);
      try {
        await disputesService.createCompiledDispute(debtIds, email, {
          reason: data.reason,
          correctAmount: data.correctAmount,
          correctDescription: data.correctDescription,
          correctDueDate: data.correctDueDate,
        }, token || undefined);

        toast.success(`Contestação enviada para ${debtIds.length} dívida(s)! O credor será notificado.`);
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erro ao enviar contestação');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Contestação única
    if (!debtId || !email) {
      toast.error('Parâmetros inválidos');
      return;
    }

    setSubmitting(true);
    try {
      await disputesService.create(debtId, email, {
        reason: data.reason,
        correctAmount: data.correctAmount,
        correctDescription: data.correctDescription,
        correctDueDate: data.correctDueDate,
      }, token || undefined);

      toast.success('Contestação enviada com sucesso! O credor será notificado.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar contestação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pb-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isCompiled && !debt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pb-20">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Dívida não encontrada</CardTitle>
            <CardDescription>
              Não foi possível carregar os dados da dívida.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contestar Dívida</CardTitle>
            <CardDescription>
              Se algum dado desta dívida estiver incorreto, informe o valor correto abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isCompiled && debt && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Dados Atuais da Dívida</AlertTitle>
                <AlertDescription className="mt-2 space-y-1">
                  <p><strong>Valor:</strong> R$ {typeof debt.totalAmount === 'number' ? debt.totalAmount.toFixed(2) : debt.totalAmount}</p>
                  <p><strong>Descrição:</strong> {debt.description || 'Sem descrição'}</p>
                  <p><strong>Vencimento:</strong> {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                </AlertDescription>
              </Alert>
            )}

            {isCompiled && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Contestação Compilada</AlertTitle>
                <AlertDescription className="mt-2">
                  Você está contestando {debtIds.length} dívida(s). Preencha os campos abaixo com os valores corretos para cada informação que deseja corrigir.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da Contestação *</Label>
                <Textarea
                  id="reason"
                  {...register('reason')}
                  placeholder="Explique o motivo da contestação..."
                  rows={4}
                />
                {errors.reason && (
                  <p className="text-sm text-destructive">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="correctAmount">Valor Correto (R$)</Label>
                  <Input
                    id="correctAmount"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 800.00"
                    {...register('correctAmount', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco se o valor estiver correto
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correctDescription">Descrição Correta</Label>
                  <Textarea
                    id="correctDescription"
                    {...register('correctDescription')}
                    placeholder="Ex: Empréstimo pessoal corrigido"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco se a descrição estiver correta
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="correctDueDate">Data de Vencimento Correta</Label>
                  <Input
                    id="correctDueDate"
                    type="date"
                    {...register('correctDueDate')}
                    className="w-full max-w-full text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco se a data estiver correta
                  </p>
                </div>
              </div>

              {(errors.correctAmount || errors.correctDescription || errors.correctDueDate) && (
                <p className="text-sm text-destructive">
                  Preencha pelo menos um campo que está incorreto
                </p>
              )}

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Contestação'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
