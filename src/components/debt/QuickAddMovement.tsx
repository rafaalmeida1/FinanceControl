import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallets } from '@/hooks/useWallets';
import { debtsService } from '@/services/debts.service';
import { authStore } from '@/stores/authStore';
import { formatCurrency } from '@/lib/utils';
import {
  Receipt,
  Loader2,
  Check,
  DollarSign,
  CreditCard,
  Repeat,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EmailAutocomplete } from '@/components/ui/email-autocomplete';
import { WalletSelector } from './WalletSelector';
import toast from 'react-hot-toast';

interface QuickAddFormData {
  description: string;
  amount: string;
  walletId: string;
  type: 'single' | 'installment' | 'recurring';
  installments?: number;
  dueDate?: string;
  isPersonalDebt: 'other-owes-me' | 'i-owe-other' | 'i-owe-myself';
  debtorEmail?: string;
  debtorName?: string;
  creditorEmail?: string;
  creditorName?: string;
  recurringDay?: number;
}

interface QuickAddMovementProps {
  onClose?: () => void;
}

export function QuickAddMovement({ onClose }: QuickAddMovementProps) {
  const [open, setOpen] = useState(false);
  const { wallets } = useWallets();
  const { user } = authStore();
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<QuickAddFormData>({
    defaultValues: {
      type: 'single',
      isPersonalDebt: 'other-owes-me',
      installments: 1,
      recurringDay: new Date().getDate(),
    },
  });

  const type = watch('type');
  const isPersonalDebt = watch('isPersonalDebt');
  const amount = watch('amount');
  const installments = watch('installments') || 1;
  const walletId = watch('walletId');

  const createMutation = useMutation({
    mutationFn: async (data: QuickAddFormData) => {
      const isPersonal = data.isPersonalDebt === 'i-owe-other' || data.isPersonalDebt === 'i-owe-myself';
      
      const payload: any = {
        description: data.description.trim(),
        totalAmount: parseFloat(data.amount.replace(',', '.')),
        walletId: data.walletId,
        isPersonalDebt: isPersonal,
        installments: data.type === 'single' ? 1 : data.type === 'recurring' ? 1 : (data.installments || 1),
        isRecurring: data.type === 'recurring',
        useGateway: false,
      };

      // Configurar datas
      if (data.type === 'recurring') {
        payload.recurringInterval = 'MONTHLY';
        payload.recurringDay = data.recurringDay || new Date().getDate();
      } else if (data.dueDate) {
        payload.dueDate = new Date(data.dueDate).toISOString();
      }

      // Configurar emails e nomes baseado no tipo
      if (data.isPersonalDebt === 'other-owes-me') {
        payload.debtorEmail = data.debtorEmail;
        payload.debtorName = data.debtorName;
        payload.creditorEmail = user?.email;
        payload.creditorName = user?.name;
      } else if (data.isPersonalDebt === 'i-owe-other') {
        payload.debtorEmail = user?.email;
        payload.debtorName = user?.name;
        payload.creditorEmail = data.creditorEmail;
        payload.creditorName = data.creditorName;
      } else {
        // i-owe-myself
        payload.debtorEmail = user?.email;
        payload.debtorName = user?.name;
        payload.creditorEmail = user?.email;
        payload.creditorName = user?.name;
      }

      return debtsService.create(payload);
    },
    onSuccess: () => {
      toast.success('Conta adicionada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      reset();
      setOpen(false);
      onClose?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao adicionar conta');
    },
  });

  const onSubmit = (data: QuickAddFormData) => {
    if (!data.walletId) {
      toast.error('Selecione uma carteira');
      return;
    }
    createMutation.mutate(data);
  };

  const totalAmount = amount ? parseFloat(amount.replace(',', '.')) : 0;
  const installmentAmount = type === 'installment' && installments > 0 
    ? totalAmount / installments 
    : totalAmount;

  return (
    <>
      {/* Card de Chamada */}
      <Card 
        className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
        onClick={() => setOpen(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Receipt className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-foreground mb-1">
                Fez alguma conta nova?
              </h3>
              <p className="text-sm text-muted-foreground">
                Adicione rapidamente uma nova movimentação
              </p>
            </div>
            <Button 
              size="sm" 
              className="flex-shrink-0 group-hover:scale-105 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
            >
              Adicionar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Criação Rápida */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" />
              Adicionar Conta Rápida
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para adicionar uma nova movimentação de forma rápida
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Carteira */}
            <div>
              <Label htmlFor="walletId">
                Carteira <span className="text-destructive">*</span>
              </Label>
              <WalletSelector
                wallets={wallets || []}
                selectedWalletId={walletId || null}
                onSelect={(id) => setValue('walletId', id)}
                error={errors.walletId?.message}
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description">
                Nome da Conta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                {...register('description', { required: 'Nome da conta é obrigatório' })}
                placeholder="Ex: Conta de luz, Mensalidade academia, Aluguel..."
                className="mt-2"
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Valor */}
            <div>
              <Label htmlFor="amount">
                Valor <span className="text-destructive">*</span>
              </Label>
              <div className="relative mt-2">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  {...register('amount', { 
                    required: 'Valor é obrigatório',
                    pattern: {
                      value: /^\d+([.,]\d{2})?$/,
                      message: 'Valor inválido (use formato: 100.00 ou 100,00)'
                    }
                  })}
                  placeholder="0,00"
                  className="pl-10"
                  type="text"
                  inputMode="decimal"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Tipo de Movimentação */}
            <div>
              <Label>Tipo de Movimentação <span className="text-destructive">*</span></Label>
              <RadioGroup
                value={type}
                onValueChange={(value) => setValue('type', value as 'single' | 'installment' | 'recurring')}
                className="mt-2"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors flex-1">
                    <RadioGroupItem value="single" id="single" />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Única
                      </div>
                      <p className="text-xs text-muted-foreground">Pagamento único</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors flex-1">
                    <RadioGroupItem value="installment" id="installment" />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Parcelada
                      </div>
                      <p className="text-xs text-muted-foreground">Dividida em parcelas</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors flex-1">
                    <RadioGroupItem value="recurring" id="recurring" />
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Recorrente
                      </div>
                      <p className="text-xs text-muted-foreground">Todo mês</p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Parcelas (se parcelada) */}
            {type === 'installment' && (
              <div>
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="2"
                  max="120"
                  {...register('installments', { 
                    valueAsNumber: true,
                    min: { value: 2, message: 'Mínimo 2 parcelas' },
                    max: { value: 120, message: 'Máximo 120 parcelas' }
                  })}
                  className="mt-2"
                  defaultValue={2}
                />
                {installments > 1 && amount && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor por parcela: {formatCurrency(installmentAmount)}
                  </p>
                )}
              </div>
            )}

            {/* Dia do mês (se recorrente) */}
            {type === 'recurring' && (
              <div>
                <Label htmlFor="recurringDay">Dia do Mês para Pagar</Label>
                <Input
                  id="recurringDay"
                  type="number"
                  min="1"
                  max="31"
                  {...register('recurringDay', { 
                    valueAsNumber: true,
                    min: { value: 1, message: 'Dia deve ser entre 1 e 31' },
                    max: { value: 31, message: 'Dia deve ser entre 1 e 31' }
                  })}
                  className="mt-2"
                  defaultValue={new Date().getDate()}
                />
              </div>
            )}

            {/* Data de Vencimento (se única ou parcelada) */}
            {type !== 'recurring' && (
              <div>
                <Label htmlFor="dueDate">
                  Data de Vencimento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...register('dueDate', { required: 'Data de vencimento é obrigatória' })}
                  className="mt-2"
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.dueDate && (
                  <p className="text-sm text-destructive mt-1">{errors.dueDate.message}</p>
                )}
              </div>
            )}

            {/* Tipo de Relacionamento */}
            <div>
              <Label>Quem está envolvido? <span className="text-destructive">*</span></Label>
              <RadioGroup
                value={isPersonalDebt}
                onValueChange={(value) => setValue('isPersonalDebt', value as any)}
                className="mt-2"
              >
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <RadioGroupItem value="other-owes-me" id="other-owes-me" />
                    <div className="flex-1">
                      <div className="font-medium">Alguém me deve</div>
                      <p className="text-xs text-muted-foreground">Outra pessoa deve para você</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <RadioGroupItem value="i-owe-other" id="i-owe-other" />
                    <div className="flex-1">
                      <div className="font-medium">Eu devo para alguém</div>
                      <p className="text-xs text-muted-foreground">Você deve para outra pessoa</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <RadioGroupItem value="i-owe-myself" id="i-owe-myself" />
                    <div className="flex-1">
                      <div className="font-medium">Movimentação pessoal</div>
                      <p className="text-xs text-muted-foreground">Controle pessoal (você para você)</p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Email e Nome (se aplicável) */}
            {isPersonalDebt === 'other-owes-me' && (
              <>
                <div>
                  <Label htmlFor="debtorEmail">
                    Email do Devedor <span className="text-destructive">*</span>
                  </Label>
                  <EmailAutocomplete
                    id="debtorEmail"
                    label="Email do Devedor"
                    value={watch('debtorEmail') || ''}
                    onChange={(value) => setValue('debtorEmail', value)}
                    error={errors.debtorEmail?.message}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="debtorName">Nome do Devedor (opcional)</Label>
                  <Input
                    id="debtorName"
                    {...register('debtorName')}
                    placeholder="Nome completo"
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {isPersonalDebt === 'i-owe-other' && (
              <>
                <div>
                  <Label htmlFor="creditorEmail">
                    Email do Credor <span className="text-destructive">*</span>
                  </Label>
                  <EmailAutocomplete
                    id="creditorEmail"
                    label="Email do Credor"
                    value={watch('creditorEmail') || ''}
                    onChange={(value) => setValue('creditorEmail', value)}
                    error={errors.creditorEmail?.message}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="creditorName">Nome do Credor (opcional)</Label>
                  <Input
                    id="creditorName"
                    {...register('creditorName')}
                    placeholder="Nome completo"
                    className="mt-2"
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Adicionar Conta
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

