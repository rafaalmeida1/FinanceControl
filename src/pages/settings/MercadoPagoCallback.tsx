import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function MercadoPagoCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      toast.success('Mercado Pago conectado com sucesso!');
      // Redirecionar após um breve delay para mostrar a mensagem
      setTimeout(() => {
        navigate('/settings?tab=pagamentos', { replace: true });
      }, 2000);
    } else if (error) {
      toast.error(`Erro ao conectar Mercado Pago: ${decodeURIComponent(error)}`);
      // Redirecionar após um breve delay para mostrar a mensagem
      setTimeout(() => {
        navigate('/settings?tab=pagamentos', { replace: true });
      }, 2000);
    } else {
      // Se não houver parâmetros, redirecionar imediatamente
      navigate('/settings?tab=pagamentos', { replace: true });
    }
  }, [searchParams, navigate]);

  const connected = searchParams.get('connected');
  const error = searchParams.get('error');

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {connected === 'true' ? (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <h2 className="text-xl font-bold">Conexão realizada com sucesso!</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Redirecionando para as configurações...
                  </p>
                </div>
              </>
            ) : error ? (
              <>
                <XCircle className="h-12 w-12 mx-auto text-destructive" />
                <div>
                  <h2 className="text-xl font-bold">Erro ao conectar</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {decodeURIComponent(error)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Redirecionando para as configurações...
                  </p>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div>
                  <h2 className="text-xl font-bold">Processando...</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Aguarde enquanto processamos sua autorização...
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

