import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDebts } from '@/hooks/useDebts';
import { useWallets } from '@/hooks/useWallets';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Wallet,
  CreditCard,
  User,
  Loader2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authStore } from '@/stores/authStore';
import { pixKeysService } from '@/services/pixKeys.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { EmailAutocomplete } from '@/components/ui/email-autocomplete';
import { DuplicateDebtWarning, DuplicateDebt } from '@/components/debt/DuplicateDebtWarning';
import { debtsService } from '@/services/debts.service';
import { formatCurrency } from '@/lib/utils';
import { WalletSelector } from '@/components/debt/WalletSelector';
import { PaymentMethodSelector } from '@/components/debt/PaymentMethodSelector';
import { DebtTypeSelector, DebtType } from '@/components/debt/DebtTypeSelector';
import { MercadoPagoTypeSelector, MercadoPagoPaymentType } from '@/components/debt/MercadoPagoTypeSelector';
import { InstallmentCalculator } from '@/components/debt/InstallmentCalculator';
import { CreatePixKeyModal } from '@/components/debt/CreatePixKeyModal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface DebtFormData {
  walletId: string;
  description: string;
  totalAmount: number | string;
  installments: number;
  dueDate: string;
  debtorEmail: string;
  debtorName: string;
  creditorEmail?: string;
  creditorName?: string;
  pixKeyId?: string;
}

const STEPS = [
  { id: 0, title: 'Carteira', icon: Wallet },
  { id: 1, title: 'Método de Pagamento', icon: CreditCard },
  { id: 2, title: 'Tipo de Dívida', icon: Info },
  { id: 3, title: 'Dados do Usuário', icon: User },
  { id: 4, title: 'Configuração', icon: CreditCard },
  { id: 5, title: 'Confirmação', icon: Check },
];

