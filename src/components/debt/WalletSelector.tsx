import { useState } from 'react';
import { Wallet } from '@/services/wallets.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { Check, Plus, Wallet as WalletIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useWallets } from '@/hooks/useWallets';
import toast from 'react-hot-toast';

interface WalletSelectorProps {
  wallets: Wallet[];
  selectedWalletId: string | null;
  onSelect: (walletId: string) => void;
  error?: string;
}

interface WalletFormData {
  name: string;
  balance: number;
  color: string;
  icon: string;
  isDefault: boolean;
}

const WALLET_COLORS = [
  { value: '#10b981', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#f59e0b', label: 'Laranja' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#84cc16', label: 'Lima' },
];

const WALLET_ICONS = ['💳', '💰', '🏦', '💵', '💸', '💴', '💶', '💷', '💎', '🎯', '📊', '💼'];

export function WalletSelector({ wallets, selectedWalletId, onSelect, error }: WalletSelectorProps) {
  const { createWallet } = useWallets();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<WalletFormData>({
    defaultValues: {
      name: '',
      balance: 0,
      color: '#10b981',
      icon: '💳',
      isDefault: false,
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const onSubmit = (data: WalletFormData) => {
    createWallet.mutate(
      {
        name: data.name,
        balance: data.balance || 0,
        color: data.color,
        icon: data.icon,
        isDefault: data.isDefault,
      },
      {
        onSuccess: (newWallet) => {
          toast.success('Carteira criada com sucesso!');
          reset();
          setCreateDialogOpen(false);
          // Selecionar a carteira recém-criada
          onSelect(newWallet.id);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Erro ao criar carteira');
        },
      }
    );
  };

  if (wallets.length === 0) {
    return (
      <>
        <div className="text-center py-8 space-y-4">
          <WalletIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="text-muted-foreground mb-2">Nenhuma carteira encontrada.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie uma carteira para começar a gerenciar suas movimentações.
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeira Carteira
          </Button>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Carteira</DialogTitle>
              <DialogDescription>
                Crie uma carteira para organizar suas movimentações financeiras.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Carteira *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  placeholder="Ex: Conta Corrente, Poupança..."
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="balance">Saldo Inicial</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  {...register('balance', { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Cor</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {WALLET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        const { onChange } = register('color');
                        onChange({ target: { value: color.value } });
                      }}
                      className={cn(
                        'w-full h-10 rounded-md border-2 transition-all',
                        selectedColor === color.value
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-border hover:border-primary/50'
                      )}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
                <input type="hidden" {...register('color')} />
              </div>

              <div>
                <Label>Ícone</Label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {WALLET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => {
                        const { onChange } = register('icon');
                        onChange({ target: { value: icon } });
                      }}
                      className={cn(
                        'w-full h-10 rounded-md border-2 text-2xl transition-all',
                        selectedIcon === icon
                          ? 'border-primary ring-2 ring-primary ring-offset-2'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register('icon')} />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createWallet.isPending}>
                  {createWallet.isPending ? 'Criando...' : 'Criar Carteira'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
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

