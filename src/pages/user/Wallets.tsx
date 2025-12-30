import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Star, Wallet as WalletIcon, ArrowLeft, DollarSign } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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

export default function Wallets() {
  const navigate = useNavigate();
  const { wallets, isLoading, createWallet, updateWallet, deleteWallet, setDefaultWallet } = useWallets();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const {
    register: registerCreate,
    getValues: getCreateValues,
    watch: watchCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: errorsCreate },
  } = useForm<WalletFormData>({
    defaultValues: {
      name: '',
      balance: 0,
      color: '#10b981',
      icon: '💳',
      isDefault: false,
    },
  });

  const {
    register: registerEdit,
    getValues: getEditValues,
    watch: watchEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit },
  } = useForm<WalletFormData>();

  const onSubmitCreate = (data: WalletFormData) => {
    createWallet.mutate(
      {
        name: data.name,
        balance: data.balance || 0,
        color: data.color,
        icon: data.icon,
        isDefault: data.isDefault,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          resetCreate();
        },
      },
    );
  };

  const onSubmitEdit = (data: WalletFormData) => {
    if (!selectedWallet) return;

    updateWallet.mutate(
      {
        id: selectedWallet,
        data: {
          name: data.name,
          balance: data.balance || 0,
          color: data.color,
          icon: data.icon,
          isDefault: data.isDefault,
        },
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedWallet(null);
          resetEdit();
        },
      },
    );
  };

  const handleEdit = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (wallet) {
      setSelectedWallet(walletId);
      resetEdit({
        name: wallet.name,
        balance: wallet.balance || 0,
        color: wallet.color || '#10b981',
        icon: wallet.icon || '💳',
        isDefault: wallet.isDefault,
      });
      setEditDialogOpen(true);
    }
  };

  const handleDelete = (walletId: string) => {
    setSelectedWallet(walletId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedWallet) return;

    deleteWallet.mutate(selectedWallet, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedWallet(null);
      },
    });
  };

  const handleSetDefault = (walletId: string) => {
    setDefaultWallet.mutate(walletId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Carteiras</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie suas carteiras e organize suas finanças
            </p>
          </div>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Carteira
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Carteira</DialogTitle>
              <DialogDescription>
                Crie uma nova carteira para organizar suas dívidas e receitas
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitCreate(onSubmitCreate)}>
              <div className="space-y-4 py-4">
                {/* Seção Principal - Sempre Visível */}
                <div>
                  <Label htmlFor="name">Nome da Carteira *</Label>
                  <Input
                    id="name"
                    {...registerCreate('name', { required: 'Nome é obrigatório' })}
                    placeholder="Ex: Carteira Principal"
                  />
                  {errorsCreate.name && (
                    <p className="text-sm text-destructive mt-1">{errorsCreate.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="balance" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Saldo Inicial *
                  </Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-8"
                      placeholder="0.00"
                      {...registerCreate('balance', {
                        valueAsNumber: true,
                        required: 'Saldo inicial é obrigatório',
                        min: { value: 0, message: 'Saldo não pode ser negativo' },
                      })}
                    />
                  </div>
                  {errorsCreate.balance && (
                    <p className="text-sm text-destructive mt-1">{errorsCreate.balance.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Este será o saldo inicial da sua nova carteira.
                  </p>
                </div>

                {/* Acordeon de Personalização */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="personalization">
                    <AccordionTrigger>Personalizar (Opcional)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="icon">Ícone</Label>
                        <div className="grid grid-cols-6 gap-2 mt-2">
                          {WALLET_ICONS.map((icon) => (
                            <button
                              key={icon}
                              type="button"
                              onClick={() => {
                                resetCreate({ ...getCreateValues(), icon });
                              }}
                              className="p-2 text-2xl hover:bg-muted rounded-md transition-colors"
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                        <Input
                          id="icon"
                          {...registerCreate('icon')}
                          className="mt-2"
                          placeholder="💳"
                        />
                      </div>

                      <div>
                        <Label htmlFor="color">Cor</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {WALLET_COLORS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => {
                                resetCreate({ ...getCreateValues(), color: color.value });
                              }}
                              className="h-10 rounded-md border-2 transition-all"
                              style={{
                                backgroundColor: color.value,
                                borderColor: watchCreate('color') === color.value ? '#000' : 'transparent',
                              }}
                              title={color.label}
                            />
                          ))}
                        </div>
                        <Input
                          id="color"
                          type="color"
                          {...registerCreate('color')}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          {...registerCreate('isDefault')}
                          className="rounded"
                        />
                        <Label htmlFor="isDefault" className="cursor-pointer">
                          Definir como carteira padrão
                        </Label>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createWallet.isPending}>
                  {createWallet.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Carteiras */}
      {wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <WalletIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma carteira criada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira carteira para começar a organizar suas finanças
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Carteira
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className="relative hover:shadow-lg transition-shadow"
              style={{
                borderLeft: `4px solid ${wallet.color || '#10b981'}`,
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${wallet.color || '#10b981'}20` }}
                    >
                      {wallet.icon || '💳'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{wallet.name}</CardTitle>
                      {wallet.isDefault && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">Padrão</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(wallet.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!wallet.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(wallet.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo</p>
                    <p className="text-2xl font-bold">{formatCurrency(wallet.balance || 0)}</p>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{wallet._count?.debts || 0} dívida(s)</span>
                    <span>{wallet._count?.pixKeys || 0} chave(s) PIX</span>
                  </div>
                  {!wallet.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleSetDefault(wallet.id)}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Definir como Padrão
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Carteira</DialogTitle>
            <DialogDescription>Atualize as informações da carteira</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)}>
            <div className="space-y-4 py-4">
              {/* Seção Principal - Sempre Visível */}
              <div>
                <Label htmlFor="edit-name">Nome da Carteira *</Label>
                <Input
                  id="edit-name"
                  {...registerEdit('name', { required: 'Nome é obrigatório' })}
                />
                {errorsEdit.name && (
                  <p className="text-sm text-destructive mt-1">{errorsEdit.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-balance" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Saldo Inicial *
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="edit-balance"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-8"
                    placeholder="0.00"
                    {...registerEdit('balance', {
                      valueAsNumber: true,
                      required: 'Saldo inicial é obrigatório',
                      min: { value: 0, message: 'Saldo não pode ser negativo' },
                    })}
                  />
                </div>
                {errorsEdit.balance && (
                  <p className="text-sm text-destructive mt-1">{errorsEdit.balance.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Este será o saldo inicial da carteira.
                </p>
              </div>

              {/* Acordeon de Personalização */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="personalization">
                  <AccordionTrigger>Personalizar (Opcional)</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="edit-icon">Ícone</Label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {WALLET_ICONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => {
                              resetEdit({ ...getEditValues(), icon });
                            }}
                            className="p-2 text-2xl hover:bg-muted rounded-md transition-colors"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                      <Input id="edit-icon" {...registerEdit('icon')} className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="edit-color">Cor</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {WALLET_COLORS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              resetEdit({ ...getEditValues(), color: color.value });
                            }}
                            className="h-10 rounded-md border-2 transition-all"
                            style={{
                              backgroundColor: color.value,
                              borderColor: watchEdit('color') === color.value ? '#000' : 'transparent',
                            }}
                            title={color.label}
                          />
                        ))}
                      </div>
                      <Input id="edit-color" type="color" {...registerEdit('color')} className="mt-2" />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="edit-isDefault"
                        {...registerEdit('isDefault')}
                        className="rounded"
                      />
                      <Label htmlFor="edit-isDefault" className="cursor-pointer">
                        Definir como carteira padrão
                      </Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedWallet(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateWallet.isPending}>
                {updateWallet.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta carteira? Esta ação não pode ser desfeita.
              {wallets.find((w) => w.id === selectedWallet)?._count?.debts ? (
                <span className="block mt-2 text-destructive font-semibold">
                  Atenção: Esta carteira possui dívidas associadas e não pode ser deletada.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedWallet(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={
                deleteWallet.isPending ||
                !!wallets.find((w) => w.id === selectedWallet)?._count?.debts
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWallet.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Deletar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

