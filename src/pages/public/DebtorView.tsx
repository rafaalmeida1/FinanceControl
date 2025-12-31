import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { debtorAccessService } from '@/services/debtor-access.service';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import {
  Calendar,
  DollarSign,
  FileText,
  Check,
  Copy,
  ExternalLink,
  QrCode,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { CancelRecurringModal } from '@/components/debt/CancelRecurringModal';
import { cn } from '@/lib/utils';

export default function DebtorView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['debtor-debt', token],
    queryFn: () => debtorAccessService.getDebt(token!),
    enabled: !!token,
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

  const handlePayCharge = (chargeId: string) => {
    navigate(`/payment-confirmation?token=${token}&chargeIds=${chargeId}`);
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

    if (!data?.debt) return;

    const pendingCharges = (data.debt.charges?.filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE') || []).sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

    const chargesToPay = pendingCharges.filter((c) => selectedCharges.has(c.id));
    const chargeIds = chargesToPay.map((c) => c.id).join(',');

    navigate(`/payment-confirmation?token=${token}&chargeIds=${chargeIds}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium text-foreground">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-destructive mb-2">Link Inválido</h1>
              <p className="text-muted-foreground">Este link expirou ou é inválido.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { debt } = data;
  const pendingCharges = (debt.charges?.filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE') || []).sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  const paidCharges = debt.charges?.filter((c) => c.status === 'PAID') || [];
  const currentCharge = pendingCharges[0];
  const otherPendingCharges = pendingCharges.slice(1);
  const totalSelected = pendingCharges
    .filter((c) => selectedCharges.has(c.id))
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const remainingAmount = debt.totalAmount - debt.paidAmount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 pb-24 md:pb-12">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Detalhes da Movimentação</h1>
          <p className="text-muted-foreground">
            Credor: <span className="font-medium">{debt.creditorName || debt.creditorEmail || 'Não informado'}</span>
          </p>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-xl font-bold">{formatCurrency(debt.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Pago</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(debt.paidAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Restante</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(remainingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Descrição */}
        {debt.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Descrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{debt.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Chave PIX */}
        {debt.pixKey && !debt.useGateway && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Chave PIX para Pagamento
              </CardTitle>
              <CardDescription>Use esta chave para realizar o pagamento no seu banco</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg border-2 border-dashed">
                <p className="text-xs text-muted-foreground mb-1">Tipo: {debt.pixKey.keyType}</p>
                <p className="font-mono font-bold text-lg break-all">{debt.pixKey.keyValue}</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleCopyPixKey(debt.pixKey!.keyValue)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Chave PIX
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Parcela Atual - Destaque */}
        {currentCharge && (
          <Card className="mb-6 border-2 border-primary bg-primary/5 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl md:text-2xl mb-2">Parcela Atual</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {currentCharge.installmentNumber
                        ? `Parcela ${currentCharge.installmentNumber}/${currentCharge.totalInstallments}`
                        : 'Cobrança única'}
                    </Badge>
                    <Badge className={cn(getStatusColor(currentCharge.status))}>
                      {getStatusLabel(currentCharge.status)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl md:text-4xl font-bold text-primary">{formatCurrency(currentCharge.amount)}</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-end gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    Vence em {formatDateShort(currentCharge.dueDate)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!debt.useGateway && (
                <Button
                  onClick={() => handlePayCharge(currentCharge.id)}
                  size="lg"
                  className="w-full"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Confirmar Pagamento
                </Button>
              )}

              {/* Mercado Pago */}
              {debt.useGateway && debt.preferredGateway === 'MERCADOPAGO' && (
                <div className="space-y-4">
                  {currentCharge.mercadoPagoQrCode && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2">
                          <QrCode className="h-5 w-5" />
                          QR Code PIX
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyQrCode(currentCharge.mercadoPagoQrCode!)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border-2 border-dashed flex justify-center">
                        <img
                          src={`data:image/png;base64,${currentCharge.mercadoPagoQrCode}`}
                          alt="QR Code PIX"
                          className="max-w-[250px] w-full"
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Escaneie o QR Code com o app do seu banco
                      </p>
                    </div>
                  )}
                  {currentCharge.mercadoPagoPaymentLink && (
                    <Button
                      onClick={() => handleOpenPaymentLink(currentCharge.mercadoPagoPaymentLink!)}
                      size="lg"
                      className="w-full"
                    >
                      <ExternalLink className="mr-2 h-5 w-5" />
                      Pagar via Mercado Pago
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Outras Parcelas */}
        {otherPendingCharges.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <CardTitle>Outras Parcelas Pendentes</CardTitle>
                {selectedCharges.size > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="text-sm text-muted-foreground text-center sm:text-left">
                      {selectedCharges.size} selecionada(s) - {formatCurrency(totalSelected)}
                    </div>
                    <Button onClick={handlePaySelected} size="sm" className="w-full sm:w-auto">
                      <Check className="mr-2 h-4 w-4" />
                      Pagar Selecionadas
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {otherPendingCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      id={`charge-${charge.id}`}
                      checked={selectedCharges.has(charge.id)}
                      onCheckedChange={() => handleToggleCharge(charge.id)}
                      className="mt-1"
                    />
                    <Label htmlFor={`charge-${charge.id}`} className="flex-1 cursor-pointer">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {charge.installmentNumber
                                ? `Parcela ${charge.installmentNumber}/${charge.totalInstallments}`
                                : 'Cobrança única'}
                            </Badge>
                            <Badge className={cn('text-xs', getStatusColor(charge.status))}>
                              {getStatusLabel(charge.status)}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold mb-1">{formatCurrency(charge.amount)}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Vence em {formatDateShort(charge.dueDate)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!debt.useGateway && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayCharge(charge.id);
                              }}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Pagar
                            </Button>
                          )}
                          {debt.useGateway && debt.preferredGateway === 'MERCADOPAGO' && (
                            <>
                              {charge.mercadoPagoPaymentLink && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPaymentLink(charge.mercadoPagoPaymentLink!);
                                  }}
                                >
                                  <ExternalLink className="mr-2 h-4 w-4" />
                                  Pagar
                                </Button>
                              )}
                              {charge.mercadoPagoQrCode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyQrCode(charge.mercadoPagoQrCode!);
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Parcelas Pagas */}
        {paidCharges.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Parcelas Pagas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {paidCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {charge.installmentNumber
                            ? `Parcela ${charge.installmentNumber}/${charge.totalInstallments}`
                            : 'Cobrança única'}
                        </Badge>
                        <Badge className="bg-green-600 text-xs">Paga</Badge>
                      </div>
                      <p className="font-semibold">{formatCurrency(charge.amount)}</p>
                      {charge.paidAt && (
                        <p className="text-xs text-muted-foreground">
                          Paga em {formatDateShort(charge.paidAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancelar Assinatura */}
        {debt.isRecurring && debt.recurringStatus === 'ACTIVE' && (
          <Alert className="border-destructive/50 bg-destructive/5">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold mb-1">Assinatura Recorrente Ativa</p>
                  <p className="text-sm text-muted-foreground">
                    Esta é uma assinatura recorrente. Você pode cancelá-la a qualquer momento.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setCancelDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar Assinatura
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Modal de Cancelamento */}
        {debt.isRecurring && (
          <CancelRecurringModal
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            debtId={debt.id}
            debtDescription={debt.description || 'Assinatura recorrente'}
            isMercadoPago={debt.useGateway && debt.preferredGateway === 'MERCADOPAGO'}
            onSuccess={() => {
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}
