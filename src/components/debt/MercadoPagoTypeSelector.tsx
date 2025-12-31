import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, QrCode, Repeat, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MercadoPagoPaymentType = 'INSTALLMENT' | 'SINGLE_PIX' | 'RECURRING_CARD';

interface MercadoPagoTypeSelectorProps {
  selectedType: MercadoPagoPaymentType | null;
  onSelectType: (type: MercadoPagoPaymentType) => void;
}

interface PaymentTypeOption {
  type: MercadoPagoPaymentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  isRecurring: boolean;
}

const paymentTypes: PaymentTypeOption[] = [
  {
    type: 'INSTALLMENT',
    title: 'Parcelas',
    description: 'Dividir em parcelas com cartão ou PIX. Ideal para compras parceladas.',
    icon: <CreditCard className="h-6 w-6" />,
    color: 'bg-blue-500',
    isRecurring: false,
  },
  {
    type: 'SINGLE_PIX',
    title: 'PIX Único',
    description: 'Pagamento único via PIX. Ideal para pagamentos avulsos.',
    icon: <QrCode className="h-6 w-6" />,
    color: 'bg-green-500',
    isRecurring: false,
  },
  {
    type: 'RECURRING_CARD',
    title: 'Assinatura Cartão',
    description: 'Cobrança recorrente com cartão de crédito (ex: assinatura, plano). Será configurada como dívida recorrente automaticamente.',
    icon: <Calendar className="h-6 w-6" />,
    color: 'bg-orange-500',
    isRecurring: true,
  },
];

export function MercadoPagoTypeSelector({ selectedType, onSelectType }: MercadoPagoTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Selecione o tipo de pagamento</h3>
        <p className="text-sm text-muted-foreground">
          Escolha como deseja receber o pagamento através do Mercado Pago
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentTypes.map((option) => {
          const isSelected = selectedType === option.type;
          
          return (
            <Card
              key={option.type}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                isSelected && 'ring-2 ring-primary',
                'hover:border-primary/50'
              )}
              onClick={() => onSelectType(option.type)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={cn('p-3 rounded-lg', option.color, 'text-white')}>
                    {option.icon}
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-white" />
                    </div>
                  )}
                </div>
                <CardTitle className="mt-4">{option.title}</CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              {option.isRecurring && (
                <CardContent>
                  <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                    <Repeat className="h-3 w-3" />
                    Dívida Recorrente
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground">
            <strong>Tipo selecionado:</strong> {paymentTypes.find(t => t.type === selectedType)?.title}
            {paymentTypes.find(t => t.type === selectedType)?.isRecurring && (
              <span className="ml-2 text-primary">(Será configurado como dívida recorrente)</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

