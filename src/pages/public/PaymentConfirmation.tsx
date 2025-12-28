import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtorAccessService } from '@/services/debtor-access.service';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Calendar, Copy, DollarSign, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function PaymentConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const debtorToken = searchParams.get('token');
  const chargeIdsParam = searchParams.get('chargeIds');
  const returnToken = searchParams.get('returnToken') || debtorToken;

  // Parse chargeIds
  const chargeIds = chargeIdsParam ? chargeIdsParam.split(',') : [];

  // Buscar dados das charges via endpoint
  const { data, isLoading, error } = useQuery({
    queryKey: ['payment-confirmation', debtorToken, chargeIds],
    queryFn: async () => {
      if (!debtorToken || chargeIds.length === 0) {
        throw new Error('Parâmetros inválidos');
      }

      const apiModule = await import('@/lib/axios');
      const api = apiModule.default;
      const response = await api.post(`/debtor/${debtorToken}/payment-confirmation/create`, {
        chargeIds,
        returnToken,
      });

      return response.data;
    },
    enabled: !!debtorToken && chargeIds.length > 0,
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      if (!data || !data.debtorToken) return;

      const tokenToUse = data.returnToken || data.debtorToken;
      
      // Verificar se é token compilado (se returnToken existe e é diferente)
      const isCompiled = data.returnToken && data.returnToken !== data.debtorToken;
      
      if (isCompiled) {
        // Usar endpoint compilado
        return debtorAccessService.markMultipleChargesPaidFromCompiled(
          tokenToUse,
          chargeIds,
          notes || undefined,
        );
      } else {
        // Usar endpoint individual
        return debtorAccessService.markMultipleChargesPaid(tokenToUse, chargeIds, notes || undefined);
      }
    },
    onSuccess: () => {
      setConfirmed(true);
      toast.success('Pagamento confirmado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['debtor-debt'] });
      queryClient.invalidateQueries({ queryKey: ['compiled-debts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao confirmar pagamento');
    },
  });

  const handleCopyPixKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Chave PIX copiada!');
  };

  const handleConfirmPayment = () => {
    markPaidMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg text-foreground">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-semibold mb-2">Erro ao carregar dados</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Não foi possível carregar os dados do pagamento'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.history.back()}
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { charges, totalAmount, pixKey } = data;

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h2>
            <p className="text-muted-foreground mb-6">
              O pagamento foi registrado com sucesso. Você e o credor receberão emails de confirmação.
            </p>
            {(data?.returnToken || data?.debtorToken) && (
              <Button
                onClick={() => {
                  const tokenToUse = data.returnToken || data.debtorToken;
                  
                  // Usar a flag isCompiled do backend para determinar a rota correta
                  if (data.isCompiled) {
                    navigate(`/compiled-debts/${tokenToUse}`);
                  } else {
                    navigate(`/debtor/${tokenToUse}`);
                  }
                }}
              >
                Voltar para a dívida
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Confirmar Pagamento</h1>
          <p className="text-muted-foreground">
            Revise os detalhes abaixo e confirme após realizar o pagamento
          </p>
        </div>

        {/* Resumo das Charges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo do Pagamento
            </CardTitle>
            <CardDescription>
              {charges.length === 1
                ? '1 parcela selecionada'
                : `${charges.length} parcelas selecionadas`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {charges.map((charge: any) => (
                <div
                  key={charge.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {charge.installmentNumber
                          ? `Parcela ${charge.installmentNumber}/${charge.totalInstallments}`
                          : 'Cobrança única'}
                      </Badge>
                    </div>
                    <p className="font-medium mb-1">{charge.description || 'Sem descrição'}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Vencimento: {formatDateShort(charge.dueDate)}
                    </p>
                  </div>
                  <p className="font-bold text-xl ml-4">{formatCurrency(charge.amount)}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">Total a Pagar:</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chave PIX */}
        {pixKey && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Chave PIX para Pagamento</CardTitle>
              <CardDescription className="text-sm">
                Use esta chave PIX para realizar o pagamento no seu aplicativo bancário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg mb-4 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">Tipo: {pixKey.keyType}</p>
                <p className="font-mono font-bold text-lg md:text-xl break-all">{pixKey.keyValue}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleCopyPixKey(pixKey.keyValue)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Chave PIX
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Observações (opcional)</CardTitle>
            <CardDescription className="text-sm">
              Adicione informações sobre o pagamento, como data, horário ou comprovante
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Pagamento realizado via PIX em 28/12/2024 às 14:30..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Confirmação */}
        <Card className="border-2 border-primary/50 bg-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl md:text-2xl font-bold">Você já realizou o pagamento?</CardTitle>
            <CardDescription className="text-sm md:text-base mt-2 text-muted-foreground">
              Após confirmar, as parcelas serão marcadas como pagas e os emails serão enviados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Button
              className="w-full h-14 text-base font-semibold shadow-lg"
              onClick={handleConfirmPayment}
              disabled={markPaidMutation.isPending}
              size="lg"
            >
              {markPaidMutation.isPending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Sim, já paguei
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full h-11 text-sm text-muted-foreground hover:text-foreground"
              onClick={() => window.history.back()}
              disabled={markPaidMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Ainda não paguei
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

