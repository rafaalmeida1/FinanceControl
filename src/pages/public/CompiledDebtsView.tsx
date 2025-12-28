import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { debtorAccessService } from '@/services/debtor-access.service';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { Calendar, Check, Copy, Eye, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function CompiledDebtsView() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  
  // Detectar mobile (usar state para reagir a mudanças de tamanho) - DEVE SER ANTES DE QUALQUER EARLY RETURN
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { data, isLoading, error } = useQuery({
    queryKey: ['compiled-debts', token],
    queryFn: () => debtorAccessService.getCompiledDebts(token!),
    enabled: !!token,
  });

  // Detectar mudanças de tamanho da tela
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
    
    // Redirecionar para tela de confirmação de pagamento
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
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg text-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Erro ao carregar dívidas compiladas</p>
            <p className="text-sm text-muted-foreground mt-2">
              Link inválido ou expirado
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { debts, currentCharges, futureCharges, allCharges, pixKey } = data;
  const totalAmount = allCharges?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;
  const currentChargesTotal =
    currentCharges?.reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;
  const selectedTotal = allCharges
    ?.filter((c: any) => selectedCharges.has(c.id))
    .reduce((sum: number, c: any) => sum + Number(c.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-background py-4 md:py-12 px-4 pb-24 md:pb-12">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 pt-2">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 md:mb-2">
            Dívidas Compiladas
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Suas cobranças agrupadas por PIX
          </p>
        </div>

        {/* Parcela Atual (Mês Atual) */}
        {currentCharges && currentCharges.length > 0 && (
          <Card className="border-2 border-primary-500 bg-primary-900/10">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg md:text-xl text-primary-500">
                    Parcela Atual (Mês Atual)
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {currentCharges.length === 1
                      ? 'Cobrança do mês atual'
                      : `${currentCharges.length} cobranças do mês atual`}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-base md:text-lg font-bold w-fit">
                  {formatCurrency(currentChargesTotal)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 md:space-y-3">
                {currentCharges.map((charge: any) => (
                  <div
                    key={charge.id}
                    className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-muted rounded-lg"
                  >
                    <Checkbox
                      checked={selectedCharges.has(charge.id)}
                      onCheckedChange={() => handleToggleCharge(charge.id)}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">
                        {charge.debt?.description || 'Sem descrição'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateShort(charge.dueDate)}
                        </span>
                        {charge.installmentNumber && charge.totalInstallments && (
                          <span>
                            Parcela {charge.installmentNumber}/{charge.totalInstallments}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-base md:text-lg">{formatCurrency(charge.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chave PIX */}
        {pixKey && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Chave PIX para Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 bg-muted rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">
                    Tipo: {pixKey.keyType}
                  </p>
                  <p className="font-mono font-bold text-base md:text-lg break-all">
                    {pixKey.keyValue}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyPixKey(pixKey.keyValue)}
                  className="w-full sm:w-auto flex-shrink-0"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Outras Parcelas Futuras */}
        {futureCharges && futureCharges.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Outras Parcelas</CardTitle>
              <CardDescription className="text-xs md:text-sm">Parcelas futuras agrupadas</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 md:space-y-3">
                {futureCharges.map((charge: any) => (
                  <div
                    key={charge.id}
                    className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-muted rounded-lg"
                  >
                    <Checkbox
                      checked={selectedCharges.has(charge.id)}
                      onCheckedChange={() => handleToggleCharge(charge.id)}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">
                        {charge.debt?.description || 'Sem descrição'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateShort(charge.dueDate)}
                        </span>
                        {charge.installmentNumber && charge.totalInstallments && (
                          <span>
                            Parcela {charge.installmentNumber}/{charge.totalInstallments}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm md:text-base">{formatCurrency(charge.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalhamento por Dívida com Links */}
        {debts && debts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Detalhamento por Dívida</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Visualize detalhes ou conteste cada dívida individualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 md:space-y-4">
                {debts.map((debt: any) => {
                  const debtCharges = allCharges?.filter((c: any) => c.debt?.id === debt.id) || [];
                  const debtTotal = debtCharges.reduce(
                    (sum: number, c: any) => sum + Number(c.amount),
                    0,
                  );

                  return (
                    <div key={debt.id} className="p-3 md:p-4 bg-muted rounded-lg border">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm md:text-base mb-1">
                            {debt.description || 'Sem descrição'}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {debtCharges.length} parcela(s) pendente(s)
                          </p>
                        </div>
                        <Badge className="text-sm md:text-base px-2 md:px-3 py-1">
                          {formatCurrency(debtTotal)}
                        </Badge>
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

        {/* Total Compilado - Desktop */}
        {allCharges && allCharges.length > 0 && (
          <Card className="hidden md:block">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Compilado</p>
                  <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {allCharges.length} parcela(s) de {debts?.length || 0} dívida(s)
                  </p>
                </div>
                {selectedCharges.size > 0 && (
                  <Button onClick={handlePaySelected} size="lg">
                    <Check className="mr-2 h-4 w-4" />
                    Pagar {selectedCharges.size} Selecionada(s)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Widget de Pagamento Flutuante (Mobile) */}
        {isMobile && selectedCharges.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden p-4 bg-background border-t shadow-lg">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {selectedCharges.size} parcela(s) selecionada(s)
                  </p>
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
