import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/axios';

interface ChargeData {
  charge: {
    id: string;
    amount: number;
    dueDate: string;
    description?: string;
    installmentNumber?: number;
    totalInstallments?: number;
  };
  isInstallment: boolean;
  installmentNumber?: number;
  totalInstallments?: number;
}

export default function ConfirmPayment() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [chargeData, setChargeData] = useState<ChargeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadChargeData();
    }
  }, [token]);

  const loadChargeData = async () => {
    try {
      const response = await api.get(`/payments/confirm/${token}`);
      setChargeData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados da cobrança');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!token) return;

    setConfirming(true);
    try {
      const response = await api.post(`/payments/confirm/${token}`);
      navigate(`/payments/confirm/${token}/success`, {
        state: {
          isLastInstallment: response.data.isLastInstallment,
          isInstallment: chargeData?.isInstallment,
          installmentNumber: chargeData?.installmentNumber,
        },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao confirmar pagamento');
      setConfirming(false);
    }
  };

  const handleNotPaid = () => {
    // Apenas fechar ou redirecionar
    window.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Carregando dados da cobrança...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <h2 className="text-xl font-bold">Erro</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chargeData) {
    return null;
  }

  const { charge } = chargeData;
  const amount = typeof charge.amount === 'number' ? charge.amount.toFixed(2) : charge.amount;
  const dueDate = new Date(charge.dueDate).toLocaleDateString('pt-BR');

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirmar Recebimento</CardTitle>
          <CardDescription>
            Por favor, confirme se você recebeu o pagamento desta cobrança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Valor</span>
              <span className="text-2xl font-bold text-primary">R$ {amount}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vencimento:</span>
                <span className="text-sm font-medium">{dueDate}</span>
              </div>
              {charge.description && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Descrição:</span>
                  <span className="text-sm font-medium">{charge.description}</span>
                </div>
              )}
              {chargeData.isInstallment && charge.installmentNumber && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Parcela:</span>
                  <span className="text-sm font-medium">
                    {charge.installmentNumber} de {charge.totalInstallments}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full"
              size="lg"
            >
              {confirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Sim, foi pago
                </>
              )}
            </Button>

            <Button
              onClick={handleNotPaid}
              variant="outline"
              className="w-full"
              disabled={confirming}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Não, ainda não foi pago
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

