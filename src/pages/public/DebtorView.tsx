import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { debtorAccessService } from '@/services/debtor-access.service';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Calendar, DollarSign, FileText, Check, Copy, ExternalLink, QrCode, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { CancelRecurringModal } from '@/components/debt/CancelRecurringModal';

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
    // Se for base64, extrair apenas o código PIX (se houver)
    // Por enquanto, copiar o QR code completo
    navigator.clipboard.writeText(qrCode);
    toast.success('QR Code copiado!');
  };

  const handleOpenPaymentLink = (link: string) => {
    window.open(link, '_blank');
  };

  const handlePayCharge = (chargeId: string) => {
    // Redirecionar para tela de confirmação de pagamento
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

    // Ordenar cobranças pendentes por data de vencimento (mais próxima primeiro)
    const pendingCharges = (data.debt.charges?.filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE') || []).sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
    
    const chargesToPay = pendingCharges.filter((c) => selectedCharges.has(c.id));
    const chargeIds = chargesToPay.map((c) => c.id).join(',');
    
    // Redirecionar para tela de confirmação de pagamento
    navigate(`/payment-confirmation?token=${token}&chargeIds=${chargeIds}`);
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
  // Ordenar cobranças pendentes por data de vencimento (mais próxima primeiro)
  const pendingCharges = (debt.charges?.filter((c) => c.status === 'PENDING' || c.status === 'OVERDUE') || []).sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
  const paidCharges = debt.charges?.filter((c) => c.status === 'PAID') || [];
  const currentCharge = pendingCharges[0]; // Parcela atual (primeira da lista ordenada)
  const otherPendingCharges = pendingCharges.slice(1); // Outras parcelas
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

        {/* Parcela Atual (Destaque) */}
        {currentCharge && (
          <Card className="mb-6 border-2 border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Parcela Atual
                    <Badge className="bg-primary text-primary-foreground">
                      {currentCharge.installmentNumber
                        ? `Parcela ${currentCharge.installmentNumber}/${currentCharge.totalInstallments}`
                        : 'Cobrança única'}
                    </Badge>
                  </CardTitle>
                </div>
                <Badge className={getStatusColor(currentCharge.status)}>
                  {getStatusLabel(currentCharge.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-2xl font-bold mb-2">{formatCurrency(currentCharge.amount)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Vencimento: {formatDateShort(currentCharge.dueDate)}
                  </p>
                </div>
                {!debt.useGateway && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePayCharge(currentCharge.id);
                    }}
                    className="ml-4"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Pagar Esta
                  </Button>
                  )}
                </div>

                {/* Mercado Pago - Botão e QR Code */}
                {debt.useGateway && debt.preferredGateway === 'MERCADOPAGO' && (
                  <div className="space-y-4 pt-4 border-t">
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
                            Copiar QR Code
                          </Button>
                        </div>
                        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-primary/20 flex justify-center">
                          <img
                            src={`data:image/png;base64,${currentCharge.mercadoPagoQrCode}`}
                            alt="QR Code PIX"
                            className="max-w-[250px] w-full"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Escaneie o QR Code com o app do seu banco para pagar
                        </p>
                      </div>
                    )}
                    {currentCharge.mercadoPagoPaymentLink && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleOpenPaymentLink(currentCharge.mercadoPagoPaymentLink!)}
                          className="flex-1"
                          size="lg"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Pagar via Mercado Pago
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Outras Cobranças Pendentes */}
        {otherPendingCharges.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Outras Parcelas Pendentes</CardTitle>
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
                {otherPendingCharges.map((charge) => (
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
                              handlePayCharge(charge.id);
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Pagar Esta
                          </Button>
                        )}
                        {debt.useGateway && debt.preferredGateway === 'MERCADOPAGO' && (
                          <div className="flex flex-col gap-2">
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
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyQrCode(charge.mercadoPagoQrCode!);
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copiar QR
                              </Button>
                            )}
                          </div>
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

        {/* Botão de Cancelar Assinatura (se for recorrente) */}
        {debt.isRecurring && debt.recurringStatus === 'ACTIVE' && (
          <Card className="mt-6 border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Assinatura Recorrente Ativa</h3>
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
            </CardContent>
          </Card>
        )}

        {/* Modal de Cancelamento de Assinatura */}
        {debt.isRecurring && (
          <CancelRecurringModal
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            debtId={debt.id}
            debtDescription={debt.description || 'Assinatura recorrente'}
            isMercadoPago={debt.useGateway && debt.preferredGateway === 'MERCADOPAGO'}
            onSuccess={() => {
              // Recarregar dados da dívida
              window.location.reload();
            }}
          />
        )}
      </div>
    </div>
  );
}

