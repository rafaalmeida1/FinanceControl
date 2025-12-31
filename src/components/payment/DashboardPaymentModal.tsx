import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtorAccessService } from '@/services/debtor-access.service';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Calendar, Copy, DollarSign, Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { ProofUpload } from '@/components/payment/ProofUpload';
import { Debt, Charge } from '@/types/api.types';

interface DashboardPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt;
  charges: Charge[];
  onSuccess?: () => void;
}

export function DashboardPaymentModal({
  open,
  onOpenChange,
  debt,
  charges,
  onSuccess,
}: DashboardPaymentModalProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [proofDocumentPath, setProofDocumentPath] = useState<string | null>(null);
  const [proofDocumentMimeType, setProofDocumentMimeType] = useState<string | null>(null);

  const chargeIds = charges.map((c) => c.id);
  const debtorToken = debt.accessTokens?.[0]?.token;

  // Buscar dados das charges via endpoint de confirmação
  const { data, isLoading, error } = useQuery({
    queryKey: ['payment-confirmation', debtorToken, chargeIds],
    queryFn: async () => {
      if (!debtorToken || chargeIds.length === 0) {
        throw new Error('Token de acesso não encontrado');
      }

      const apiModule = await import('@/lib/axios');
      const api = apiModule.default;
      const response = await api.post(`/debtor/${debtorToken}/payment-confirmation/create`, {
        chargeIds,
        returnToken: debtorToken,
      });

      return response.data;
    },
    enabled: open && !!debtorToken && chargeIds.length > 0,
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      if (!data || !data.debtorToken) return;

      const tokenToUse = data.returnToken || data.debtorToken;

      // Verificar se é token compilado
      const isCompiled = data.returnToken && data.returnToken !== data.debtorToken;

      if (isCompiled) {
        return debtorAccessService.markMultipleChargesPaidFromCompiled(
          tokenToUse,
          chargeIds,
          notes || undefined,
          proofDocumentPath || undefined,
          proofDocumentMimeType || undefined,
        );
      } else {
        return debtorAccessService.markMultipleChargesPaid(
          tokenToUse,
          chargeIds,
          notes || undefined,
          proofDocumentPath || undefined,
          proofDocumentMimeType || undefined,
        );
      }
    },
    onSuccess: () => {
      setConfirmed(true);
      toast.success('Pagamento confirmado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['debt', debt.id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['compiled-debts'] });
      onSuccess?.();
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        onOpenChange(false);
        setConfirmed(false);
        setNotes('');
        setProofDocumentPath(null);
        setProofDocumentMimeType(null);
      }, 2000);
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

  const handleClose = () => {
    if (!markPaidMutation.isPending && !confirmed) {
      onOpenChange(false);
      setNotes('');
      setProofDocumentPath(null);
      setProofDocumentMimeType(null);
    }
  };

  // Resetar estado quando modal fecha
  useEffect(() => {
    if (!open) {
      setConfirmed(false);
      setNotes('');
      setProofDocumentPath(null);
      setProofDocumentMimeType(null);
    }
  }, [open]);

  if (!debtorToken) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Erro</DialogTitle>
            <DialogDescription>
              Token de acesso não encontrado. Não é possível processar o pagamento.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleClose}>Fechar</Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-muted-foreground">Carregando dados do pagamento...</p>
          </div>
        ) : error || !data ? (
          <div className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-semibold mb-2">Erro ao carregar dados</p>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {error instanceof Error ? error.message : 'Não foi possível carregar os dados do pagamento'}
            </p>
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        ) : confirmed ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h2>
            <p className="text-muted-foreground mb-6 text-center">
              O pagamento foi registrado com sucesso. Você e o credor receberão emails de confirmação.
            </p>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Confirmar Pagamento</DialogTitle>
              <DialogDescription>
                Revise os detalhes abaixo e confirme após realizar o pagamento
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
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
                    {charges.map((charge) => (
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
                          <p className="font-medium mb-1">{charge.description || debt.description || 'Sem descrição'}</p>
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
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(charges.reduce((sum, c) => sum + c.amount, 0))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chave PIX */}
              {data.pixKey && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Chave PIX para Pagamento</CardTitle>
                    <CardDescription className="text-sm">
                      Use esta chave PIX para realizar o pagamento no seu aplicativo bancário
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg mb-4 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Tipo: {data.pixKey.keyType}</p>
                      <p className="font-mono font-bold text-lg md:text-xl break-all">{data.pixKey.keyValue}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleCopyPixKey(data.pixKey.keyValue)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Chave PIX
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Comprovante de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comprovante de Pagamento</CardTitle>
                  <CardDescription className="text-sm">
                    Envie uma foto ou PDF do comprovante para facilitar a confirmação
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProofUpload
                    onUploadComplete={(path, mimeType) => {
                      setProofDocumentPath(path);
                      setProofDocumentMimeType(mimeType);
                    }}
                    onRemove={() => {
                      setProofDocumentPath(null);
                      setProofDocumentMimeType(null);
                    }}
                  />
                </CardContent>
              </Card>

              {/* Observações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Observações (opcional)</CardTitle>
                  <CardDescription className="text-sm">
                    Adicione informações sobre o pagamento, como data e horário
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
                    onClick={handleClose}
                    disabled={markPaidMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Ainda não paguei
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

