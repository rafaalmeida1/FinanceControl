import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDebts } from '@/hooks/useDebts';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, Mail, Edit, XCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';
import { Debt } from '@/types/api.types';

interface EditDebtFormData {
  debtorName?: string;
  debtorEmail?: string;
  creditorName?: string;
  creditorEmail?: string;
  totalAmount?: number;
  description?: string;
  dueDate?: string;
  interestRate?: number;
  penaltyRate?: number;
  useGateway?: boolean;
  preferredGateway?: 'MERCADOPAGO';
}

export default function Debts() {
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'third-party'>('all');
  const debtType = activeTab === 'all' ? undefined : activeTab === 'personal' ? 'personal' : 'third-party';
  const { debts, isLoading, sendLink, cancelDebt, updateDebt } = useDebts(debtType);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EditDebtFormData>();

  const handleEditClick = (debt: Debt) => {
    if (debt.status === 'PAID') {
      toast.error('Não é possível editar dívida já paga');
      return;
    }
    setEditingDebt(debt);
    reset({
      debtorName: debt.debtorName || '',
      debtorEmail: debt.debtorEmail || '',
      creditorName: debt.creditorName || '',
      creditorEmail: debt.creditorEmail || '',
      totalAmount: debt.totalAmount ? Number(debt.totalAmount) : undefined,
      description: debt.description || '',
      dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : '',
      interestRate: debt.interestRate ? Number(debt.interestRate) : undefined,
      penaltyRate: debt.penaltyRate ? Number(debt.penaltyRate) : undefined,
      useGateway: debt.useGateway || false,
      preferredGateway: debt.preferredGateway || 'MERCADOPAGO',
    });
  };

  const onSubmitEdit = (data: EditDebtFormData) => {
    if (!editingDebt) return;

    let dueDate: string | undefined = undefined;
    if (data.dueDate) {
      try {
        const [year, month, day] = data.dueDate.split('-');
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59));
        dueDate = date.toISOString();
      } catch (error) {
        toast.error('Data inválida');
        return;
      }
    }

    updateDebt(
      {
        id: editingDebt.id,
        data: {
          debtorName: data.debtorName || undefined,
          debtorEmail: data.debtorEmail || undefined,
          creditorName: data.creditorName || undefined,
          creditorEmail: data.creditorEmail || undefined,
          totalAmount: data.totalAmount,
          description: data.description || undefined,
          dueDate,
          interestRate: data.interestRate,
          penaltyRate: data.penaltyRate,
          useGateway: data.useGateway,
          preferredGateway: data.preferredGateway,
        },
      },
      {
        onSuccess: () => {
          setEditingDebt(null);
          reset();
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Erro ao atualizar dívida');
        },
      }
    );
  };

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  const renderDebtList = (debtsList: Debt[] | undefined) => {
    if (!debtsList || debtsList.length === 0) {
      return (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {activeTab === 'personal' 
              ? 'Nenhuma dívida pessoal cadastrada' 
              : activeTab === 'third-party'
              ? 'Nenhuma dívida de terceiro cadastrada'
              : 'Nenhuma dívida cadastrada'}
          </p>
          <Link to="/debts/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Criar primeira dívida
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {debtsList.map((debt) => (
          <div key={debt.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">{debt.debtorName || debt.debtorEmail}</h3>
                  {debt.isPersonalDebt !== undefined && (
                    <Badge variant={debt.isPersonalDebt ? 'destructive' : 'default'}>
                      {debt.isPersonalDebt ? 'Eu devo' : 'Alguém me deve'}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {debt.isPersonalDebt 
                    ? `Credor: ${debt.creditorName || debt.creditorEmail || 'Não informado'}` 
                    : `Devedor: ${debt.debtorEmail}`}
                </p>
                {debt.description && (
                  <p className="text-sm text-gray-500 mt-1">{debt.description}</p>
                )}
              </div>
              <span className={`badge ${getStatusColor(debt.status)}`}>
                {getStatusLabel(debt.status)}
              </span>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                <p className="text-lg font-bold">{formatCurrency(debt.totalAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pago</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(debt.paidAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Parcelas</p>
                <p className="text-lg font-bold">{debt.installments}x</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vencimento</p>
                <p className="text-lg font-bold">
                  {debt.dueDate ? formatDateShort(debt.dueDate) : '-'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!debt.isPersonalDebt && (
                <button
                  onClick={() => sendLink(debt.id)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Mail size={16} />
                  Enviar Link
                </button>
              )}
              <button
                onClick={() => handleEditClick(debt)}
                className="btn-secondary flex items-center gap-2"
                disabled={debt.status === 'PAID'}
              >
                <Edit size={16} />
                Editar
              </button>
              <button
                onClick={() => {
                  if (confirm('Deseja realmente cancelar esta dívida?')) {
                    cancelDebt(debt.id);
                  }
                }}
                className="btn-danger flex items-center gap-2"
              >
                <XCircle size={16} />
                Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dívidas</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie suas dívidas e cobranças</p>
        </div>
        <Link to="/debts/new" className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          Nova Dívida
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'personal' | 'third-party')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Eu devo
          </TabsTrigger>
          <TabsTrigger value="third-party" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Alguém me deve
          </TabsTrigger>
        </TabsList>

        {/* <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Carregando...</div>
          ) : (
            renderDebtList(debts)
          )}
        </TabsContent> */}

        <TabsContent value="personal" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Carregando...</div>
          ) : (
            renderDebtList(debts)
          )}
        </TabsContent>

        <TabsContent value="third-party" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Carregando...</div>
          ) : (
            renderDebtList(debts)
          )}
        </TabsContent>
      </Tabs>

      {debts?.length === 0 && activeTab === 'all' && !isLoading && (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Nenhuma dívida cadastrada</p>
          <Link to="/debts/new" className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            Criar primeira dívida
          </Link>
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editingDebt} onOpenChange={(open) => !open && setEditingDebt(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Dívida</DialogTitle>
            <DialogDescription>
              Atualize todas as informações da dívida conforme necessário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)}>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="debtorName">Nome do Devedor</Label>
                  <Input
                    id="debtorName"
                    {...register('debtorName')}
                    placeholder="Nome do devedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="debtorEmail">Email do Devedor</Label>
                  <Input
                    id="debtorEmail"
                    type="email"
                    {...register('debtorEmail')}
                    placeholder="devedor@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditorName">Nome do Credor</Label>
                  <Input
                    id="creditorName"
                    {...register('creditorName')}
                    placeholder="Nome do credor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditorEmail">Email do Credor</Label>
                  <Input
                    id="creditorEmail"
                    type="email"
                    {...register('creditorEmail')}
                    placeholder="credor@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalAmount">Valor Total (R$)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  {...register('totalAmount', {
                    valueAsNumber: true,
                  })}
                  placeholder="1000.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Descrição da dívida"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Juros ao mês (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    {...register('interestRate', {
                      valueAsNumber: true,
                    })}
                    placeholder="2.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penaltyRate">Multa por atraso (%)</Label>
                  <Input
                    id="penaltyRate"
                    type="number"
                    step="0.1"
                    {...register('penaltyRate', {
                      valueAsNumber: true,
                    })}
                    placeholder="5.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="useGateway"
                    checked={watch('useGateway') || false}
                    onCheckedChange={(checked) => setValue('useGateway', checked)}
                  />
                  <Label htmlFor="useGateway" className="cursor-pointer">
                    Usar Gateway de Pagamento
                  </Label>
                </div>
              </div>

              {watch('useGateway') && (
                <div className="space-y-2">
                  <Label htmlFor="preferredGateway">Gateway Preferido</Label>
                  <Select
                    value={watch('preferredGateway') || 'MERCADOPAGO'}
                    onValueChange={(value) => setValue('preferredGateway', value as 'MERCADOPAGO')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MERCADOPAGO">Mercado Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingDebt(null)}
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

