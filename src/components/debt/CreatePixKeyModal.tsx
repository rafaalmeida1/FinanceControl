import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pixKeysService, CreatePixKeyDto } from '@/services/pixKeys.service';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallets } from '@/hooks/useWallets';

interface CreatePixKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId?: string;
  onSuccess?: (pixKeyId: string) => void;
}

export function CreatePixKeyModal({ open, onOpenChange, walletId: suggestedWalletId, onSuccess }: CreatePixKeyModalProps) {
  const queryClient = useQueryClient();
  const { wallets, isLoading: isLoadingWallets } = useWallets();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreatePixKeyDto & { walletId?: string }>({
    defaultValues: {
      keyType: 'CPF',
      isDefault: false,
      isThirdParty: false,
      walletId: suggestedWalletId,
    },
  });

  const isThirdParty = watch('isThirdParty');
  const keyType = watch('keyType');
  const selectedWalletId = watch('walletId');

  const createMutation = useMutation({
    mutationFn: (data: CreatePixKeyDto) => pixKeysService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pix-keys'] });
      queryClient.invalidateQueries({ queryKey: ['pixKeys'] });
      toast.success('Chave PIX criada com sucesso!');
      reset();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar chave PIX');
    },
  });

  const onSubmit = (data: CreatePixKeyDto & { walletId?: string }) => {
    if (!data.walletId) {
      toast.error('Selecione uma carteira');
      return;
    }

    const submitData: CreatePixKeyDto = {
      ...data,
      walletId: data.walletId,
      isThirdParty: data.isThirdParty || false,
    };
    
    if (!submitData.isThirdParty) {
      delete submitData.contactEmail;
      delete submitData.contactName;
    }
    
    createMutation.mutate(submitData);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Chave PIX</DialogTitle>
          <DialogDescription>
            Crie uma nova chave PIX e associe à carteira selecionada
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            {/* Seleção de Carteira */}
            <div>
              <Label htmlFor="walletId">Carteira <span className="text-destructive">*</span></Label>
              {isLoadingWallets ? (
                <div className="h-10 w-full rounded-md border border-input bg-muted animate-pulse mt-2" />
              ) : (
                <Select
                  value={selectedWalletId || ''}
                  onValueChange={(value) => setValue('walletId', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione uma carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets?.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        <div className="flex items-center">
                          {wallet.icon && <span className="mr-2">{wallet.icon}</span>}
                          {wallet.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.walletId && (
                <p className="text-sm text-destructive mt-1">{errors.walletId.message}</p>
              )}
              {suggestedWalletId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Carteira sugerida baseada na movimentação selecionada
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="keyType">Tipo de Chave <span className="text-destructive">*</span></Label>
              <Select
                value={keyType}
                onValueChange={(value: 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM') => setValue('keyType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="EMAIL">E-mail</SelectItem>
                  <SelectItem value="PHONE">Telefone</SelectItem>
                  <SelectItem value="RANDOM">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="keyValue">Valor da Chave <span className="text-destructive">*</span></Label>
              <Input
                id="keyValue"
                placeholder={
                  keyType === 'CPF' ? '000.000.000-00' :
                  keyType === 'EMAIL' ? 'seu@email.com' :
                  keyType === 'PHONE' ? '(00) 00000-0000' :
                  'Chave será gerada automaticamente'
                }
                disabled={keyType === 'RANDOM'}
                {...register('keyValue', {
                  required: keyType !== 'RANDOM' ? 'Valor da chave é obrigatório' : false,
                })}
              />
              {errors.keyValue && (
                <p className="text-sm text-destructive mt-1">{errors.keyValue.message}</p>
              )}
              {keyType === 'RANDOM' && (
                <p className="text-xs text-muted-foreground mt-1">
                  A chave aleatória será gerada automaticamente pelo banco
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="label">Rótulo/Nome (Opcional)</Label>
              <Input
                id="label"
                placeholder="Ex: PIX Principal"
                {...register('label')}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex-1 min-w-0 pr-4">
                <Label>Chave de Terceiro</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta chave pertence a outra pessoa?
                </p>
              </div>
              <Switch
                checked={isThirdParty}
                onCheckedChange={(checked) => setValue('isThirdParty', checked)}
              />
            </div>

            {isThirdParty && (
              <div className="space-y-4 p-4 bg-muted/30 border rounded-lg">
                <div>
                  <Label htmlFor="contactName">Nome do Contato <span className="text-destructive">*</span></Label>
                  <Input
                    id="contactName"
                    placeholder="Nome completo"
                    {...register('contactName', {
                      required: isThirdParty ? 'Nome do contato é obrigatório' : false,
                    })}
                  />
                  {errors.contactName && (
                    <p className="text-sm text-destructive mt-1">{errors.contactName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="contactEmail">E-mail do Contato <span className="text-destructive">*</span></Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contato@email.com"
                    {...register('contactEmail', {
                      required: isThirdParty ? 'E-mail do contato é obrigatório' : false,
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'E-mail inválido',
                      },
                    })}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-destructive mt-1">{errors.contactEmail.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex-1 min-w-0 pr-4">
                <Label>Chave Padrão</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Definir como chave PIX padrão?
                </p>
              </div>
              <Switch
                checked={watch('isDefault')}
                onCheckedChange={(checked) => setValue('isDefault', checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Chave PIX'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

