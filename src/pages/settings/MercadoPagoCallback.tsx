import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { paymentsService } from '@/services/payments.service';
import { authStore } from '@/stores/authStore';

export default function MercadoPagoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = authStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Erro ao conectar Mercado Pago');
      navigate('/settings?tab=pagamentos');
      return;
    }

    if (code && user?.id) {
      handleCallback(code, user.id);
    } else {
      toast.error('Código de autorização ou usuário não encontrado');
      navigate('/settings?tab=pagamentos');
    }
  }, [searchParams, navigate, user]);

  const handleCallback = async (code: string, userId: string) => {
    try {
      await paymentsService.handleMercadoPagoCallback(code, userId);
      toast.success('Mercado Pago conectado com sucesso!');
      navigate('/settings?tab=pagamentos');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao processar autorização do Mercado Pago');
      navigate('/settings?tab=pagamentos');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <h2 className="text-xl font-bold">Conectando Mercado Pago</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Aguarde enquanto validamos sua autorização...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

