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
  addInterest: boolean;
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
      addInterest: false,
      interestRate: 2.0,
      penaltyRate: 5.0,
    }
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isPersonalDebt, setIsPersonalDebt] = useState(false);
  const [isPersonalDebtForMyself, setIsPersonalDebtForMyself] = useState(true);
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string | 'new' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateDebt[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<DebtFormData | null>(null);

  const totalSteps = 3;

  // Watch values
  const useGateway = watch('useGateway');
  const addInterest = watch('addInterest');
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

  const nextStep = async () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = await trigger(['debtorEmail', 'debtorName', 'description']);
      if (isPersonalDebt && !isPersonalDebtForMyself) {
        isValid = isValid && await trigger('creditorEmail');
      }
    } else if (currentStep === 2) {
      isValid = await trigger(['totalAmount', 'installments', 'dueDate', 'walletId']);
      if (!useGateway) {
        isValid = isValid && await trigger('pixKeyId');
      }
    }

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
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
        addInterest: data.addInterest,
        interestRate: data.addInterest ? data.interestRate : undefined,
        penaltyRate: data.addInterest ? data.penaltyRate : undefined,
      };

      if (!data.useGateway && selectedPixKeyId && selectedPixKeyId !== 'new') {
        debtData.pixKeyId = selectedPixKeyId;
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
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
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
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                      </div>
                      <span className={cn(
                  'ml-2 text-sm font-medium hidden sm:block',
                  currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                  {step === 1 ? 'Informações' : step === 2 ? 'Valores' : 'Revisão'}
                      </span>
                    </div>
              {step < totalSteps && (
                      <div className={cn(
                  'flex-1 h-1 mx-2 transition-colors',
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                      )} />
                    )}
                  </React.Fragment>
          ))}
          </div>

      <form onSubmit={handleSubmit(onSubmit)}>
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
                  <div>
                    <Label htmlFor="debtorEmail">
                      Email do Devedor {!isPersonalDebt && <span className="text-destructive">*</span>}
                    </Label>
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
                      required={!isPersonalDebt}
                      />
                  </div>

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

                      {!isPersonalDebtForMyself && (
                        <>
                          <div>
                            <Label htmlFor="creditorEmail">
                              Email do Credor <span className="text-destructive">*</span>
                            </Label>
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

                  {/* Forma de Pagamento */}
                          <div className="space-y-3">
                    <Label>Forma de Pagamento</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={!useGateway ? 'default' : 'outline'}
                        className="h-auto py-4 flex-col gap-2"
                        onClick={() => setValue('useGateway', false)}
                          >
                        <CreditCard className="h-5 w-5" />
                        <span className="text-sm">PIX Manual</span>
                      </Button>
                            <Button
                              type="button"
                        variant={useGateway ? 'default' : 'outline'}
                        className="h-auto py-4 flex-col gap-2"
                              onClick={() => {
                          setValue('useGateway', true);
                          navigate('/debts/create-mercadopago');
                              }}
                            >
                        <Sparkles className="h-5 w-5" />
                        <span className="text-sm">Mercado Pago</span>
                            </Button>
                      </div>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {!useGateway
                          ? 'PIX Manual: você receberá a chave PIX e fará o controle manual dos pagamentos.'
                          : 'Mercado Pago: sistema cria links de pagamento e QR Codes automaticamente.'}
                      </AlertDescription>
                    </Alert>
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
                        <div className="flex items-center justify-between">
                            <div>
                            <Label>Adicionar Juros e Multa</Label>
                            <p className="text-xs text-muted-foreground">
                              Aplicados apenas em caso de atraso
                            </p>
                            </div>
                                  <Switch
                            checked={addInterest}
                            onCheckedChange={(checked) => setValue('addInterest', checked)}
                                  />
                                </div>

                        {addInterest && (
                                  <>
                                    <div>
                              <Label htmlFor="interestRate">Juros ao Mês (%)</Label>
                                      <Input
                                id="interestRate"
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                {...register('interestRate')}
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
                                      />
                                    </div>
                                  </>
                                )}
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
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Devedor:</span>
                      <div className="text-right">
                        <p className="font-medium">{watch('debtorName') || watch('debtorEmail')}</p>
                        <p className="text-xs text-muted-foreground">{watch('debtorEmail')}</p>
                            </div>
                            </div>
                    {isPersonalDebt && !isPersonalDebtForMyself && (
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">Credor:</span>
                        <div className="text-right">
                          <p className="font-medium">{watch('creditorName') || watch('creditorEmail')}</p>
                          <p className="text-xs text-muted-foreground">{watch('creditorEmail')}</p>
                                </div>
                                    </div>
                    )}
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Descrição:</span>
                      <p className="font-medium text-right max-w-[60%]">{watch('description')}</p>
                            </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor Total:</span>
                      <p className="font-bold text-lg">{formatCurrency(parseFloat(String(totalAmount || 0)))}</p>
                          </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Parcelas:</span>
                      <p className="font-medium">{installments}x de {formatCurrency(installmentValue)}</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Vencimento:</span>
                      <p className="font-medium">{new Date(watch('dueDate')).toLocaleDateString('pt-BR')}</p>
                </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pagamento:</span>
                      <Badge>{useGateway ? 'Mercado Pago' : 'PIX Manual'}</Badge>
                    </div>
                    {wallets && walletId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Carteira:</span>
                        <p className="font-medium">
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
