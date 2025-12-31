import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsService } from '@/services/debts.service';
import { chargesService } from '@/services/charges.service';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { ArrowLeft, Check, Copy, DollarSign, Calendar, FileText, User, CreditCard, AlertCircle, Loader2, ExternalLink, QrCode, XCircle, Send, Mail } from 'lucide-react';
import { useDebts } from '@/hooks/useDebts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Charge, Debt } from '@/types/api.types';
import { CancelRecurringModal } from '@/components/debt/CancelRecurringModal';

export default function DebtDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sendLink, isSendingLink } = useDebts();
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; charge?: Charge; allCharges?: boolean }>({ open: false });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data: debt, isLoading } = useQuery({
    queryKey: ['debt', id],
    queryFn: () => debtsService.getOne(id!),
    enabled: !!id,
  });

  const markChargePaidMutation = useMutation({
    mutationFn: ({ chargeId, notes }: { chargeId: string; notes?: string }) =>
      chargesService.markPaid(chargeId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Parcela marcada como paga!');
      setPaymentDialog({ open: false });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao marcar parcela como paga');
    },
  });

  const markAllPaidMutation = useMutation({
    mutationFn: ({ debtId, notes }: { debtId: string; notes?: string }) =>
      debtsService.markAsPaid(debtId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt', id] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Todas as parcelas foram marcadas como pagas!');
      setPaymentDialog({ open: false });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao marcar dívida como paga');
    },
  });

  const handleCopyPixKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Chave PIX copiada!');
  };

  const handleCopyQrCode = (qrCode: string) => {
    navigator.clipboard.writeText(qrCode);
    toast.success('QR Code copiado!');
  };

  const handleOpenPaymentLink = (link: string) => {
    window.open(link, '_blank');
  };

  const handlePayCharge = (charge: Charge) => {
    setPaymentDialog({ open: true, charge });
  };

  const handlePayAll = () => {
    setPaymentDialog({ open: true, allCharges: true });
  };

  const handleConfirmPayment = (notes?: string) => {
    if (paymentDialog.allCharges && debt) {
      markAllPaidMutation.mutate({ debtId: debt.id, notes });
    } else if (paymentDialog.charge) {
      markChargePaidMutation.mutate({ chargeId: paymentDialog.charge.id, notes });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!debt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Dívida não encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/debts')}>Voltar para lista</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Função helper para determinar a perspectiva da dívida do ponto de vista do usuário atual
  const getDebtPerspective = (debt: Debt) => {
    // Se userRole está definido, usar para determinar perspectiva
    if (debt.userRole === 'debtor') {
      return true; // "Eu devo"
    }
    if (debt.userRole === 'creditor') {
      return false; // "Alguém me deve"
    }
    // Se é owner ou userRole não está definido, usar isPersonalDebt original
    return debt.isPersonalDebt ?? false;
  };

  const pendingCharges = debt.charges?.filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE') || [];
  const paidCharges = debt.charges?.filter((c) => c.status === 'PAID') || [];
  const totalPending = pendingCharges.reduce((sum, c) => sum + Number(c.amount), 0);
  const isPersonalDebtFromUserPerspective = getDebtPerspective(debt);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/debts')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">Detalhes da Dívida</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {isPersonalDebtFromUserPerspective ? 'Dívida Pessoal' : 'Dívida de Terceiro'}
            </p>
          </div>
        </div>

        {/* Status Badge e Ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getStatusColor(debt.status)}>
              {getStatusLabel(debt.status)}
            </Badge>
            {isPersonalDebtFromUserPerspective && (
              <Badge variant="outline">Pessoal</Badge>
            )}
            {(debt as any).isRecurring && (debt as any).recurringStatus === 'ACTIVE' && (
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                Assinatura Ativa
              </Badge>
            )}
          </div>
          {(debt as any).isRecurring && (debt as any).recurringStatus === 'ACTIVE' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar Assinatura
            </Button>
          )}
        </div>

        {/* Main Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 lg:gap-4">
          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
                Valor Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg md:text-xl lg:text-2xl font-bold break-words">{formatCurrency(debt.totalAmount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <Check className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                Valor Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-green-600 break-words">{formatCurrency(debt.paidAmount || 0)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
                A Receber
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-orange-600 break-words">{formatCurrency(totalPending)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 md:pb-3">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 md:gap-2">
                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                Parcelas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg md:text-xl lg:text-2xl font-bold">
                {debt.charges?.length || 0} / {debt.installments || 1}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* PIX Key Card - Only show if not using gateway and debt is not paid */}
        {!debt.useGateway && debt.status !== 'PAID' && debt.pixKey && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Chave PIX para Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">Tipo: {debt.pixKey.keyType}</p>
                    <p className="text-base sm:text-lg font-mono font-bold break-all">{debt.pixKey.keyValue}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyPixKey(debt.pixKey!.keyValue)}
                    className="flex-shrink-0 self-start sm:self-auto"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Use esta chave PIX para realizar o pagamento. Após confirmar o pagamento, a chave será removida automaticamente.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Mercado Pago Payment Links - Show if using gateway and has pending charges */}
        {debt.useGateway && debt.preferredGateway === 'MERCADOPAGO' && pendingCharges.length > 0 && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Links de Pagamento - Mercado Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingCharges.map((charge) => {
                const hasPaymentLink = charge.mercadoPagoPaymentLink;
                const hasQrCode = charge.mercadoPagoQrCode;
                
                if (!hasPaymentLink && !hasQrCode) return null;

                return (
                  <div key={charge.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{formatCurrency(charge.amount)}</p>
                        {charge.installmentNumber && (
                          <p className="text-sm text-muted-foreground">
                            Parcela {charge.installmentNumber}/{charge.totalInstallments}
                          </p>
                        )}
                        {charge.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            Vencimento: {formatDateShort(charge.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>

                    {hasQrCode && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <QrCode className="h-4 w-4" />
                            QR Code PIX
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyQrCode(charge.mercadoPagoQrCode!)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border-2 border-dashed border-primary/20 flex justify-center">
                          <img
                            src={`data:image/png;base64,${charge.mercadoPagoQrCode}`}
                            alt="QR Code PIX"
                            className="max-w-[200px] sm:max-w-[250px] w-full"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Escaneie o QR Code com o app do seu banco para pagar
                        </p>
                      </div>
                    )}

                    {hasPaymentLink && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleOpenPaymentLink(charge.mercadoPagoPaymentLink!)}
                          className="flex-1"
                          size="sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Pagar via Mercado Pago
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Debt Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Devedor</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {debt.debtorName || debt.debtorEmail}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Credor</p>
                <p className="font-medium">{debt.creditorName || debt.creditorEmail || 'Você'}</p>
              </div>
              <Separator />
              {debt.description && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                    <p className="font-medium">{debt.description}</p>
                  </div>
                  <Separator />
                </>
              )}
              {debt.dueDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Vencimento
                  </p>
                  <p className="font-medium">{formatDateShort(debt.dueDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Actions */}
          {pendingCharges.length > 0 && !debt.useGateway && (
            <Card>
              <CardHeader>
                <CardTitle>Ações de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayAll}
                  disabled={markAllPaidMutation.isPending}
                >
                  {markAllPaidMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-5 w-5" />
                      Pagar Todas as Parcelas ({pendingCharges.length})
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Isso marcará todas as {pendingCharges.length} parcela(s) pendente(s) como pagas
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charges List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Parcelas / Cobranças</CardTitle>
              {debt && !debt.isPersonalDebt && pendingCharges.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Deseja enviar email com link de pagamento para todas as cobranças pendentes?')) {
                      sendLink(debt.id);
                    }
                  }}
                  disabled={isSendingLink}
                  className="flex items-center gap-2"
                >
                  {isSendingLink ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Email
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {debt.charges && debt.charges.length > 0 ? (
              <div className="space-y-4">
                {pendingCharges.map((charge, index) => (
                  <div
                    key={charge.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 border rounded-lg bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {charge.installmentNumber ? `Parcela ${charge.installmentNumber}/${charge.totalInstallments}` : 'Cobrança'}
                        </Badge>
                        <Badge className={getStatusColor(charge.status)}>
                          {getStatusLabel(charge.status)}
                        </Badge>
                      </div>
                      <p className="text-lg md:text-xl font-bold truncate">{formatCurrency(charge.amount)}</p>
                      {charge.dueDate && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          Vencimento: {formatDateShort(charge.dueDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
                      {!debt.useGateway && (
                        <Button
                          onClick={() => handlePayCharge(charge)}
                          disabled={markChargePaidMutation.isPending}
                          className="w-full sm:w-auto"
                          variant={index === 0 ? "default" : "outline"}
                        >
                          {markChargePaidMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Pagar Parcela
                            </>
                          )}
                        </Button>
                      )}
                      {!debt.isPersonalDebt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Deseja enviar email com link de pagamento para esta cobrança?`)) {
                              sendLink(debt.id);
                            }
                          }}
                          disabled={isSendingLink}
                          className="w-full sm:w-auto"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar Email
                        </Button>
                      )}
                      {debt.useGateway && debt.preferredGateway === 'MERCADOPAGO' && (
                        <div className="flex flex-col gap-2 w-full sm:w-auto">
                        {charge.mercadoPagoPaymentLink && (
                          <Button
                            variant={index === 0 ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleOpenPaymentLink(charge.mercadoPagoPaymentLink!)}
                            className="w-full"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Pagar
                          </Button>
                        )}
                        {charge.mercadoPagoQrCode && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyQrCode(charge.mercadoPagoQrCode!)}
                            className="w-full"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar QR
                          </Button>
                        )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {paidCharges.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <p className="text-sm font-medium text-muted-foreground mb-2">Parcelas Pagas</p>
                    {paidCharges.map((charge) => (
                      <div
                        key={charge.id}
                        className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 opacity-75"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {charge.installmentNumber ? `Parcela ${charge.installmentNumber}/${charge.totalInstallments}` : 'Cobrança'}
                            </Badge>
                            <Badge className="bg-green-600 dark:bg-green-700">Paga</Badge>
                          </div>
                          <p className="text-lg md:text-xl font-bold truncate">{formatCurrency(charge.amount)}</p>
                          {charge.paidAt && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              Paga em: {formatDateShort(charge.paidAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma cobrança encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {paymentDialog.allCharges ? 'Confirmar Pagamento de Todas as Parcelas' : 'Confirmar Pagamento de Parcela'}
            </DialogTitle>
            <DialogDescription>
              {paymentDialog.allCharges ? (
                <>
                  Você está prestes a marcar <strong>todas as {pendingCharges.length} parcela(s) pendente(s)</strong> como pagas.
                  <br />
                  <br />
                  <strong>Total:</strong> {formatCurrency(totalPending)}
                  <br />
                  <br />
                  Após confirmar, todas as parcelas serão marcadas como pagas e a chave PIX será removida.
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
                  Após confirmar, esta parcela será marcada como paga. Se todas as parcelas forem pagas, a chave PIX será removida.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog({ open: false })}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleConfirmPayment()}
              disabled={markChargePaidMutation.isPending || markAllPaidMutation.isPending}
            >
              {(markChargePaidMutation.isPending || markAllPaidMutation.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Cancelamento de Assinatura */}
        {(debt as any).isRecurring && (
          <CancelRecurringModal
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            debtId={debt.id}
            debtDescription={debt.description || 'Assinatura recorrente'}
            isMercadoPago={debt.useGateway && debt.preferredGateway === 'MERCADOPAGO'}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['debt', id] });
              queryClient.invalidateQueries({ queryKey: ['debts'] });
            }}
          />
        )}
      </div>
    );
  }

