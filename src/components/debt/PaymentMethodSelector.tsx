import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CreditCard, QrCode, Check } from 'lucide-react';

interface PaymentMethodSelectorProps {
  selectedMethod: 'mercadopago' | 'pix' | null;
  onSelect: (method: 'mercadopago' | 'pix') => void;
  error?: string;
}

export function PaymentMethodSelector({ selectedMethod, onSelect, error }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mercado Pago */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg border-2',
            selectedMethod === 'mercadopago'
              ? 'border-primary shadow-md bg-primary/5'
              : 'border-border hover:border-primary/50',
            error && selectedMethod !== 'mercadopago' && 'border-destructive/50'
          )}
          onClick={() => onSelect('mercadopago')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              {selectedMethod === 'mercadopago' && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-2">Mercado Pago</h3>
            <p className="text-sm text-muted-foreground">
              Pagamento online seguro com cartão de crédito ou PIX. Ideal para cobranças automáticas e assinaturas.
            </p>
          </CardContent>
        </Card>

        {/* PIX Manual */}
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg border-2',
            selectedMethod === 'pix'
              ? 'border-primary shadow-md bg-primary/5'
              : 'border-border hover:border-primary/50',
            error && selectedMethod !== 'pix' && 'border-destructive/50'
          )}
          onClick={() => onSelect('pix')}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              {selectedMethod === 'pix' && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-2">PIX Manual</h3>
            <p className="text-sm text-muted-foreground">
              Envie o QR Code ou chave PIX para o devedor. Ideal para pagamentos pontuais e controle direto.
            </p>
          </CardContent>
        </Card>
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}

