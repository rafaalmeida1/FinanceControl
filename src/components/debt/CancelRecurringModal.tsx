import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { debtsService } from '@/services/debts.service';
import toast from 'react-hot-toast';

interface CancelRecurringModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debtId: string;
  debtDescription?: string;
  isMercadoPago?: boolean;
  onSuccess?: () => void;
}

export function CancelRecurringModal({
  open,
  onOpenChange,
  debtId,
  debtDescription,
  isMercadoPago = false,
  onSuccess,
}: CancelRecurringModalProps) {
  const [reason, setReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [mercadoPagoRedirectUrl, setMercadoPagoRedirectUrl] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Por favor, informe o motivo do cancelamento');
      return;
    }

    setIsCancelling(true);
    try {
      const response = await debtsService.cancelRecurringDebt(debtId, reason);
      
      if (response.mercadoPagoRedirectUrl) {
        // Se precisar redirecionar para o Mercado Pago
        setMercadoPagoRedirectUrl(response.mercadoPagoRedirectUrl);
        toast('Redirecionando para o Mercado Pago para completar o cancelamento...', { icon: 'ℹ️' });
        // Abrir em nova aba
        window.open(response.mercadoPagoRedirectUrl, '_blank');
      } else {
        toast.success('Assinatura cancelada com sucesso!');
        onOpenChange(false);
        setReason('');
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao cancelar assinatura');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Cancelar Assinatura Recorrente
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-4 space-y-4">
            <div>
              <p className="mb-2">
                Você está prestes a cancelar a seguinte assinatura:
              </p>
              <p className="font-medium">{debtDescription || 'Assinatura recorrente'}</p>
            </div>

            <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700">
              <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>O que acontece ao cancelar:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>A assinatura será marcada como cancelada</li>
                  <li>Não haverá mais cobranças automáticas futuras</li>
                  <li>Cobranças já geradas e pendentes serão canceladas</li>
                  {isMercadoPago && (
                    <li>O cancelamento será processado no Mercado Pago</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>

            {mercadoPagoRedirectUrl && (
              <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700">
                <ExternalLink className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <p className="mb-2">
                    Para completar o cancelamento, você precisa acessar o Mercado Pago.
                  </p>
                  <a
                    href={mercadoPagoRedirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 dark:text-blue-300 underline font-medium"
                  >
                    Abrir Mercado Pago →
                  </a>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="reason">Motivo do Cancelamento *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Não preciso mais deste serviço..."
                className="mt-2"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este motivo será registrado para fins de histórico
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              onOpenChange(false);
              setReason('');
              setMercadoPagoRedirectUrl(null);
            }}
            disabled={isCancelling}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isCancelling || !reason.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCancelling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar Cancelamento'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

