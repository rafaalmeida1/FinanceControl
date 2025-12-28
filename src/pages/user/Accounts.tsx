import { Link } from 'react-router-dom';
import { Plus, Wallet, TrendingUp, TrendingDown, Edit, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useAccounts } from '@/hooks/useAccounts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Account } from '@/types/api.types';

export default function Accounts() {
  const { accounts, isLoading, updateAccount, deleteAccount, setDefaultAccount } = useAccounts();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { register, handleSubmit, reset } = useForm();

  const totalReceivable = accounts
    ?.filter((a) => a.type === 'RECEIVABLE')
    .reduce((sum, a) => sum + Number(a.balance), 0) || 0;

  const totalPayable = accounts
    ?.filter((a) => a.type === 'PAYABLE')
    .reduce((sum, a) => sum + Math.abs(Number(a.balance)), 0) || 0;

  const handleEditClick = (account: Account) => {
    setEditingAccount(account);
    reset({
      name: account.name,
      description: account.description || '',
      color: account.color || '',
      icon: account.icon || '',
    });
  };

  const onSubmitEdit = (data: any) => {
    if (!editingAccount) return;
    updateAccount(
      {
        id: editingAccount.id,
        data: {
          name: data.name,
          description: data.description,
          color: data.color,
          icon: data.icon,
        },
      },
      {
        onSuccess: () => {
          setEditingAccount(null);
          reset();
        },
      }
    );
  };

  const handleDelete = (account: Account) => {
    if (confirm(`Deseja realmente remover a conta "${account.name}"?`)) {
      deleteAccount(account.id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas contas financeiras
          </p>
        </div>
        <Button asChild>
          <Link to="/accounts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Link>
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalReceivable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total em contas a receber
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalPayable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total em contas a pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Minhas Contas</h2>
        
        {accounts && accounts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: account.color
                            ? `${account.color}20`
                            : account.type === 'RECEIVABLE'
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                          color: account.color || (account.type === 'RECEIVABLE' ? '#10b981' : '#ef4444'),
                        }}
                      >
                        {account.icon ? (
                          <span className="text-xl">{account.icon}</span>
                        ) : (
                          <Wallet className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                          {account.isDefault && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <CardDescription className="mt-1">
                          {account.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={account.type === 'RECEIVABLE' ? 'default' : 'destructive'}>
                      {account.type === 'RECEIVABLE' ? 'Receber' : 'Pagar'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Saldo</span>
                    <span
                      className={`text-2xl font-bold ${
                        Number(account.balance) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(Math.abs(Number(account.balance)))}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!account.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultAccount(account.id)}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Padrão
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(account)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie sua primeira conta para começar a gerenciar suas finanças
              </p>
              <Button asChild>
                <Link to="/accounts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Conta
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog open={!!editingAccount} onOpenChange={(open) => !open && setEditingAccount(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
            <DialogDescription>
              Atualize as informações da conta financeira.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Conta</Label>
                <Input id="name" {...register('name', { required: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" {...register('description')} rows={3} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor (hexadecimal)</Label>
                <Input id="color" type="color" {...register('color')} className="h-12" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Ícone (emoji)</Label>
                <Input id="icon" {...register('icon')} placeholder="💰" maxLength={2} />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingAccount(null)}
              >
                Cancelar
              </Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

