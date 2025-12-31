import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Repeat, Calendar, Receipt, Check } from 'lucide-react';

export type DebtType = 'recurring' | 'installment' | 'single';

interface DebtTypeSelectorProps {
  selectedType: DebtType | null;
  onSelect: (type: DebtType) => void;
  error?: string;
  paymentMethod: 'mercadopago' | 'pix' | null;
}

export function DebtTypeSelector({ selectedType, onSelect, error, paymentMethod }: DebtTypeSelectorProps) {
  const types: Array<{
    id: DebtType;
    title: string;
    description: string;
    icon: React.ReactNode;
    examples: string[];
  }> = [
    {
      id: 'recurring',
      title: 'Recorrente',
      description: 'Cobrança que se repete automaticamente (ex: mensalidade de academia)',
      icon: <Repeat className="w-6 h-6" />,
      examples: ['Mensalidade de academia', 'Assinatura de streaming', 'Aluguel'],
    },
    {
      id: 'installment',
      title: 'Parcelada',
      description: 'Dividida em várias parcelas (ex: compra parcelada)',
      icon: <Calendar className="w-6 h-6" />,
      examples: ['Compra parcelada', 'Empréstimo', 'Financiamento'],
    },
    {
      id: 'single',
      title: 'Única',
      description: 'Pagamento único, sem parcelas (ex: conta de luz)',
      icon: <Receipt className="w-6 h-6" />,
      examples: ['Conta de luz', 'Conta de água', 'Compra à vista'],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map((type) => {
          const isSelected = selectedType === type.id;
          const isDisabled = paymentMethod === 'mercadopago' && type.id === 'single';
          
          return (
            <Card
              key={type.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md border-2',
                isSelected
                  ? 'border-primary shadow-md bg-primary/5'
                  : 'border-border hover:border-primary/50',
                isDisabled && 'opacity-50 cursor-not-allowed',
                error && !isSelected && 'border-destructive/50'
              )}
              onClick={() => !isDisabled && onSelect(type.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {type.icon}
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-base mb-2">{type.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                <div className="space-y-1">
                  {type.examples.map((example, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">
                      • {example}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      {paymentMethod === 'mercadopago' && (
        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
          <strong>Nota:</strong> Para Mercado Pago, pagamentos únicos são processados como "PIX único" ou "Cartão único".
        </div>
      )}
    </div>
  );
}

