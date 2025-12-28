import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDebts } from '@/hooks/useDebts';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, Mail, Edit, XCircle, TrendingDown, TrendingUp, Check, Loader2 } from 'lucide-react';
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
  description: string;
  dueDate?: string;
  interestRate?: number;
  penaltyRate?: number;
  useGateway?: boolean;
  preferredGateway?: 'MERCADOPAGO';
}

export default function Debts() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'third-party' | 'archived'>('all');
  const debtType = activeTab === 'all' ? undefined : activeTab === 'personal' ? 'personal' : activeTab === 'third-party' ? 'third-party' : undefined;
  const archived = activeTab === 'archived' ? true : false;
  const { debts, isLoading, sendLink, cancelDebt, updateDebt, markAsPaid, isSendingLink, isCancelingDebt, isUpdatingDebt, isMarkingAsPaid } = useDebts(debtType, archived);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EditDebtFormData>();

  const handleEditClick = (debt: Debt) => {
    if (debt.status === 'PAID') {
      toast.error('Não é possível editar dívida já paga');
      return;
    }
    setEditingDebt(debt);
    // Converter dueDate para formato de input (YYYY-MM-DD)
    let dueDateFormatted = '';
    if (debt.dueDate) {
      try {
        const date = new Date(debt.dueDate);
        if (!isNaN(date.getTime())) {
          // Formatar como YYYY-MM-DD
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          dueDateFormatted = `${year}-${month}-${day}`;
        }
      } catch (error) {
        console.error('Erro ao converter data do backend:', error);
      }
    }

    reset({
      debtorName: debt.debtorName || '',
      debtorEmail: debt.debtorEmail || '',
      creditorName: debt.creditorName || '',
      creditorEmail: debt.creditorEmail || '',
      totalAmount: debt.totalAmount ? Number(debt.totalAmount) : undefined,
      description: debt.description || '',
      dueDate: dueDateFormatted,
      interestRate: debt.interestRate ? Number(debt.interestRate) : undefined,
      penaltyRate: debt.penaltyRate ? Number(debt.penaltyRate) : undefined,
      useGateway: debt.useGateway || false,
      preferredGateway: debt.preferredGateway || 'MERCADOPAGO',
    });
  };

  const onSubmitEdit = (data: EditDebtFormData) => {
    if (!editingDebt) return;

    // Converter data para ISO 8601 corretamente
    let dueDateISO: string | undefined = undefined;
    if (data.dueDate && typeof data.dueDate === 'string' && data.dueDate.trim() !== '') {
      try {
        // Garantir que seja uma string de data válida
        const dateString = String(data.dueDate).trim();
        // Validar formato básico (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          toast.error('Formato de data inválido. Use YYYY-MM-DD');
          return;
        }
        // Criar data no formato correto para ISO
        const [year, month, day] = dateString.split('-');
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        
        // Validar se os valores são válidos
        if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum)) {
          toast.error('Data inválida');
          return;
        }
        
        // Validar se a data é válida
        if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
          toast.error('Data inválida');
          return;
        }
        
        const date = new Date(Date.UTC(yearNum, monthNum - 1, dayNum, 23, 59, 59));
        
        // Verificar se a data criada é válida
        if (isNaN(date.getTime())) {
          toast.error('Data inválida');
          return;
        }
        
        // Garantir formato ISO 8601 completo
        dueDateISO = date.toISOString();
      } catch (error) {
        console.error('Erro ao converter data:', error);
        toast.error('Data inválida');
        return;
      }
    }

    // Preparar objeto de dados, removendo campos vazios
    const updateData: any = {};
    
    if (data.debtorName && data.debtorName.trim() !== '') {
      updateData.debtorName = data.debtorName.trim();
    }
    if (data.debtorEmail && data.debtorEmail.trim() !== '') {
      updateData.debtorEmail = data.debtorEmail.trim();
    }
    if (data.creditorName && data.creditorName.trim() !== '') {
      updateData.creditorName = data.creditorName.trim();
    }
    if (data.creditorEmail && data.creditorEmail.trim() !== '') {
      updateData.creditorEmail = data.creditorEmail.trim();
    }
    if (data.totalAmount !== undefined && data.totalAmount !== null) {
      updateData.totalAmount = data.totalAmount;
    }
    // Descrição é obrigatória
    if (!data.description || data.description.trim() === '') {
      toast.error('A descrição é obrigatória');
      return;
    }
    if (data.description.trim().length > 2000) {
      toast.error('A descrição deve ter no máximo 2000 caracteres');
      return;
    }
    updateData.description = data.description.trim();
    
    // Só enviar dueDate se for uma string ISO 8601 válida
    // Se o campo foi limpo (string vazia), não enviar o campo (manter valor atual)
    if (dueDateISO) {
      updateData.dueDate = dueDateISO;
    }
    // Se data.dueDate estiver vazio, undefined ou null, não incluir no updateData
    // Isso mantém o valor atual da data no backend
    if (data.interestRate !== undefined && data.interestRate !== null) {
      updateData.interestRate = data.interestRate;
    }
    if (data.penaltyRate !== undefined && data.penaltyRate !== null) {
      updateData.penaltyRate = data.penaltyRate;
    }
    if (data.useGateway !== undefined) {
      updateData.useGateway = data.useGateway;
    }
    if (data.preferredGateway) {
      updateData.preferredGateway = data.preferredGateway;
    }

    updateDebt(
      {
        id: editingDebt.id,
        data: updateData,
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
          <div key={debt.id} className="card cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/debts/${debt.id}`)}>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
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

            <div className="flex gap-2 flex-wrap">
              {debt.status !== 'PAID' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Deseja marcar esta dívida como paga? Todas as parcelas pendentes serão marcadas como pagas.')) {
                      markAsPaid({ id: debt.id });
                    }
                  }}
                  className="btn-primary flex items-center gap-1.5 text-sm px-3 py-2"
                  disabled={isMarkingAsPaid}
                >
                  {isMarkingAsPaid ? (
                    <>
                      <Loader2 size={14} className="md:w-4 md:h-4 animate-spin" />
                      <span className="hidden sm:inline">Processando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} className="md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Quitar Dívida</span>
                      <span className="sm:hidden">Quitar</span>
                    </>
                  )}
                </button>
              )}
              {!debt.isPersonalDebt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sendLink(debt.id);
                  }}
                  className="btn-secondary flex items-center gap-1.5 text-sm px-3 py-2"
                  disabled={isSendingLink}
                >
                  {isSendingLink ? (
                    <>
                      <Loader2 size={14} className="md:w-4 md:h-4 animate-spin" />
                      <span className="hidden sm:inline">Enviando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Mail size={14} className="md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Enviar Link</span>
                      <span className="sm:hidden">Link</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick(debt);
                }}
                className="btn-secondary flex items-center gap-1.5 text-sm px-3 py-2"
                disabled={debt.status === 'PAID' || isUpdatingDebt}
              >
                <Edit size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Deseja realmente cancelar esta dívida?')) {
                    cancelDebt(debt.id);
                  }
                }}
                className="btn-danger flex items-center gap-1.5 text-sm px-3 py-2"
                disabled={debt.status === 'PAID' || isCancelingDebt}
              >
                {isCancelingDebt ? (
                  <>
                    <Loader2 size={14} className="md:w-4 md:h-4 animate-spin" />
                    <span className="hidden sm:inline">Cancelando...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">Cancelar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Dívidas</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Gerencie suas dívidas e cobranças</p>
        </div>
        <Link 
          to="/debts/new" 
          className="btn-primary flex items-center gap-2 flex-shrink-0 text-sm md:text-base px-3 md:px-4"
        >
          <Plus size={18} className="md:w-5 md:h-5" />
          <span className="hidden sm:inline">Nova Dívida</span>
          <span className="sm:hidden">Nova</span>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'personal' | 'third-party' | 'archived')}>
        {/* Mobile: Horizontal Scrollable Tabs */}
        <div className="md:hidden overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="all" className="whitespace-nowrap flex-shrink-0">Todas</TabsTrigger>
            <TabsTrigger value="personal" className="whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
              <TrendingDown className="h-3.5 w-3.5" />
              Eu devo
            </TabsTrigger>
            <TabsTrigger value="third-party" className="whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
              <TrendingUp className="h-3.5 w-3.5" />
              Me devem
            </TabsTrigger>
            <TabsTrigger value="archived" className="whitespace-nowrap flex-shrink-0">Arquivadas</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Desktop: Grid Tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Eu devo
            </TabsTrigger>
            <TabsTrigger value="third-party" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Alguém me deve
            </TabsTrigger>
            <TabsTrigger value="archived">Arquivadas</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Carregando...</div>
          ) : (
            renderDebtList(debts)
          )}
        </TabsContent>

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

        <TabsContent value="archived" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Carregando...</div>
          ) : (
            renderDebtList(debts)
          )}
        </TabsContent>
      </Tabs>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  {...register('description', {
                    required: 'A descrição é obrigatória',
                    maxLength: {
                      value: 255,
                      message: 'A descrição deve ter no máximo 255 caracteres'
                    },
                    minLength: {
                      value: 3,
                      message: 'A descrição deve ter pelo menos 3 caracteres'
                    }
                  })}
                  placeholder="Descrição da dívida"
                  rows={3}
                  maxLength={255}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  A descrição será enviada no email de notificação
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Vencimento</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate')}
                  className="w-full max-w-full text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Button type="submit" disabled={isUpdatingDebt}>
                {isUpdatingDebt ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

