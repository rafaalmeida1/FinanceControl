import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { pixKeysService, PixKey, CreatePixKeyDto } from '@/services/pixKeys.service';
import { accountsService } from '@/services/accounts.service';

const pixKeySchema = z.object({
  keyType: z.enum(['CPF', 'EMAIL', 'PHONE', 'RANDOM']),
  keyValue: z.string().min(1, 'Valor da chave é obrigatório'),
  label: z.string().optional(),
  accountId: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type PixKeyFormData = z.infer<typeof pixKeySchema>;

export function PixKeysTab() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: pixKeys, isLoading } = useQuery({
    queryKey: ['pix-keys'],
    queryFn: () => pixKeysService.getAll(),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsService.getAll(),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PixKeyFormData>({
    resolver: zodResolver(pixKeySchema),
    defaultValues: {
      keyType: 'EMAIL',
      isDefault: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePixKeyDto) => pixKeysService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix-keys'] });
      toast.success('Chave PIX criada com sucesso!');
      setIsDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao criar chave PIX');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pixKeysService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix-keys'] });
      toast.success('Chave PIX removida!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao remover chave PIX');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => pixKeysService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix-keys'] });
      toast.success('Chave PIX definida como padrão!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao definir chave padrão');
    },
  });

  const onSubmit = (data: PixKeyFormData) => {
    createMutation.mutate({
      keyType: data.keyType,
      keyValue: data.keyValue,
      label: data.label,
      accountId: data.accountId,
      isDefault: data.isDefault,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente remover esta chave PIX?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Chaves PIX</CardTitle>
            <CardDescription>Gerencie suas chaves PIX para recebimento</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Chave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Chave PIX</DialogTitle>
                <DialogDescription>
                  Adicione uma nova chave PIX para recebimento de pagamentos
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyType">Tipo de Chave *</Label>
                  <Select
                    defaultValue="EMAIL"
                    onValueChange={(value) => setValue('keyType', value as any)}
                  >
                    <SelectTrigger id="keyType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="PHONE">Telefone</SelectItem>
                      <SelectItem value="RANDOM">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyValue">Valor da Chave *</Label>
                  <Input
                    id="keyValue"
                    {...register('keyValue')}
                    placeholder="usuario@email.com"
                  />
                  {errors.keyValue && (
                    <p className="text-sm text-destructive">{errors.keyValue.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">Apelido (opcional)</Label>
                  <Input
                    id="label"
                    {...register('label')}
                    placeholder="PIX Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountId">Conta Associada (opcional)</Label>
                  <Select onValueChange={(value) => setValue('accountId', value)}>
                    <SelectTrigger id="accountId">
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    {...register('isDefault')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isDefault">Definir como padrão</Label>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Chave'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : pixKeys && pixKeys.length > 0 ? (
          <div className="space-y-3">
            {pixKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{key.label || key.keyValue}</span>
                    {key.isDefault && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {key.keyType}: {key.keyValue}
                  </p>
                  {key.account && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Conta: {key.account.name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!key.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(key.id)}
                      title="Definir como padrão"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(key.id)}
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma chave PIX cadastrada</p>
            <p className="text-sm mt-1">Adicione sua primeira chave PIX para começar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

