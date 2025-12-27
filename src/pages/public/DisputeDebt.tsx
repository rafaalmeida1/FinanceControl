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
import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';
import { disputesService } from '@/services/disputes.service';
import { debtsService } from '@/services/debts.service';

const disputeSchema = z.object({
  reason: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
  items: z.array(
    z.object({
      field: z.enum(['amount', 'description', 'dueDate']),
      currentValue: z.any(),
      correctValue: z.any(),
      reason: z.string().min(5, 'Motivo do item é obrigatório'),
    })
  ).min(1, 'Adicione pelo menos um item contestado'),
});

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
    setValue,
    watch,
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      reason: '',
      items: [],
    },
  });

  const items = watch('items');

  useEffect(() => {
    const loadDebt = async () => {
      // Verificar se é contestação compilada
      const debtIdsParam = searchParams.get('debtIds');
      if (debtIdsParam) {
        setIsCompiled(true);
        setDebtIds(debtIdsParam.split(',').filter(id => id.trim()));
        // Para contestação compilada, não precisamos carregar todas as dívidas aqui
        // O formulário será preenchido pelo usuário
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
          
          // Pré-preencher itens com dados da dívida
          const preFilledItems = [
            {
              field: 'amount' as const,
              currentValue: debtData.debt.totalAmount,
              correctValue: '',
              reason: '',
            },
            {
              field: 'description' as const,
              currentValue: debtData.debt.description || '',
              correctValue: '',
              reason: '',
            },
            {
              field: 'dueDate' as const,
              currentValue: debtData.debt.dueDate || '',
              correctValue: '',
              reason: '',
            },
          ];
          setValue('items', preFilledItems);
        } else if (debtId && email) {
          // Fallback: tentar buscar diretamente (requer autenticação)
          // Por enquanto, vamos mostrar erro
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
  }, [debtId, email, token, searchParams, setValue]);

  const addItem = () => {
    const currentItems = items || [];
    setValue('items', [
      ...currentItems,
      {
        field: 'amount',
        currentValue: '',
        correctValue: '',
        reason: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    const currentItems = items || [];
    setValue('items', currentItems.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: DisputeFormData) => {
    if (isCompiled) {
      // Contestação compilada
      if (debtIds.length === 0 || !email) {
        toast.error('Parâmetros inválidos');
        return;
      }

      setSubmitting(true);
      try {
        // Preparar items - para contestação compilada, os valores já vêm do formulário
        const formattedItems = data.items
          .filter(item => item.correctValue && item.reason) // Filtrar apenas itens preenchidos
          .map((item) => ({
            field: item.field,
            currentValue: item.currentValue,
            correctValue: item.field === 'amount' ? parseFloat(item.correctValue) : item.correctValue,
            reason: item.reason,
          }));

        if (formattedItems.length === 0) {
          toast.error('Preencha pelo menos um item contestado');
          setSubmitting(false);
          return;
        }

        await disputesService.createCompiledDispute(debtIds, email, {
          reason: data.reason,
          items: formattedItems,
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
      // Preparar items com valores corretos
      const formattedItems = data.items
        .filter(item => item.correctValue && item.reason) // Filtrar apenas itens preenchidos
        .map((item) => {
          let currentValue = item.currentValue;
          let correctValue = item.correctValue;

          if (item.field === 'amount') {
            currentValue = debt.totalAmount;
            correctValue = parseFloat(correctValue);
          } else if (item.field === 'dueDate') {
            currentValue = debt.dueDate;
            correctValue = correctValue;
          } else {
            currentValue = debt[item.field] || '';
          }

          return {
            field: item.field,
            currentValue,
            correctValue,
            reason: item.reason,
          };
        });

      if (formattedItems.length === 0) {
        toast.error('Preencha pelo menos um item contestado');
        setSubmitting(false);
        return;
      }

      await disputesService.create(debtId, email, {
        reason: data.reason,
        items: formattedItems,
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contestar Dívida</CardTitle>
            <CardDescription>
              Se algum dado desta dívida estiver incorreto, preencha o formulário abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isCompiled && debt && (
              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Dados da Dívida</AlertTitle>
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
                  Você está contestando {debtIds.length} dívida(s). Preencha os campos abaixo com os valores corretos para cada item que deseja contestar.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo Geral da Contestação *</Label>
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
                <div className="flex items-center justify-between">
                  <Label>Itens Contestados *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>

                {items && items.length > 0 ? (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label>Item {index + 1}</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              <Label>Campo Contestado</Label>
                              <select
                                {...register(`items.${index}.field`)}
                                className="w-full px-3 py-2 border rounded-md bg-background"
                              >
                                <option value="amount">Valor</option>
                                <option value="description">Descrição</option>
                                <option value="dueDate">Data de Vencimento</option>
                              </select>
                            </div>

                            {!isCompiled && debt && (
                              <div className="space-y-2">
                                <Label>Valor Atual</Label>
                                <Input
                                  value={
                                    watch(`items.${index}.field`) === 'amount'
                                      ? `R$ ${typeof debt.totalAmount === 'number' ? debt.totalAmount.toFixed(2) : debt.totalAmount}`
                                      : watch(`items.${index}.field`) === 'dueDate'
                                      ? debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('pt-BR') : 'Não informado'
                                      : debt[watch(`items.${index}.field`)] || 'Não informado'
                                  }
                                  disabled
                                  className="bg-muted"
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Valor Correto *</Label>
                              <Input
                                {...register(`items.${index}.correctValue`)}
                                placeholder={
                                  watch(`items.${index}.field`) === 'amount'
                                    ? 'R$ 0,00'
                                    : watch(`items.${index}.field`) === 'dueDate'
                                    ? 'DD/MM/AAAA'
                                    : 'Valor correto'
                                }
                                type={
                                  watch(`items.${index}.field`) === 'amount'
                                    ? 'number'
                                    : watch(`items.${index}.field`) === 'dueDate'
                                    ? 'date'
                                    : 'text'
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Motivo *</Label>
                              <Textarea
                                {...register(`items.${index}.reason`)}
                                placeholder="Explique por que este valor está incorreto..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Adicione pelo menos um item contestado usando o botão acima.
                    </AlertDescription>
                  </Alert>
                )}

                {errors.items && (
                  <p className="text-sm text-destructive">{errors.items.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
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

