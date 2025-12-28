import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtorAccessService } from '@/services/debtor-access.service';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Calendar, DollarSign, FileText, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Charge } from '@/types/api.types';

export default function DebtorView() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    charge?: Charge;
    multipleCharges?: Charge[];
  }>({ open: false });

  const { data, isLoading, error } = useQuery({
    queryKey: ['debtor-debt', token],
    queryFn: () => debtorAccessService.getDebt(token!),
    enabled: !!token,
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ chargeId, notes }: { chargeId: string; notes?: string }) =>
      debtorAccessService.markChargePaid(token!, chargeId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debtor-debt', token] });
      toast.success('Parcela marcada como paga!');
      setPaymentDialog({ open: false });
      setSelectedCharges(new Set());
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao marcar parcela como paga');
    },
  });

  const markMultiplePaidMutation = useMutation({
    mutationFn: ({ chargeIds, notes }: { chargeIds: string[]; notes?: string }) =>
      debtorAccessService.markMultipleChargesPaid(token!, chargeIds, notes),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['debtor-debt', token] });
      toast.success(`${data.charges.length} parcela(s) marcada(s) como paga(s)!`);
      setPaymentDialog({ open: false });
      setSelectedCharges(new Set());
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao marcar parcelas como pagas');
    },
  });

  const handleCopyPixKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Chave PIX copiada!');
  };

  const handlePayCharge = (charge: Charge) => {
    setPaymentDialog({ open: true, charge });
  };

  const handleToggleCharge = (chargeId: string) => {
    const newSelected = new Set(selectedCharges);
    if (newSelected.has(chargeId)) {
      newSelected.delete(chargeId);
    } else {
      newSelected.add(chargeId);
    }
    setSelectedCharges(newSelected);
  };

  const handlePaySelected = () => {
    if (selectedCharges.size === 0) {
      toast.error('Selecione pelo menos uma parcela para pagar');
      return;
    }

    const chargesToPay = pendingCharges.filter((c) => selectedCharges.has(c.id));
    setPaymentDialog({ open: true, multipleCharges: chargesToPay });
  };

  const handleConfirmPayment = (notes?: string) => {
    if (paymentDialog.charge) {
      markPaidMutation.mutate({ chargeId: paymentDialog.charge.id, notes });
    } else if (paymentDialog.multipleCharges) {
      markMultiplePaidMutation.mutate({
        chargeIds: paymentDialog.multipleCharges.map((c) => c.id),
        notes,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card text-card-foreground rounded-lg border p-6 max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">Link Inválido</h1>
          <p className="text-muted-foreground">Este link expirou ou é inválido.</p>
        </div>
      </div>
    );
  }

  const { debt } = data;
  const pendingCharges = debt.charges?.filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE') || [];
  const paidCharges = debt.charges?.filter((c) => c.status === 'PAID') || [];
  const totalSelected = pendingCharges
    .filter((c) => selectedCharges.has(c.id))
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card text-card-foreground rounded-lg border p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Detalhes da Dívida</h1>
          <p className="text-muted-foreground">
            Credor: {debt.creditorName || debt.creditorEmail || 'Não informado'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-primary" size={24} />
              <h3 className="font-semibold">Valor Total</h3>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(debt.totalAmount)}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-green-600" size={24} />
              <h3 className="font-semibold">Valor Pago</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(debt.paidAmount)}</p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} />
              <h3 className="font-semibold">Status</h3>
            </div>
            <span className={`badge ${getStatusColor(debt.status)}`}>
              {getStatusLabel(debt.status)}
            </span>
          </div>
        </div>

        {debt.description && (
          <div className="bg-card text-card-foreground rounded-lg border p-6 mb-6">
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-muted-foreground">{debt.description}</p>
          </div>
        )}

        {/* Chave PIX */}
        {debt.pixKey && !debt.useGateway && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Chave PIX para Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {debt.pixKey.keyType}: <span className="font-mono font-bold text-lg">{debt.pixKey.keyValue}</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleCopyPixKey(debt.pixKey!.keyValue)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Use esta chave PIX para realizar o pagamento. Após o pagamento, você pode marcar a(s) parcela(s) como paga(s) abaixo.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Cobranças Pendentes */}
        {pendingCharges.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cobranças Pendentes</CardTitle>
                {selectedCharges.size > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {selectedCharges.size} selecionada(s) - Total: {formatCurrency(totalSelected)}
                    </span>
                    <Button onClick={handlePaySelected} size="sm">
                      <Check className="mr-2 h-4 w-4" />
                      Pagar Selecionadas
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center gap-3 p-4 bg-muted rounded-lg border"
                  >
                    <Checkbox
                      id={`charge-${charge.id}`}
                      checked={selectedCharges.has(charge.id)}
                      onCheckedChange={() => handleToggleCharge(charge.id)}
                    />
                    <Label htmlFor={`charge-${charge.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">
                              {charge.installmentNumber
                                ? `Parcela ${charge.installmentNumber}/${charge.totalInstallments}`
                                : 'Cobrança única'}
                            </Badge>
                            <Badge className={getStatusColor(charge.status)}>
                              {getStatusLabel(charge.status)}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold mb-1">{formatCurrency(charge.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            <Calendar className="inline" size={14} />{' '}
                            Vencimento: {formatDateShort(charge.dueDate)}
                          </p>
                        </div>
                        {!debt.useGateway && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayCharge(charge);
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Pagar Esta
                          </Button>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cobranças Pagas */}
        {paidCharges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Cobranças Pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paidCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg opacity-75"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">
                          {charge.installmentNumber
                            ? `Parcela ${charge.installmentNumber}/${charge.totalInstallments}`
                            : 'Cobrança única'}
                        </Badge>
                        <Badge className="bg-green-600">Paga</Badge>
                      </div>
                      <p className="text-lg font-bold mb-1">{formatCurrency(charge.amount)}</p>
                      {charge.paidAt && (
                        <p className="text-sm text-muted-foreground">
                          Paga em: {formatDateShort(charge.paidAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentDialog.multipleCharges
                ? `Confirmar Pagamento de ${paymentDialog.multipleCharges.length} Parcela(s)`
                : 'Confirmar Pagamento'}
            </DialogTitle>
            <DialogDescription>
              {paymentDialog.multipleCharges ? (
                <>
                  Você está prestes a marcar {paymentDialog.multipleCharges.length} parcela(s) como paga(s):
                  <br />
                  <br />
                  <div className="space-y-2 mt-3">
                    {paymentDialog.multipleCharges.map((charge) => (
                      <div key={charge.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">
                          {charge.installmentNumber
                            ? `Parcela ${charge.installmentNumber}/${charge.totalInstallments}`
                            : 'Cobrança única'}
                        </span>
                        <span className="font-bold">{formatCurrency(charge.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <br />
                  <strong>Total: {formatCurrency(paymentDialog.multipleCharges.reduce((sum, c) => sum + Number(c.amount), 0))}</strong>
                  <br />
                  <br />
                  Após confirmar, todas as parcelas selecionadas serão marcadas como pagas. Você e o credor receberão emails de confirmação.
                </>
              ) : paymentDialog.charge ? (
                <>
                  Você está prestes a marcar esta parcela como paga:
                  <br />
                  <br />
                  <strong>Valor:</strong> {formatCurrency(paymentDialog.charge.amount)}
                  {paymentDialog.charge.installmentNumber && (
                    <>
                      <br />
                      <strong>Parcela:</strong> {paymentDialog.charge.installmentNumber}/{paymentDialog.charge.totalInstallments}
                    </>
                  )}
                  <br />
                  <br />
                  Após confirmar, esta parcela será marcada como paga. Você e o credor receberão emails de confirmação.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Pagamento realizado via PIX..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false })}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const notesElement = document.getElementById('notes') as HTMLTextAreaElement;
                handleConfirmPayment(notesElement?.value || undefined);
              }}
              disabled={markPaidMutation.isPending || markMultiplePaidMutation.isPending}
            >
              {markPaidMutation.isPending || markMultiplePaidMutation.isPending
                ? 'Processando...'
                : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
