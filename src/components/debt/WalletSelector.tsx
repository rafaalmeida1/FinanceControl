import { Wallet } from '@/services/wallets.service';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WalletSelectorProps {
  wallets: Wallet[];
  selectedWalletId: string | null;
  onSelect: (walletId: string) => void;
  error?: string;
}

export function WalletSelector({ wallets, selectedWalletId, onSelect, error }: WalletSelectorProps) {
  if (wallets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma carteira encontrada. Crie uma carteira primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {wallets.map((wallet) => {
          const isSelected = selectedWalletId === wallet.id;
          const bgColor = wallet.color || '#10b981';
          
          return (
            <Card
              key={wallet.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md border-2',
                isSelected ? 'border-primary shadow-md' : 'border-border hover:border-primary/50',
                error && !isSelected && 'border-destructive/50'
              )}
              onClick={() => onSelect(wallet.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: `${bgColor}20`, color: bgColor }}
                    >
                      {wallet.icon || '💳'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{wallet.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {formatCurrency(Number(wallet.balance))}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0 ml-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}

