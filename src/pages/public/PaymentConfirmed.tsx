import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function PaymentConfirmed() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLastInstallment = location.state?.isLastInstallment;
  const isInstallment = location.state?.isInstallment;
  const installmentNumber = location.state?.installmentNumber;

  useEffect(() => {
    // Auto-close após 5 segundos se estiver em popup
    const timer = setTimeout(() => {
      if (window.opener) {
        window.close();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-center text-2xl">
            Obrigado pelo retorno!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              {isLastInstallment || !isInstallment
                ? 'Sua confirmação foi registrada e o devedor será notificado de que a dívida está quitada.'
                : `Sua confirmação foi registrada e o devedor será notificado de que a parcela ${installmentNumber} foi paga.`}
            </p>
            {isLastInstallment && (
              <p className="text-sm font-semibold text-green-600 mt-4">
                🎉 Dívida totalmente quitada!
              </p>
            )}
          </div>

          <Button onClick={handleClose} className="w-full" variant="outline">
            Fechar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