export default function CreateDebt() {
  const navigate = useNavigate();
  const { createDebt, isCreatingDebt } = useDebts();
  const { wallets, isLoading: isLoadingWallets } = useWallets();
  const { user } = authStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'pix' | null>(null);
  const [debtType, setDebtType] = useState<DebtType | null>(null);
  const [mercadoPagoPaymentType, setMercadoPagoPaymentType] = useState<MercadoPagoPaymentType | null>(null);
  const [isPersonalDebt, setIsPersonalDebt] = useState<'other-owes-me' | 'i-owe-other' | 'i-owe-myself'>('other-owes-me');
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string | 'new' | null>(null);
  const [showCreatePixKeyModal, setShowCreatePixKeyModal] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateDebt[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);
  
  // Installment calculator states
  const [inputMode, setInputMode] = useState<'total' | 'installment'>('total');
  const [installmentAmount, setInstallmentAmount] = useState<number | string>('');
  const [isInProgress, setIsInProgress] = useState(false);
  const [paidInstallments, setPaidInstallments] = useState<number>(0);
  
  // Recurring states
  const [recurringInterval, setRecurringInterval] = useState<'MONTHLY' | 'WEEKLY' | 'BIWEEKLY'>('MONTHLY');
  const [recurringDay, setRecurringDay] = useState<number>(new Date().getDate());
  const [subscriptionName, setSubscriptionName] = useState<string>('');
  const [durationMonths, setDurationMonths] = useState<number | null>(null);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<DebtFormData>({
    defaultValues: {
      installments: 1,
    }
  });

  const walletId = watch('walletId');
  const totalAmount = watch('totalAmount');
  const installments = watch('installments') || 1;
  const description = watch('description');
  const debtorEmail = watch('debtorEmail');
  const creditorEmail = watch('creditorEmail');
  const dueDate = watch('dueDate');

  // Buscar chaves PIX
  const { data: pixKeys } = useQuery({
    queryKey: ['pixKeys', walletId],
    queryFn: () => pixKeysService.getAll(),
    enabled: !!walletId,
  });

  // Filtrar chaves PIX da carteira selecionada
  const walletPixKeys = React.useMemo(() => {
    if (!pixKeys || !walletId) return pixKeys || [];
    return pixKeys.filter(key => key.walletId === walletId);
  }, [pixKeys, walletId]);

  // Ajustar tipo de dívida baseado no método de pagamento
  useEffect(() => {
    if (paymentMethod === 'mercadopago') {
      if (mercadoPagoPaymentType === 'RECURRING_CARD') {
        setDebtType('recurring');
      } else if (mercadoPagoPaymentType === 'INSTALLMENT') {
        setDebtType('installment');
      } else if (mercadoPagoPaymentType === 'SINGLE_PIX') {
        setDebtType('single');
      }
    }
  }, [paymentMethod, mercadoPagoPaymentType]);

  // Preencher dados quando "Eu devo para mim mesmo"
  useEffect(() => {
    if (isPersonalDebt === 'i-owe-myself' && user?.email) {
      setValue('debtorEmail', user.email);
      setValue('debtorName', user.name || '');
      setValue('creditorEmail', user.email);
      setValue('creditorName', user.name || '');
    } else if (isPersonalDebt === 'i-owe-other' && user?.email) {
      setValue('debtorEmail', user.email);
      setValue('debtorName', user.name || '');
    }
  }, [isPersonalDebt, user, setValue]);

  const nextStep = async () => {
    let isValid = true;

    if (currentStep === 0) {
      // Step 0: Seleção de Carteira
      isValid = await trigger('walletId');
      if (!isValid) {
        toast.error('Selecione uma carteira');
        return;
      }
    } else if (currentStep === 1) {
      // Step 1: Método de Pagamento
      if (!paymentMethod) {
        toast.error('Selecione um método de pagamento');
        return;
      }
      if (paymentMethod === 'mercadopago' && !mercadoPagoPaymentType) {
        toast.error('Selecione o tipo de pagamento do Mercado Pago');
        return;
      }
    } else if (currentStep === 2) {
      // Step 2: Tipo de Dívida
      if (!debtType) {
        toast.error('Selecione o tipo de dívida');
        return;
      }
    } else if (currentStep === 3) {
      // Step 3: Dados do Usuário
      isValid = await trigger(['description', 'debtorEmail']);
      if (isPersonalDebt === 'i-owe-other' && !creditorEmail) {
        isValid = false;
        toast.error('Email do credor é obrigatório');
      }
      if (!isValid) return;
    } else if (currentStep === 4) {
      // Step 4: Configuração
      isValid = await trigger(['totalAmount', 'dueDate']);
      if (debtType === 'installment') {
        isValid = isValid && await trigger('installments');
      }
      if (paymentMethod === 'pix' && !selectedPixKeyId) {
        isValid = false;
        toast.error('Selecione ou crie uma chave PIX');
      }
      if (!isValid) return;
    }

    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: DebtFormData) => {
    // Verificar duplicatas
    try {
      const duplicateCheck = await debtsService.checkDuplicates({
        debtorEmail: data.debtorEmail,
        creditorEmail: isPersonalDebt === 'other-owes-me' ? user?.email : data.creditorEmail,
        totalAmount: Number(data.totalAmount),
        description: data.description.trim(),
      });

      if (duplicateCheck && duplicateCheck.length > 0) {
        setDuplicates(duplicateCheck);
        setPendingSubmitData({ ...data, paymentMethod, debtType, mercadoPagoPaymentType });
        setShowDuplicateWarning(true);
        return;
      }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
    }

    await createDebtData(data);
  };

  const createDebtData = async (data: DebtFormData) => {
    try {
      // Converter data
      let dueDateISO: string | undefined = undefined;
      if (data.dueDate) {
        const [year, month, day] = String(data.dueDate).split('-');
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59));
        dueDateISO = date.toISOString();
      }

      // Preparar payload
      const payload: any = {
        walletId: data.walletId,
        description: data.description.trim(),
        totalAmount: Number(data.totalAmount),
        dueDate: dueDateISO,
        debtorEmail: data.debtorEmail,
        debtorName: data.debtorName || undefined,
        isPersonalDebt: isPersonalDebt !== 'other-owes-me',
      };

      // Configurar credor
      if (isPersonalDebt === 'other-owes-me') {
        payload.creditorEmail = user?.email;
        payload.creditorName = user?.name || undefined;
      } else if (isPersonalDebt === 'i-owe-other') {
        payload.creditorEmail = data.creditorEmail;
        payload.creditorName = data.creditorName || undefined;
      } else {
        // i-owe-myself
        payload.creditorEmail = user?.email;
        payload.creditorName = user?.name || undefined;
      }

      // Configurar pagamento
      if (paymentMethod === 'mercadopago') {
        payload.useGateway = true;
        payload.preferredGateway = 'MERCADOPAGO';
        payload.mercadoPagoPaymentType = mercadoPagoPaymentType;

        if (mercadoPagoPaymentType === 'INSTALLMENT') {
          payload.installments = installments;
          payload.installmentConfig = {
            interval: 'MONTHLY',
            intervalCount: 1,
          };
        } else if (mercadoPagoPaymentType === 'RECURRING_CARD') {
          payload.isRecurring = true;
          payload.recurringInterval = recurringInterval;
          payload.recurringDay = recurringDay;
          payload.recurringConfig = {
            subscriptionName: subscriptionName || data.description,
            durationMonths: durationMonths,
          };
        }
      } else {
        // PIX Manual
        payload.useGateway = false;
        payload.pixKeyId = selectedPixKeyId === 'new' ? undefined : selectedPixKeyId;

        if (debtType === 'recurring') {
          payload.isRecurring = true;
          payload.recurringInterval = recurringInterval;
          payload.recurringDay = recurringDay;
          payload.installments = 1;
        } else if (debtType === 'installment') {
          payload.installments = installments;
          if (isInProgress) {
            payload.isInProgress = true;
            payload.installmentAmount = Number(installmentAmount);
            payload.totalInstallments = installments;
            payload.paidInstallments = paidInstallments;
          }
        } else {
          payload.installments = 1;
        }
      }

      await createDebt(payload, {
        onSuccess: () => {
          toast.success('Dívida criada com sucesso!');
          navigate('/debts');
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Erro ao criar dívida');
        },
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao criar dívida');
    }
  };

  const handleDuplicateWarningResponse = (action: 'create' | 'edit' | 'cancel') => {
    setShowDuplicateWarning(false);
    if (action === 'create' && pendingSubmitData) {
      createDebtData(pendingSubmitData);
    }
    setPendingSubmitData(null);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Selecione a Carteira</h2>
              <p className="text-muted-foreground">
                Escolha a carteira para associar esta dívida
              </p>
            </div>
            {isLoadingWallets ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <WalletSelector
                wallets={wallets || []}
                selectedWalletId={walletId || null}
                onSelect={(id) => setValue('walletId', id)}
                error={errors.walletId?.message}
              />
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Método de Pagamento</h2>
              <p className="text-muted-foreground">
                Como você deseja receber ou fazer o pagamento?
              </p>
            </div>
            <PaymentMethodSelector
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
            />
            {paymentMethod === 'mercadopago' && (
              <div className="mt-6">
                <MercadoPagoTypeSelector
                  selectedType={mercadoPagoPaymentType}
                  onSelectType={setMercadoPagoPaymentType}
                />
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tipo de Dívida</h2>
              <p className="text-muted-foreground">
                Qual é a natureza desta dívida?
              </p>
            </div>
            <DebtTypeSelector
              selectedType={debtType}
              onSelect={setDebtType}
              paymentMethod={paymentMethod}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Dados do Usuário</h2>
              <p className="text-muted-foreground">
                Informe os dados da pessoa envolvida na dívida
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quem está envolvido?</CardTitle>
                <CardDescription>
                  Selecione quem deve e quem vai receber
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={isPersonalDebt}
                  onValueChange={(value) => setIsPersonalDebt(value as any)}
                >
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="other-owes-me" id="other-owes-me" />
                    <Label htmlFor="other-owes-me" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Outra pessoa me deve</p>
                        <p className="text-sm text-muted-foreground">
                          Você vai receber o pagamento
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="i-owe-other" id="i-owe-other" />
                    <Label htmlFor="i-owe-other" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Eu devo para outra pessoa</p>
                        <p className="text-sm text-muted-foreground">
                          Você vai fazer o pagamento
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="i-owe-myself" id="i-owe-myself" />
                    <Label htmlFor="i-owe-myself" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">Dívida pessoal (para mim mesmo)</p>
                        <p className="text-sm text-muted-foreground">
                          Controle interno de contas e despesas
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <Label htmlFor="description" className="text-base font-semibold">
                  Descrição da Dívida <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  {...register('description', { required: 'Descrição é obrigatória' })}
                  placeholder="Ex: Conta de luz, Mensalidade de academia, Empréstimo..."
                  className="mt-2 min-h-[100px]"
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              {isPersonalDebt !== 'i-owe-myself' && (
                <>
                  <EmailAutocomplete
                    id="debtorEmail"
                    label={isPersonalDebt === 'other-owes-me' ? 'Email do Devedor' : 'Seu Email'}
                    value={debtorEmail || ''}
                    onChange={(value) => setValue('debtorEmail', value)}
                    error={errors.debtorEmail?.message}
                    required
                  />

                  <div>
                    <Label htmlFor="debtorName">Nome {isPersonalDebt === 'other-owes-me' ? 'do Devedor' : ''}</Label>
                    <Input
                      id="debtorName"
                      {...register('debtorName')}
                      placeholder="Nome completo (opcional)"
                      className="mt-2"
                    />
                  </div>
                </>
              )}

              {isPersonalDebt === 'i-owe-other' && (
                <>
                  <EmailAutocomplete
                    id="creditorEmail"
                    label="Email do Credor"
                    value={creditorEmail || ''}
                    onChange={(value) => setValue('creditorEmail', value)}
                    error={errors.creditorEmail?.message}
                    required
                  />

                  <div>
                    <Label htmlFor="creditorName">Nome do Credor</Label>
                    <Input
                      id="creditorName"
                      {...register('creditorName')}
                      placeholder="Nome completo (opcional)"
                      className="mt-2"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Configuração de Pagamento</h2>
              <p className="text-muted-foreground">
                Configure os valores e detalhes do pagamento
              </p>
            </div>

            {paymentMethod === 'pix' && (
              <Card>
                <CardHeader>
                  <CardTitle>Chave PIX</CardTitle>
                  <CardDescription>
                    {isPersonalDebt === 'other-owes-me'
                      ? 'Selecione a chave PIX para receber o pagamento'
                      : 'Selecione a chave PIX da pessoa que vai receber'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedPixKeyId || ''}
                    onValueChange={(value) => {
                      if (value === 'new') {
                        setShowCreatePixKeyModal(true);
                      } else {
                        setSelectedPixKeyId(value);
                        setValue('pixKeyId', value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma chave PIX" />
                    </SelectTrigger>
                    <SelectContent>
                      {walletPixKeys?.map((key) => (
                        <SelectItem key={key.id} value={key.id}>
                          {key.label} ({key.keyValue})
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ Criar nova chave PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            <InstallmentCalculator
              inputMode={inputMode}
              onInputModeChange={setInputMode}
              totalAmount={totalAmount || ''}
              installmentAmount={installmentAmount}
              installments={installments}
              onTotalAmountChange={(value) => setValue('totalAmount', value)}
              onInstallmentAmountChange={setInstallmentAmount}
              onInstallmentsChange={(value) => setValue('installments', value)}
              isInProgress={isInProgress}
              onInProgressChange={setIsInProgress}
              paidInstallments={paidInstallments}
              onPaidInstallmentsChange={setPaidInstallments}
              debtType={debtType || undefined}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {debtType === 'recurring' && (
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de Recorrência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Intervalo</Label>
                    <Select
                      value={recurringInterval}
                      onValueChange={(value) => setRecurringInterval(value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Mensal</SelectItem>
                        <SelectItem value="WEEKLY">Semanal</SelectItem>
                        <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recurringInterval === 'MONTHLY' && (
                    <div>
                      <Label>Dia do Mês</Label>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={recurringDay}
                        onChange={(e) => setRecurringDay(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  )}

                  {paymentMethod === 'mercadopago' && (
                    <>
                      <div>
                        <Label>Nome da Assinatura</Label>
                        <Input
                          value={subscriptionName}
                          onChange={(e) => setSubscriptionName(e.target.value)}
                          placeholder={description || 'Nome da assinatura'}
                        />
                      </div>
                      <div>
                        <Label>Duração (meses) - Deixe vazio para indefinida</Label>
                        <Input
                          type="number"
                          min={1}
                          value={durationMonths || ''}
                          onChange={(e) => setDurationMonths(e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Indefinida"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Confirmação</h2>
              <p className="text-muted-foreground">
                Revise os dados antes de criar a dívida
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumo da Dívida</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="font-medium">{description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-medium">{formatCurrency(Number(totalAmount) || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                    <p className="font-medium">
                      {paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'PIX Manual'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">
                      {debtType === 'recurring' ? 'Recorrente' : debtType === 'installment' ? 'Parcelada' : 'Única'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vencimento</p>
                    <p className="font-medium">{dueDate ? new Date(dueDate).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                  {debtType === 'installment' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Parcelas</p>
                      <p className="font-medium">{installments}x</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/debts')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Criar Nova Dívida</h1>
        <p className="text-muted-foreground mt-2">
          Preencha as informações para criar uma nova dívida
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                      isActive && 'border-primary bg-primary text-primary-foreground',
                      isCompleted && 'border-primary bg-primary text-primary-foreground',
                      !isActive && !isCompleted && 'border-muted bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <p className={cn(
                    'text-xs mt-2 text-center hidden sm:block',
                    isActive && 'font-semibold text-primary',
                    !isActive && 'text-muted-foreground'
                  )}>
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'h-0.5 flex-1 mx-2',
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="pt-6">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep} size="lg">
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="lg"
              disabled={isCreatingDebt}
            >
              {isCreatingDebt ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Criar Dívida
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      <DuplicateDebtWarning
        open={showDuplicateWarning}
        duplicates={duplicates}
        onResponse={handleDuplicateWarningResponse}
        onOpenChange={setShowDuplicateWarning}
      />

      <CreatePixKeyModal
        open={showCreatePixKeyModal}
        onOpenChange={setShowCreatePixKeyModal}
        walletId={walletId || undefined}
        onSuccess={(pixKeyId) => {
          setSelectedPixKeyId(pixKeyId);
          setValue('pixKeyId', pixKeyId);
        }}
      />
    </div>
  );
}
