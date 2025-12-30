import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDebts } from '@/hooks/useDebts';
import { useWallets } from '@/hooks/useWallets';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  DollarSign,
  CreditCard,
  Info,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authStore } from '@/stores/authStore';
import { pixKeysService } from '@/services/pixKeys.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Badge } from '@/components/ui/badge';

interface DebtFormData {
  // Informações Básicas
  debtorEmail: string;
  debtorName: string;
  creditorEmail: string;
  creditorName: string;
  description: string;
  walletId?: string;
  
  // Valores
  totalAmount: number | string;
  installments: number;
  dueDate: string;
  
  // Opções de Pagamento
  useGateway: boolean;
  preferredGateway: 'MERCADOPAGO';
  interestRate?: number;
  penaltyRate?: number;
  
  // PIX Key
  pixKeyId?: string;
}

export default function CreateDebt() {
  const navigate = useNavigate();
  const { createDebt, isCreatingDebt } = useDebts();
  const { wallets, defaultWallet } = useWallets();
  const { user } = authStore();

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<DebtFormData>({
    defaultValues: {
      installments: 1,
      useGateway: false,
      preferredGateway: 'MERCADOPAGO',
      interestRate: 2.0,
      penaltyRate: 5.0,
    }
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'mercadopago' | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPersonalDebt, setIsPersonalDebt] = useState(false);
  const [isPersonalDebtForMyself, setIsPersonalDebtForMyself] = useState(true);
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateDebt[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<DebtFormData | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'MONTHLY' | 'WEEKLY' | 'BIWEEKLY'>('MONTHLY');
  const [recurringDay, setRecurringDay] = useState<number>(1);
  const [debtStatus, setDebtStatus] = useState<'PENDING' | 'PARTIAL'>('PENDING');

  const totalSteps = 4; // 0: Método de pagamento, 1: Informações, 2: Valores, 3: Revisão

  // Watch values
  const useGateway = watch('useGateway');
  const installments = watch('installments') || 1;
  const totalAmount = watch('totalAmount');
  const walletId = watch('walletId');

  // Buscar chaves PIX
  const { data: pixKeys } = useQuery({
    queryKey: ['pixKeys'],
    queryFn: () => pixKeysService.getAll(),
  });

  // Definir carteira padrão se não selecionada
  React.useEffect(() => {
    if (!walletId && defaultWallet) {
      setValue('walletId', defaultWallet.id);
    }
  }, [defaultWallet, walletId, setValue]);

  // Preencher email do devedor quando "Eu devo" e "Para mim mesmo"
  React.useEffect(() => {
    if (isPersonalDebt && isPersonalDebtForMyself && user?.email) {
      setValue('debtorEmail', user.email);
      setValue('debtorName', user.name || '');
      setValue('creditorEmail', user.email);
      setValue('creditorName', user.name || '');
    } else if (isPersonalDebt && !isPersonalDebtForMyself && user?.email) {
      setValue('debtorEmail', user.email);
      setValue('debtorName', user.name || '');
    }
  }, [isPersonalDebt, isPersonalDebtForMyself, user, setValue]);

  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 0) {
      // Step 0: Seleção de método de pagamento - apenas verificar se foi selecionado
      if (paymentMethod) {
        setValue('useGateway', paymentMethod === 'mercadopago');
        setCurrentStep(1);
        return;
      }
      return;
    } else if (currentStep === 1) {
      isValid = await trigger(['debtorEmail', 'description']);
      if (isPersonalDebt && !isPersonalDebtForMyself) {
        isValid = isValid && await trigger('creditorEmail');
      }
    } else if (currentStep === 2) {
      isValid = await trigger(['totalAmount', 'installments', 'dueDate', 'walletId']);
      if (!useGateway) {
        isValid = isValid && await trigger('pixKeyId');
      }
    }

    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const onSubmit = async (data: DebtFormData) => {
    // Verificar duplicatas antes de criar
    try {
      const duplicateCheck = await debtsService.checkDuplicates({
        debtorEmail: data.debtorEmail,
        creditorEmail: isPersonalDebt ? data.creditorEmail : user?.email,
        totalAmount: parseFloat(String(data.totalAmount)),
        description: data.description,
  });

      if (duplicateCheck && duplicateCheck.length > 0) {
        setDuplicates(duplicateCheck);
        setPendingSubmitData(data);
        setShowDuplicateWarning(true);
      return;
    }
    } catch (error) {
      console.error('Erro ao verificar duplicatas:', error);
    }

    await handleCreateDebt(data);
  };

  const handleCreateDebt = async (data: DebtFormData) => {
    try {
      const debtData: any = {
        debtorEmail: data.debtorEmail,
        debtorName: data.debtorName,
        creditorEmail: isPersonalDebt ? data.creditorEmail : user?.email || '',
        creditorName: isPersonalDebt ? data.creditorName : user?.name || '',
        description: data.description,
        totalAmount: parseFloat(String(data.totalAmount)),
        installments: parseInt(String(data.installments)),
        dueDate: data.dueDate,
        walletId: data.walletId || defaultWallet?.id,
        isPersonalDebt,
        useGateway: data.useGateway,
        preferredGateway: data.useGateway ? 'MERCADOPAGO' : undefined,
        interestRate: data.interestRate,
        penaltyRate: data.penaltyRate,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
        recurringDay: isRecurring ? recurringDay : undefined,
        isInProgress: debtStatus === 'PARTIAL',
      };

      if (!data.useGateway && selectedPixKeyId && selectedPixKeyId !== 'new') {
        debtData.pixKeyId = selectedPixKeyId;
      }

      // Adicionar configuração de recorrência se for Mercado Pago
      if (data.useGateway && isRecurring) {
        debtData.recurringConfig = {
          subscriptionName: data.description || 'Assinatura Recorrente',
          durationMonths: null, // Indefinida por padrão
        };
      }

      await createDebt(debtData, {
        onSuccess: () => {
          toast.success('Dívida criada com sucesso!');
          navigate('/debts');
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Erro ao criar dívida');
        },
      });
    } catch (error: any) {
          toast.error(error.response?.data?.message || 'Erro ao criar dívida');
    }
  };

  const handleDuplicateWarningResponse = (action: 'create' | 'edit' | 'cancel') => {
    setShowDuplicateWarning(false);
    if (action === 'create' && pendingSubmitData) {
      handleCreateDebt(pendingSubmitData);
    } else if (action === 'edit' && duplicates.length > 0) {
      navigate(`/debts/${duplicates[0].id}/edit`);
    }
  };

  // Calcular valor por parcela
  const installmentValue = totalAmount && installments
    ? parseFloat(String(totalAmount)) / installments
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/debts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Nova Dívida</h1>
            <p className="text-sm text-muted-foreground">Crie uma nova dívida de forma simples</p>
          </div>
        </div>

        {/* Progress Steps */}
        {paymentMethod && (
          <div className="flex items-center justify-between mb-6">
            {[0, 1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className="flex items-center">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-colors',
                      currentStep >= step
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step ? <Check className="h-5 w-5" /> : step + 1}
                  </div>
                  <span className={cn(
                    'ml-2 text-sm font-medium hidden sm:block',
                    currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step === 0 ? 'Pagamento' : step === 1 ? 'Informações' : step === 2 ? 'Valores' : 'Revisão'}
                  </span>
                </div>
                {step < totalSteps - 1 && (
                  <div className={cn(
                    'flex-1 h-1 mx-2 transition-colors',
                    currentStep > step ? 'bg-primary' : 'bg-muted'
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

      <form onSubmit={handleSubmit(onSubmit)}>
          {/* STEP 0: Seleção de Método de Pagamento */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Método de Pagamento
                  </CardTitle>
                  <CardDescription>
                    Escolha como deseja receber/pagar esta dívida
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                      className="h-auto py-8 flex-col gap-3"
                      onClick={() => {
                        setPaymentMethod('pix');
                        setValue('useGateway', false);
                      }}
                    >
                      <CreditCard className="h-8 w-8" />
                      <span className="text-base font-semibold">PIX Manual</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Você receberá a chave PIX e fará o controle manual dos pagamentos
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'mercadopago' ? 'default' : 'outline'}
                      className="h-auto py-8 flex-col gap-3"
                      onClick={() => {
                        setPaymentMethod('mercadopago');
                        setValue('useGateway', true);
                      }}
                    >
                      <Sparkles className="h-8 w-8" />
                      <span className="text-base font-semibold">Mercado Pago</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Sistema cria links de pagamento e QR Codes automaticamente
                      </span>
                    </Button>
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Importante:</strong> Ambos os métodos suportam dívidas recorrentes. Você poderá configurar a recorrência na etapa de valores.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  size="lg"
                  disabled={!paymentMethod}
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: Informações Básicas */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Básicas
                  </CardTitle>
                  <CardDescription>
                    Quem deve e para quem deve
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tipo de Dívida */}
                  <div className="space-y-3">
                    <Label>Tipo de Dívida</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={!isPersonalDebt ? 'default' : 'outline'}
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setIsPersonalDebt(false)}
                      >
                        <User className="h-5 w-5" />
                        <span className="text-sm">Alguém me deve</span>
                      </Button>
                      <Button
                        type="button"
                        variant={isPersonalDebt ? 'default' : 'outline'}
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setIsPersonalDebt(true)}
                      >
                        <CreditCard className="h-5 w-5" />
                        <span className="text-sm">Eu devo</span>
                      </Button>
                        </div>
                      </div>
                      
                  {/* Email do Devedor */}
                  {!isPersonalDebt && (
                    <div>
                      <EmailAutocomplete
                        id="debtorEmail"
                        label="Email do Devedor"
                        value={watch('debtorEmail') || ''}
                        onChange={(value) => {
                          setValue('debtorEmail', value, { shouldValidate: true });
                        }}
                        onBlur={() => trigger('debtorEmail')}
                        error={errors.debtorEmail?.message}
                        placeholder="devedor@email.com"
                        required
                      />
                    </div>
                  )}
                  {isPersonalDebt && (
                    <div>
                      <Label htmlFor="debtorEmail">Email do Devedor</Label>
                      <Input
                        id="debtorEmail"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Você é o devedor nesta dívida
                      </p>
                    </div>
                  )}

                  {/* Nome do Devedor */}
                      <div>
                    <Label htmlFor="debtorName">Nome do Devedor</Label>
                        <Input 
                          id="debtorName"
                          {...register('debtorName')} 
                      placeholder="Nome completo"
                        />
                      </div>

                  {/* Credor (se dívida pessoal) */}
                  {isPersonalDebt && (
                    <>
                      <div>
                        <Label htmlFor="personalDebtType">Para quem você deve?</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <Button
                            type="button"
                            variant={isPersonalDebtForMyself ? 'default' : 'outline'}
                            className="h-auto py-3"
                            onClick={() => setIsPersonalDebtForMyself(true)}
                          >
                            Para mim mesmo
                          </Button>
                          <Button
                            type="button"
                            variant={!isPersonalDebtForMyself ? 'default' : 'outline'}
                            className="h-auto py-3"
                            onClick={() => setIsPersonalDebtForMyself(false)}
                          >
                            Para outra pessoa
                          </Button>
                        </div>
                      </div>

                      {isPersonalDebtForMyself && (
                        <div>
                          <Label htmlFor="creditorEmail">Email do Credor</Label>
                          <Input
                            id="creditorEmail"
                            value={user?.email || ''}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Você está pagando para você mesmo
                          </p>
                        </div>
                      )}
                      {!isPersonalDebtForMyself && (
                        <>
                          <div>
                            <EmailAutocomplete
                              id="creditorEmail"
                              label="Email do Credor"
                              value={watch('creditorEmail') || ''}
                              onChange={(value) => {
                                setValue('creditorEmail', value, { shouldValidate: true });
                              }}
                              onBlur={() => trigger('creditorEmail')}
                              error={errors.creditorEmail?.message}
                              placeholder="credor@email.com"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="creditorName">Nome do Credor</Label>
                            <Input 
                              id="creditorName"
                              {...register('creditorName')} 
                              placeholder="Nome completo"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Descrição */}
                  <div>
                    <Label htmlFor="description">
                      Descrição da Dívida <span className="text-destructive">*</span>
                    </Label>
                    <Textarea 
                      id="description"
                      {...register('description', {
                        required: 'Descrição é obrigatória',
                        minLength: { value: 5, message: 'Descrição deve ter pelo menos 5 caracteres' },
                      })} 
                      placeholder="Ex: Pagamento de serviços de consultoria"
                      rows={3}
                      className="resize-none"
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Esta descrição será enviada no email de notificação
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="button" onClick={nextStep} size="lg">
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                </div>
              </div>
            )}

          {/* STEP 2: Valores e Pagamento */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Valores e Pagamento
                  </CardTitle>
                  <CardDescription>
                    Defina o valor, parcelas e forma de pagamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Carteira */}
                  {wallets && wallets.length > 0 && (
                <div>
                      <Label htmlFor="walletId">Carteira</Label>
                      <Select
                        value={walletId || defaultWallet?.id || ''}
                        onValueChange={(value) => setValue('walletId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma carteira" />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              <div className="flex items-center gap-2">
                                <span>{wallet.icon || '💳'}</span>
                                <span>{wallet.name}</span>
                                {wallet.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Padrão</Badge>
                                )}
                </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Valor Total */}
                  <div>
                    <Label htmlFor="totalAmount">
                      Valor Total <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="totalAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="pl-8"
                        placeholder="0,00"
                        {...register('totalAmount', {
                          required: 'Valor é obrigatório',
                          min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                        })}
                      />
                    </div>
                    {errors.totalAmount && (
                      <p className="text-sm text-destructive mt-1">{errors.totalAmount.message}</p>
                    )}
                  </div>

                  {/* Parcelas */}
                      <div>
                    <Label htmlFor="installments">Número de Parcelas</Label>
                          <Input
                      id="installments"
                            type="number"
                            min="1"
                      max="36"
                      {...register('installments', {
                        required: 'Número de parcelas é obrigatório',
                        min: { value: 1, message: 'Mínimo 1 parcela' },
                        max: { value: 36, message: 'Máximo 36 parcelas' },
                      })}
                    />
                    {errors.installments && (
                      <p className="text-sm text-destructive mt-1">{errors.installments.message}</p>
                    )}
                    {totalAmount && installments > 1 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Valor por parcela: {formatCurrency(installmentValue)}
                      </p>
                          )}
                        </div>

                  {/* Data de Vencimento */}
                        <div>
                    <Label htmlFor="dueDate">
                      Data do Primeiro Vencimento <span className="text-destructive">*</span>
                    </Label>
                          <Input
                      id="dueDate"
                      type="date"
                      {...register('dueDate', {
                        required: 'Data de vencimento é obrigatória',
                      })}
                          />
                    {errors.dueDate && (
                      <p className="text-sm text-destructive mt-1">{errors.dueDate.message}</p>
                          )}
                      </div>

                  {/* Recorrência */}
                  <div className="space-y-4 border-t pt-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Dívida Recorrente:</strong> Ative esta opção se esta dívida se repete periodicamente (ex: aluguel, assinatura, salário).
                      </AlertDescription>
                    </Alert>

                    <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="flex-1 min-w-0 pr-4">
                        <Label className="text-base font-semibold">Esta é uma dívida recorrente?</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          A cobrança será gerada automaticamente conforme o intervalo configurado
                        </p>
                      </div>
                      <Switch
                        checked={isRecurring}
                        onCheckedChange={setIsRecurring}
                        className="flex-shrink-0"
                      />
                    </div>

                    {isRecurring && (
                      <div className="space-y-4 mt-4 p-4 bg-muted/30 border rounded-lg">
                        <div>
                          <Label htmlFor="recurringInterval" className="text-base font-semibold">
                            Intervalo de Recorrência <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={recurringInterval}
                            onValueChange={(value: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY') => setRecurringInterval(value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MONTHLY">Mensal</SelectItem>
                              <SelectItem value="WEEKLY">Semanal</SelectItem>
                              <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Com que frequência esta dívida se repete?
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="recurringDay" className="text-base font-semibold">
                            Dia da Recorrência <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="recurringDay"
                            type="number"
                            min="1"
                            max="31"
                            value={recurringDay}
                            onChange={(e) => setRecurringDay(parseInt(e.target.value) || 1)}
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {recurringInterval === 'MONTHLY' 
                              ? 'Dia do mês em que a cobrança será gerada (1-31)'
                              : recurringInterval === 'WEEKLY'
                              ? 'Dia da semana (1=Segunda, 7=Domingo)'
                              : 'Dia do mês para cobranças quinzenais (1-31)'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Status da Dívida */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex-1 min-w-0 pr-4">
                        <Label>Status da Dívida</Label>
                        <p className="text-xs text-muted-foreground">
                          Dívida já está em andamento?
                        </p>
                      </div>
                      <Select
                        value={debtStatus}
                        onValueChange={(value: 'PENDING' | 'PARTIAL') => setDebtStatus(value)}
                      >
                        <SelectTrigger className="w-[180px] flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="PARTIAL">Em Andamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Chave PIX (se PIX Manual) */}
                  {!useGateway && (
                    <div>
                      <Label htmlFor="pixKeyId">
                        Chave PIX para Recebimento <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={selectedPixKeyId || ''}
                        onValueChange={(value) => {
                            setSelectedPixKeyId(value);
                          if (value !== 'new') {
                            setValue('pixKeyId', value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma chave PIX" />
                        </SelectTrigger>
                        <SelectContent>
                          {pixKeys?.map((key) => (
                            <SelectItem key={key.id} value={key.id}>
                              {key.label || key.keyValue}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.pixKeyId && (
                        <p className="text-sm text-destructive mt-1">{errors.pixKeyId.message}</p>
                      )}
                    </div>
                  )}

                  {/* Opções Avançadas */}
                  <div className="border-t pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-between"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                              >
                      <span>Opções Avançadas</span>
                      {showAdvanced ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>

                    {showAdvanced && (
                      <div className="space-y-4 mt-4">
                        {/* Juros e Multa */}
                        <div>
                          <Label className="mb-2 block">Juros e Multa</Label>
                          <p className="text-xs text-muted-foreground mb-4">
                            Aplicados apenas em caso de atraso (opcional)
                          </p>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="interestRate">Juros ao Mês (%)</Label>
                              <Input
                                id="interestRate"
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                {...register('interestRate')}
                                placeholder="0.0"
                              />
                            </div>
                            <div>
                              <Label htmlFor="penaltyRate">Multa por Atraso (%)</Label>
                              <Input
                                id="penaltyRate"
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                {...register('penaltyRate')}
                                placeholder="0.0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                      </CardContent>
                    </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button type="button" onClick={nextStep} size="lg">
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                          </div>
                    </div>
                      )}

          {/* STEP 3: Revisão */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Revisão
                  </CardTitle>
                  <CardDescription>
                    Revise as informações antes de criar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                          <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Tipo:</span>
                      <Badge>{isPersonalDebt ? 'Eu devo' : 'Alguém me deve'}</Badge>
                            </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">Devedor:</span>
                      <div className="text-right min-w-0 flex-1">
                        <p className="font-medium truncate">{watch('debtorName') || watch('debtorEmail')}</p>
                        <p className="text-xs text-muted-foreground truncate">{watch('debtorEmail')}</p>
                      </div>
                    </div>
                    {isPersonalDebt && !isPersonalDebtForMyself && (
                      <div className="flex justify-between items-start gap-4">
                        <span className="text-sm text-muted-foreground flex-shrink-0">Credor:</span>
                        <div className="text-right min-w-0 flex-1">
                          <p className="font-medium truncate">{watch('creditorName') || watch('creditorEmail')}</p>
                          <p className="text-xs text-muted-foreground truncate">{watch('creditorEmail')}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">Descrição:</span>
                      <p className="font-medium text-right truncate min-w-0 flex-1">{watch('description')}</p>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">Valor Total:</span>
                      <p className="font-bold text-lg truncate min-w-0 flex-1 text-right">{formatCurrency(parseFloat(String(totalAmount || 0)))}</p>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">Parcelas:</span>
                      <p className="font-medium truncate min-w-0 flex-1 text-right">{installments}x de {formatCurrency(installmentValue)}</p>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">Vencimento:</span>
                      <p className="font-medium truncate min-w-0 flex-1 text-right">{new Date(watch('dueDate')).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">Pagamento:</span>
                      <Badge className="flex-shrink-0">{useGateway ? 'Mercado Pago' : 'PIX Manual'}</Badge>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-muted-foreground flex-shrink-0">Status:</span>
                      <Badge variant={debtStatus === 'PARTIAL' ? 'default' : 'secondary'} className="flex-shrink-0">
                        {debtStatus === 'PARTIAL' ? 'Em Andamento' : 'Pendente'}
                      </Badge>
                    </div>
                    {isRecurring && (
                      <>
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-sm text-muted-foreground flex-shrink-0">Recorrente:</span>
                          <Badge variant="outline" className="flex-shrink-0">Sim</Badge>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-sm text-muted-foreground flex-shrink-0">Intervalo:</span>
                          <p className="font-medium truncate min-w-0 flex-1 text-right">
                            {recurringInterval === 'MONTHLY' ? 'Mensal' : recurringInterval === 'WEEKLY' ? 'Semanal' : 'Quinzenal'}
                          </p>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-sm text-muted-foreground flex-shrink-0">Dia da Recorrência:</span>
                          <p className="font-medium truncate min-w-0 flex-1 text-right">{recurringDay}</p>
                        </div>
                      </>
                    )}
                    {wallets && walletId && (
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-sm text-muted-foreground flex-shrink-0">Carteira:</span>
                        <p className="font-medium truncate min-w-0 flex-1 text-right">
                          {wallets.find((w) => w.id === walletId)?.name || 'Padrão'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
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
            </div>
            </div>
          )}
      </form>

        {/* Modal de Duplicatas */}
        <DuplicateDebtWarning
          open={showDuplicateWarning}
          duplicates={duplicates}
          onResponse={handleDuplicateWarningResponse}
          onOpenChange={setShowDuplicateWarning}
        />
      </div>
    </div>
  );
}
