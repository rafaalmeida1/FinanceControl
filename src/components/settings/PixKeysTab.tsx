import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pixKeysService, PixKey, CreatePixKeyDto } from '@/services/pixKeys.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Copy, Star, StarOff } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export function PixKeysTab() {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<CreatePixKeyDto>({
    defaultValues: {
      keyType: 'CPF',
      isDefault: false,
      isThirdParty: false,
    },
  });

  const { data: pixKeys, isLoading } = useQuery({
    queryKey: ['pix-keys'],
    queryFn: () => pixKeysService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePixKeyDto) => pixKeysService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pix-keys'] });
      toast.success('Chave PIX criada com sucesso!');
      setIsCreateDialogOpen(false);
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

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Chave PIX copiada!');
  };

  const onSubmit = (data: CreatePixKeyDto) => {
    // Se não for chave de terceiro, remover contactEmail e contactName
    const submitData: CreatePixKeyDto = {
      ...data,
      isThirdParty: data.isThirdParty || false,
    };
    
    if (!submitData.isThirdParty) {
      delete submitData.contactEmail;
      delete submitData.contactName;
    }
    
    createMutation.mutate(submitData);
  };

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chaves PIX</CardTitle>
              <CardDescription>Gerencie suas chaves PIX para recebimento</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Chave PIX
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pixKeys && pixKeys.length > 0 ? (
            <div className="space-y-4">
              {pixKeys.map((key: PixKey) => (
                <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {key.isDefault && (
                        <Badge variant="default">
                          <Star className="h-3 w-3 mr-1" />
                          Padrão
                        </Badge>
                      )}
                      {key.isThirdParty && (
                        <Badge variant="outline">Terceiro</Badge>
                      )}
                      <Badge variant={key.isActive ? 'default' : 'secondary'}>
                        {key.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <p className="font-semibold">{key.label}</p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {key.keyType}: <span className="font-mono">{key.keyValue}</span>
                    </p>
                    {key.contactName && (
                      <p className="text-sm text-muted-foreground">
                        Contato: {key.contactName}
                        {key.contactEmail && ` (${key.contactEmail})`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!key.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(key.id)}
                      >
                        <StarOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(key.keyValue)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja remover esta chave PIX?')) {
                          deleteMutation.mutate(key.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma chave PIX cadastrada</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Chave PIX
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Chave PIX</DialogTitle>
            <DialogDescription>
              Adicione uma nova chave PIX para recebimento de pagamentos
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="keyType">Tipo de Chave *</Label>
                <Select
                  value={watch('keyType')}
                  onValueChange={(value) => setValue('keyType', value as any)}
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
                <Label htmlFor="keyValue">Valor da Chave *</Label>
                <Input
                  id="keyValue"
                  {...register('keyValue', { required: true })}
                  placeholder="Ex: 11999999999"
                />
              </div>
              <div>
                <Label htmlFor="label">Rótulo (Opcional)</Label>
                <Input
                  id="label"
                  {...register('label')}
                  placeholder="Ex: PIX Principal"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDefault"
                  checked={watch('isDefault')}
                  onCheckedChange={(checked) => setValue('isDefault', checked)}
                />
                <Label htmlFor="isDefault">Definir como padrão</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isThirdParty"
                  checked={watch('isThirdParty')}
                  onCheckedChange={(checked) => setValue('isThirdParty', checked)}
                />
                <Label htmlFor="isThirdParty">Chave de terceiro</Label>
              </div>
              {watch('isThirdParty') && (
                <>
                  <div>
                    <Label htmlFor="contactEmail">Email do Contato (Opcional)</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      {...register('contactEmail')}
                      placeholder="contato@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName">Nome do Contato (Opcional)</Label>
                    <Input
                      id="contactName"
                      {...register('contactName')}
                      placeholder="João Silva"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Chave PIX'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
