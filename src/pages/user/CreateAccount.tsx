import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AccountType } from '@/types/api.types';

interface AccountFormData {
  name: string;
  type: AccountType;
  initialBalance?: number;
  description?: string;
  isDefault: boolean;
  color?: string;
  icon?: string;
}

export default function CreateAccount() {
  const navigate = useNavigate();
  const { createAccount } = useAccounts();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AccountFormData>({
    defaultValues: {
      type: 'PERSONAL',
      isDefault: false,
      initialBalance: 0,
    },
  });

  const accountType = watch('type');
  const isDefault = watch('isDefault');

  const onSubmit = (data: AccountFormData) => {
    createAccount(
      {
        name: data.name,
        type: data.type,
        initialBalance: data.initialBalance || 0,
        description: data.description,
        isDefault: data.isDefault,
        color: data.color,
        icon: data.icon,
      },
      {
        onSuccess: () => {
          navigate('/accounts');
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Conta</h1>
          <p className="text-muted-foreground">Crie uma nova conta financeira</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>
              Defina os detalhes da sua nova conta financeira
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Conta *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Nome é obrigatório' })}
                placeholder="Ex: Conta Salário, Conta Diversão..."
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Conta *</Label>
              <Select
                defaultValue="PERSONAL"
                onValueChange={(value) => setValue('type', value as AccountType)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSONAL">Pessoal</SelectItem>
                  <SelectItem value="RECEIVABLE">A Receber</SelectItem>
                  <SelectItem value="PAYABLE">A Pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                rows={3}
                placeholder="Descreva o propósito desta conta..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialBalance">Saldo Inicial</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  id="initialBalance"
                  type="number"
                  step="0.01"
                  className="pl-12"
                  {...register('initialBalance', { valueAsNumber: true })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isDefault">Conta Padrão</Label>
                  <p className="text-sm text-muted-foreground">
                    Esta será sua conta padrão para transações
                  </p>
                </div>
                <Switch
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={(checked) => setValue('isDefault', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor (opcional)</Label>
                <Input
                  id="color"
                  type="color"
                  {...register('color')}
                  className="h-12 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ícone (opcional)</Label>
                <Input
                  id="icon"
                  {...register('icon')}
                  placeholder="💰"
                  maxLength={2}
                />
                <p className="text-sm text-muted-foreground">
                  Use um emoji para identificar visualmente a conta
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Conta</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

