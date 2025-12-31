import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { debtorAccessService } from '@/services/debtor-access.service';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Calendar, Check, Copy, Eye, AlertTriangle, Loader2, QrCode, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function CompiledDebtsView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { data, isLoading, error } = useQuery({
    queryKey: ['compiled-debts', token],
    queryFn: () => debtorAccessService.getCompiledDebts(token!),
    enabled: !!token,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePaySelected = () => {
    if (selectedCharges.size === 0) {
      toast.error('Selecione pelo menos uma parcela para pagar');
      return;
    }

    if (!data?.allCharges || !token) return;

    const chargesToPay = data.allCharges.filter((c: any) => selectedCharges.has(c.id));
    const chargeIds = chargesToPay.map((c: any) => c.id).join(',');

    navigate(`/payment-confirmation?token=${token}&chargeIds=${chargeIds}&returnToken=${token}`);
  };

  const handleCopyPixKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Chave PIX copiada!');
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

  const handleDisputeDebt = (debt: any) => {
    if (debt.disputeLink) {
      navigate(debt.disputeLink.replace(window.location.origin, ''));
    }
  };

  const handleViewDebtDetails = (debt: any) => {
    if (debt.accessLink) {
      navigate(debt.accessLink.replace(window.location.origin, ''));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium text-foreground">Carregando movimentações...</p>
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
              <p className="text-destructive font-semibold mb-2">Erro ao carregar movimentações</p>
              <p className="text-sm text-muted-foreground">Link inválido ou expirado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { debts, currentCharges, futureCharges, allCharges, pixKey } = data;
  const totalAmount = allCharges?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;
  const currentChargesTotal = currentCharges?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;
  const selectedTotal = allCharges
    ?.filter((c: any) => selectedCharges.has(c.id))
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 pb-24 md:pb-12">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Movimentações Compiladas</h1>
          <p className="text-muted-foreground">Suas cobranças agrupadas por chave PIX</p>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Compilado</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parcelas</p>
                  <p className="text-xl font-bold">{allCharges?.length || 0} parcela(s)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parcelas do Mês Atual - Destaque */}
        {currentCharges && currentCharges.length > 0 && (
          <Card className="mb-6 border-2 border-primary bg-primary/5 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl md:text-2xl mb-2">Parcelas do Mês Atual</CardTitle>
                  <CardDescription>
                    {currentCharges.length === 1
                      ? '1 cobrança do mês atual'
                      : `${currentCharges.length} cobranças do mês atual`}
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg font-bold px-4 py-2">
                  {formatCurrency(currentChargesTotal)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentCharges.map((charge: any) => (
                  <div
                    key={charge.id}
                    className="flex items-start gap-3 p-4 bg-background rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedCharges.has(charge.id)}
                      onCheckedChange={() => handleToggleCharge(charge.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold mb-1">{charge.debt?.description || 'Sem descrição'}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateShort(charge.dueDate)}
                            </span>
                            {charge.installmentNumber && charge.totalInstallments && (
                              <Badge variant="outline" className="text-xs">
                                Parcela {charge.installmentNumber}/{charge.totalInstallments}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(charge.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chave PIX */}
        {pixKey && (
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
                <p className="text-xs text-muted-foreground mb-1">Tipo: {pixKey.keyType}</p>
                <p className="font-mono font-bold text-lg break-all">{pixKey.keyValue}</p>
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

        {/* Outras Parcelas Futuras */}
        {futureCharges && futureCharges.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Outras Parcelas</CardTitle>
              <CardDescription>Parcelas futuras agrupadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {futureCharges.map((charge: any) => (
                  <div
                    key={charge.id}
                    className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      checked={selectedCharges.has(charge.id)}
                      onCheckedChange={() => handleToggleCharge(charge.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium mb-1">{charge.debt?.description || 'Sem descrição'}</p>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDateShort(charge.dueDate)}
                            </span>
                            {charge.installmentNumber && charge.totalInstallments && (
                              <Badge variant="outline" className="text-xs">
                                Parcela {charge.installmentNumber}/{charge.totalInstallments}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-base font-bold">{formatCurrency(charge.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalhamento por Dívida */}
        {debts && debts.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Detalhamento por Movimentação</CardTitle>
              <CardDescription>Visualize detalhes ou conteste cada movimentação individualmente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {debts.map((debt: any) => {
                  const debtCharges = allCharges?.filter((c: any) => c.debt?.id === debt.id) || [];
                  const debtTotal = debtCharges.reduce((sum: number, c: any) => sum + Number(c.amount), 0);

                  return (
                    <div key={debt.id} className="p-4 bg-muted/50 rounded-lg border">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <p className="font-semibold mb-1">{debt.description || 'Sem descrição'}</p>
                          <p className="text-sm text-muted-foreground">
                            {debtCharges.length} parcela(s) pendente(s)
                          </p>
                        </div>
                        <Badge className="text-base px-3 py-1">{formatCurrency(debtTotal)}</Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDebtDetails(debt)}
                          className="flex-1 sm:flex-none"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisputeDebt(debt)}
                          className="flex-1 sm:flex-none"
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Contestar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de Pagar Selecionadas - Desktop */}
        {selectedCharges.size > 0 && !isMobile && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Selecionado</p>
                  <p className="text-3xl font-bold">{formatCurrency(selectedTotal)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedCharges.size} parcela(s) selecionada(s)
                  </p>
                </div>
                <Button onClick={handlePaySelected} size="lg">
                  <Check className="mr-2 h-5 w-5" />
                  Pagar Selecionadas
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Widget Flutuante Mobile */}
        {isMobile && selectedCharges.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden p-4 bg-background/95 backdrop-blur border-t shadow-lg">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{selectedCharges.size} parcela(s) selecionada(s)</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedTotal)}</p>
                </div>
                <Button onClick={handlePaySelected} size="lg" className="h-12 px-6">
                  <Check className="mr-2 h-5 w-5" />
                  Pagar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
