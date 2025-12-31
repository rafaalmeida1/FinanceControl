import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useDebts } from '@/hooks/useDebts';
import { debtsService } from '@/services/debts.service';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Plus, Mail, Edit, XCircle, TrendingDown, TrendingUp, Check, Loader2, Trash2, Search, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
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
import { HelpDialog, HelpStep } from '@/components/help/HelpDialog';
import { HelpIconButton } from '@/components/help/HelpIconButton';
import { CancelRecurringModal } from '@/components/debt/CancelRecurringModal';
import { useSocket } from '@/hooks/useSocket';
import { useCreateMovement } from '@/contexts/CreateMovementContext';

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
  // Inicializar WebSocket para atualizações em tempo real
  useSocket();
  const { setOpen } = useCreateMovement();
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'third-party' | 'archived' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<number | undefined>(undefined);
  const [filterYear, setFilterYear] = useState<number | undefined>(undefined);
  
  const debtType = activeTab === 'all' ? undefined : activeTab === 'personal' ? 'personal' : activeTab === 'third-party' ? 'third-party' : undefined;
  const archived = activeTab === 'archived' ? true : false;
  const status = activeTab === 'paid' ? 'PAID' : undefined;
  const { debts, isLoading, sendLink, cancelDebt, deleteDebt, updateDebt, markAsPaid, isSendingLink, isCancelingDebt, isDeletingDebt, isUpdatingDebt, isMarkingAsPaid } = useDebts(debtType, archived, status);
  const [deletingDebtId, setDeletingDebtId] = useState<string | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [cancelRecurringDebt, setCancelRecurringDebt] = useState<Debt | null>(null);
  const [showCompiled, setShowCompiled] = useState(false);
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<EditDebtFormData>();
  const { data: compiledDebts, isLoading: isLoadingCompiled } = useQuery({
    queryKey: ['compiled-debts'],
    queryFn: () => debtsService.getCompiledByPix(),
    enabled: showCompiled,
  });

  // Função helper para determinar a perspectiva da dívida do ponto de vista do usuário atual
  const getDebtPerspective = (debt: Debt): boolean => {
    // Se userRole está definido, usar para determinar perspectiva
    if (debt.userRole === 'debtor') {
      return true; // "Eu devo"
    }
    if (debt.userRole === 'creditor') {
      return false; // "Alguém me deve"
    }
    // Se é owner ou userRole não está definido, usar isPersonalDebt original
    return debt.isPersonalDebt ?? false;
  };

  // Passos do walkthrough de ajuda
  const helpSteps: HelpStep[] = [
    {
      title: 'Lista de Movimentações',
      content: 'Aqui você vê todas as suas movimentações organizadas por abas:\n\n• Todas: todas as movimentações\n• Pessoais: movimentações que você deve\n• Terceiros: movimentações que outros devem para você\n• Pagas: movimentações já pagas\n• Arquivadas: movimentações finalizadas',
    },
    {
      title: 'Filtros e Busca',
      content: 'Use os filtros para encontrar movimentações específicas:\n\n• Busca: digite para buscar por descrição, nome ou email\n• Mês/Ano: filtre por período de vencimento\n• Limpar: remove todos os filtros aplicados',
    },
    {
      title: 'Ações Disponíveis',
      content: 'Para cada movimentação você pode:\n\n• Editar: modificar informações da movimentação\n• Enviar Link: reenviar o link de acesso para o devedor\n• Quitar: marcar a movimentação como paga\n• Cancelar: cancelar a movimentação\n• Deletar: remover movimentações pagas ou canceladas\n\nClique em uma movimentação para ver mais detalhes.',
    },
  ];

  const handleEditClick = (debt: Debt) => {
    if (debt.status === 'PAID') {
      toast.error('Não é possível editar movimentação já paga');
      return;
    }
    // Verificar permissões: apenas criador pode editar (backend também valida)
    if (!debt.isOwner && debt.userRole !== 'owner') {
      toast.error('Apenas o criador da movimentação pode editá-la');
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
        
        // Garantir formato ISO 8601 completo (sem milissegundos para compatibilidade com IsDateString)
        // Formato: YYYY-MM-DDTHH:mm:ssZ (sem .000)
        const isoString = date.toISOString();
        // Remover milissegundos para garantir compatibilidade
        dueDateISO = isoString.replace(/\.\d{3}Z$/, 'Z');
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
    if (dueDateISO && typeof dueDateISO === 'string' && dueDateISO.trim() !== '') {
      // Garantir que é uma string válida ISO 8601
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

  // Filtrar dívidas localmente por busca, mês e ano
  const filteredDebts = debts?.filter((debt) => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        debt.description?.toLowerCase().includes(searchLower) ||
        debt.debtorName?.toLowerCase().includes(searchLower) ||
        debt.debtorEmail?.toLowerCase().includes(searchLower) ||
        debt.creditorName?.toLowerCase().includes(searchLower) ||
        debt.creditorEmail?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Filtro de mês/ano
    if (filterMonth || filterYear) {
      if (debt.dueDate) {
        const dueDate = new Date(debt.dueDate);
        const month = dueDate.getMonth() + 1;
        const year = dueDate.getFullYear();
        if (filterMonth && month !== filterMonth) return false;
        if (filterYear && year !== filterYear) return false;
      } else {
        // Se não tem data de vencimento, usar data de criação
        const createdDate = new Date(debt.createdAt);
        const month = createdDate.getMonth() + 1;
        const year = createdDate.getFullYear();
        if (filterMonth && month !== filterMonth) return false;
        if (filterYear && year !== filterYear) return false;
      }
    }

    return true;
  });

  const renderDebtList = (debtsList: Debt[] | undefined) => {
    if (!debtsList || debtsList.length === 0) {
      return (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {activeTab === 'personal' 
              ? 'Nenhuma movimentação pessoal cadastrada' 
              : activeTab === 'third-party'
              ? 'Nenhuma movimentação de terceiro cadastrada'
              : activeTab === 'paid'
              ? 'Nenhuma movimentação paga encontrada'
              : activeTab === 'archived'
              ? 'Nenhuma movimentação arquivada encontrada'
              : 'Nenhuma movimentação cadastrada'}
          </p>
          {activeTab !== 'paid' && activeTab !== 'archived' && (
            <Button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Criar primeira movimentação
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {debtsList.map((debt) => (
          <div key={debt.id} className="card cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/debts/${debt.id}`)}>
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold truncate">
                    {getDebtPerspective(debt) 
                      ? (debt.creditorName || debt.creditorEmail || 'Credor não informado')
                      : (debt.debtorName || debt.debtorEmail)}
                  </h3>
                  <Badge variant={getDebtPerspective(debt) ? 'destructive' : 'default'} className="flex-shrink-0">
                    {getDebtPerspective(debt) ? 'Eu devo' : 'Alguém me deve'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                  {getDebtPerspective(debt)
                    ? `Credor: ${debt.creditorName || debt.creditorEmail || 'Não informado'}` 
                    : `Devedor: ${debt.debtorName || debt.debtorEmail}`}
                </p>
                {debt.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{debt.description}</p>
                )}
              </div>
              <span className={`badge ${getStatusColor(debt.status)} flex-shrink-0`}>
                {getStatusLabel(debt.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-300">Valor Total</p>
                <p className="text-lg font-bold dark:text-white truncate">{formatCurrency(debt.totalAmount)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-300">Pago</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 truncate">
                  {formatCurrency(debt.paidAmount)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-300">Parcelas</p>
                <p className="text-lg font-bold dark:text-white truncate">{debt.installments}x</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-300">Vencimento</p>
                <p className="text-lg font-bold dark:text-white truncate">
                  {debt.dueDate ? formatDateShort(debt.dueDate) : '-'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Link para ver cobranças */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/debts/${debt.id}`);
                }}
                className="btn-secondary flex items-center gap-1.5 text-sm px-3 py-2"
              >
                <CreditCard size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">Ver Cobranças</span>
                <span className="sm:hidden">Cobranças</span>
              </button>
              {debt.status !== 'PAID' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Deseja marcar esta movimentação como paga? Todas as parcelas pendentes serão marcadas como pagas.')) {
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
                      <span className="hidden sm:inline">Quitar Movimentação</span>
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
              {/* Apenas o criador pode editar e cancelar */}
              {(debt.isOwner || debt.userRole === 'owner') && (
                <>
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
                  {debt.isRecurring && debt.recurringStatus === 'ACTIVE' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCancelRecurringDebt(debt);
                      }}
                      className="btn-danger flex items-center gap-1.5 text-sm px-3 py-2"
                      disabled={isCancelingDebt}
                    >
                      <XCircle size={14} className="md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Cancelar Assinatura</span>
                      <span className="sm:hidden">Cancelar</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Deseja realmente cancelar esta movimentação?')) {
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
                      {/* Botão Deletar - apenas para movimentações PAID ou CANCELLED */}
                      {(debt.status === 'PAID' || debt.status === 'CANCELLED') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingDebtId(debt.id);
                          }}
                          className="btn-danger flex items-center gap-1.5 text-sm px-3 py-2 bg-red-600 hover:bg-red-700"
                          disabled={isDeletingDebt || deletingDebtId === debt.id}
                        >
                          {isDeletingDebt && deletingDebtId === debt.id ? (
                            <>
                              <Loader2 size={14} className="md:w-4 md:h-4 animate-spin" />
                              <span className="hidden sm:inline">Deletando...</span>
                              <span className="sm:hidden">...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 size={14} className="md:w-4 md:h-4" />
                              <span className="hidden sm:inline">Deletar</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sistema de Ajuda */}
      <HelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="Como gerenciar movimentações"
        description="Aprenda a usar a lista de movimentações"
        steps={helpSteps}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Movimentações</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Gerencie suas movimentações e cobranças</p>
        </div>
        <div className="flex items-center gap-2">
          <HelpIconButton onClick={() => setHelpOpen(true)} size="sm" />
          <Button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 flex-shrink-0 text-sm md:text-base px-3 md:px-4"
          >
            <Plus size={18} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">Nova Movimentação</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Filtros e Toggle para Visualização Compilada */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filtros de Busca e Data */}
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar movimentações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Select
              value={filterMonth?.toString() || ''}
              onValueChange={(value) => setFilterMonth(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os meses</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {new Date(2000, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filterYear?.toString() || ''}
              onValueChange={(value) => setFilterYear(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os anos</SelectItem>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterMonth || filterYear || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterMonth(undefined);
                  setFilterYear(undefined);
                  setSearchTerm('');
                }}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="compiled-view"
            checked={showCompiled}
            onCheckedChange={setShowCompiled}
          />
          <Label htmlFor="compiled-view" className="cursor-pointer">
            Ver Dívidas Compiladas
          </Label>
        </div>
      </div>

      {showCompiled ? (
        /* Visualização Compilada */
        <div className="space-y-4">
          {isLoadingCompiled ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : compiledDebts && compiledDebts.length > 0 ? (
            compiledDebts.map((group: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg truncate">
                    {group.debtorName || group.debtorEmail}
                  </CardTitle>
                  <CardDescription>
                    {group.debts.length} dívida(s) • Total: {formatCurrency(
                      group.debts.reduce((sum: number, d: any) => {
                        const chargesTotal = d.charges?.reduce(
                          (s: number, c: any) => s + Number(c.amount),
                          0,
                        ) || 0;
                        return sum + (chargesTotal || Number(d.totalAmount) || 0);
                      }, 0),
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {group.debts.map((debt: any) => {
                      const chargesTotal = debt.charges?.reduce(
                        (sum: number, c: any) => sum + Number(c.amount),
                        0,
                      ) || 0;
                      return (
                        <div
                          key={debt.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{debt.description || 'Sem descrição'}</p>
                            <p className="text-sm text-muted-foreground">
                              {debt.dueDate ? formatDateShort(debt.dueDate) : 'Sem vencimento'}
                              {debt.charges && debt.charges.length > 0 && (
                                <span className="ml-2">
                                  • {debt.charges.length} parcela(s) pendente(s)
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0 min-w-0">
                            <p className="font-bold truncate">{formatCurrency(chargesTotal || debt.totalAmount)}</p>
                            {chargesTotal !== debt.totalAmount && (
                              <p className="text-xs text-muted-foreground line-through truncate">
                                {formatCurrency(debt.totalAmount)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Nenhuma dívida compilada encontrada</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Visualização Normal */
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'personal' | 'third-party' | 'archived' | 'paid')}>
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
              <TabsTrigger value="paid" className="whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
                <Check className="h-3.5 w-3.5" />
                Pagas
              </TabsTrigger>
              <TabsTrigger value="archived" className="whitespace-nowrap flex-shrink-0">Arquivadas</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Desktop: Grid Tabs */}
          <div className="hidden md:block">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Eu devo
              </TabsTrigger>
              <TabsTrigger value="third-party" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Alguém me deve
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Pagas
              </TabsTrigger>
              <TabsTrigger value="archived">Arquivadas</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              renderDebtList(filteredDebts)
            )}
          </TabsContent>

          <TabsContent value="personal" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              renderDebtList(filteredDebts)
            )}
          </TabsContent>

          <TabsContent value="third-party" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              renderDebtList(filteredDebts)
            )}
          </TabsContent>

          <TabsContent value="paid" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              renderDebtList(filteredDebts)
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            {isLoading ? (
              <div className="text-center py-12">Carregando...</div>
            ) : (
              renderDebtList(filteredDebts)
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editingDebt} onOpenChange={(open) => !open && setEditingDebt(null)}>
        <DialogContent className="!max-w-[95vw] sm:!max-w-[500px] !w-[95vw] sm:!w-full !max-h-[95vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl">Editar Dívida</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Atualize todas as informações da dívida conforme necessário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="space-y-4 px-4 sm:px-6 py-4 overflow-y-auto flex-1 min-h-0">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-2 border-t flex-shrink-0 bg-background">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingDebt(null)}
                className="w-full sm:w-auto order-2 sm:order-1"
                disabled={isUpdatingDebt}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdatingDebt}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
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

      {/* Modal de Cancelamento de Assinatura */}
      {cancelRecurringDebt && (
        <CancelRecurringModal
          open={!!cancelRecurringDebt}
          onOpenChange={(open) => {
            if (!open) {
              setCancelRecurringDebt(null);
            }
          }}
          debtId={cancelRecurringDebt.id}
          debtDescription={cancelRecurringDebt.description || 'Assinatura recorrente'}
          isMercadoPago={cancelRecurringDebt.useGateway && cancelRecurringDebt.preferredGateway === 'MERCADOPAGO'}
          onSuccess={() => {
            setCancelRecurringDebt(null);
            // Invalida queries para atualizar a lista
          }}
        />
      )}

      {/* Dialog de Confirmação de Deleção */}
      <AlertDialog open={!!deletingDebtId} onOpenChange={(open) => !open && setDeletingDebtId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta dívida permanentemente? Esta ação não pode ser desfeita.
              <br />
              <br />
              <strong>Atenção:</strong> Apenas dívidas pagas ou canceladas podem ser deletadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDebtId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingDebtId) {
                  deleteDebt(deletingDebtId, {
                    onSuccess: () => {
                      setDeletingDebtId(null);
                    },
                  });
                }
              }}
              disabled={isDeletingDebt}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingDebt ? (
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

