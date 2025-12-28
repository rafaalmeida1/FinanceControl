import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDebts } from '@/hooks/useDebts';
import { ArrowLeft, ArrowRight, Check, User, CreditCard, FileText, Info, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authStore } from '@/stores/authStore';
import { pixKeysService, PixKey } from '@/services/pixKeys.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DebtFormData {
  // Step 1: Informações Básicas
  debtorEmail: string;
  debtorName: string;
  creditorEmail: string;
  creditorName: string;
  description: string;
  
  // Step 2: Valores e Pagamento
  totalAmount: number | string;
  installments: number;
  dueDate: string;
  
  // Step 3: Opções de Cobrança
  useGateway: boolean | string;
  preferredGateway: 'MERCADOPAGO';
  addInterest: boolean;
  interestRate?: number;
  penaltyRate?: number;
  
  // PIX Key fields
  pixKeyId?: string;
  pixKeyValue?: string;
  pixKeyType?: string;
  pixKeyLabel?: string;
}

export default function CreateDebt() {
  const navigate = useNavigate();
  const { createDebt, isCreatingDebt } = useDebts();
  const { user } = authStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<DebtFormData>({
    defaultValues: {
      installments: 1,
      useGateway: true,
      preferredGateway: 'MERCADOPAGO',
      addInterest: false,
      interestRate: 2.0,
      penaltyRate: 5.0,
    }
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isPersonalDebt, setIsPersonalDebt] = useState(false);
  const [isPersonalDebtForMyself, setIsPersonalDebtForMyself] = useState(true); // true = para mim mesmo, false = para outra pessoa
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string | 'new' | null>(null);
  const [showNewPixKeyForm, setShowNewPixKeyForm] = useState(false);
  const [useCustomInstallments, setUseCustomInstallments] = useState(false);
  const totalSteps = 3;

  // Buscar chaves PIX
  const { data: pixKeys } = useQuery({
    queryKey: ['pix-keys'],
    queryFn: () => pixKeysService.getAll(),
  });

  // Watch values for conditional rendering
  // Converter useGateway para boolean (vem como string do radio)
  const useGatewayValue = watch('useGateway');
  const useGateway = useGatewayValue === true || useGatewayValue === 'true';
  const addInterest = watch('addInterest');
  const installments = watch('installments');
  const totalAmount = watch('totalAmount');

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Inicializar pixKeyType quando mostrar o form
  useEffect(() => {
    if (showNewPixKeyForm && !watch('pixKeyType')) {
      setValue('pixKeyType' as any, 'CPF');
    }
  }, [showNewPixKeyForm, watch, setValue]);

  const onSubmit = (data: DebtFormData) => {
    // Validar se precisa de chave PIX
    if (!useGateway && showNewPixKeyForm) {
      if (!data.pixKeyType || !data.pixKeyValue) {
        toast.error('Preencha todos os campos obrigatórios da chave PIX');
        return;
      }
    }
    
    // Converter data para ISO 8601 corretamente
    let dueDate: string | undefined = undefined;
    if (data.dueDate) {
      try {
        // Garantir que seja uma string de data válida
        const dateString = String(data.dueDate || '');
        // Criar data no formato correto para ISO
        const [year, month, day] = dateString.split('-');
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59));
        dueDate = date.toISOString();
      } catch (error) {
        console.error('Erro ao converter data:', error);
        toast.error('Data inválida');
        return;
      }
    }
    
    // useGateway vem como string do radio, converter para boolean
    const shouldUseGateway = data.useGateway === true || data.useGateway === 'true';
    
    // Lógica para dívida pessoal
    let finalCreditorEmail: string | undefined;
    let finalCreditorName: string | undefined;
    let finalDebtorEmail: string;
    let finalDebtorName: string | undefined;
    
    if (isPersonalDebt) {
      // Você é sempre o devedor
      finalDebtorEmail = user?.email || '';
      finalDebtorName = user?.name || undefined;
      
      if (isPersonalDebtForMyself) {
        // Para mim mesmo: credor = você mesmo
        finalCreditorEmail = user?.email || '';
        finalCreditorName = user?.name || undefined;
      } else {
        // Para outra pessoa: credor = data.creditorEmail
        finalCreditorEmail = data.creditorEmail;
        finalCreditorName = data.creditorName || undefined;
      }
    } else {
      // Dívida de terceiro: você é credor, data.debtorEmail é o devedor
      finalDebtorEmail = data.debtorEmail;
      finalDebtorName = data.debtorName || undefined;
      finalCreditorEmail = undefined; // Você é o credor (userId no backend)
      finalCreditorName = undefined;
    }
    
    createDebt(
      {
        debtorEmail: finalDebtorEmail,
        debtorName: finalDebtorName,
        creditorEmail: finalCreditorEmail,
        creditorName: finalCreditorName,
        description: data.description || undefined,
        totalAmount: parseFloat(data.totalAmount as any),
        installments: parseInt(data.installments as any) || 1,
        dueDate,
        interestRate: data.addInterest && data.interestRate ? parseFloat(data.interestRate as any) : undefined,
        penaltyRate: data.addInterest && data.penaltyRate ? parseFloat(data.penaltyRate as any) : undefined,
        useGateway: shouldUseGateway,
        preferredGateway: shouldUseGateway ? data.preferredGateway : undefined,
        isPersonalDebt,
        pixKeyId: selectedPixKeyId && selectedPixKeyId !== 'new' ? selectedPixKeyId : undefined,
        pixKeyValue: showNewPixKeyForm && data.pixKeyValue ? data.pixKeyValue : undefined,
        pixKeyType: showNewPixKeyForm && data.pixKeyType ? data.pixKeyType : undefined,
        pixKeyLabel: showNewPixKeyForm && data.pixKeyLabel ? data.pixKeyLabel : undefined,
      } as any,
      {
        onSuccess: () => {
          toast.success(
            isPersonalDebt 
              ? 'Dívida pessoal criada!' 
              : 'Dívida criada e link enviado!'
          );
          navigate('/debts');
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Erro ao criar dívida');
        },
      },
    );
  };

  const steps = [
    { number: 1, title: 'Informações', icon: User },
    { number: 2, title: 'Pagamento', icon: CreditCard },
    { number: 3, title: 'Confirmação', icon: FileText },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nova Dívida</h1>
          <p className="text-sm md:text-base text-muted-foreground">Preencha as informações em {totalSteps} etapas simples</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4 md:p-6">
          {/* Mobile: Compact Layout */}
          <div className="md:hidden">
            <div className="flex items-center justify-between w-full gap-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <React.Fragment key={step.number}>
                    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm',
                        isCompleted && 'bg-green-600 text-white',
                        isActive && !isCompleted && 'bg-primary text-primary-foreground ring-2 ring-primary/20',
                        !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                      )}>
                        {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                      </div>
                      <span className={cn(
                        'text-xs font-medium text-center truncate w-full px-1',
                        isActive && 'text-primary font-semibold',
                        isCompleted && 'text-green-600',
                        !isActive && !isCompleted && 'text-muted-foreground'
                      )}>
                        {step.title}
                      </span>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={cn(
                        'h-0.5 flex-1 max-w-[20px] rounded-full transition-all',
                        currentStep > step.number ? 'bg-green-600' : 'bg-muted'
                      )} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Desktop: Full Layout */}
          <div className="hidden md:flex items-center justify-between w-full">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center gap-3 min-w-[100px]">
                    <div className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm',
                      isCompleted && 'bg-green-600 text-white',
                      isActive && !isCompleted && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                      !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                    )}>
                      {isCompleted ? <Check size={24} /> : <Icon size={24} />}
                    </div>
                    <span className={cn(
                      'text-sm font-medium text-center whitespace-nowrap',
                      isActive && 'text-primary font-semibold',
                      isCompleted && 'text-green-600',
                      !isActive && !isCompleted && 'text-muted-foreground'
                    )}>
                      {step.title}
                    </span>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'h-1 flex-1 mx-4 rounded-full transition-all',
                      currentStep > step.number ? 'bg-green-600' : 'bg-muted'
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Step 1: Informações Básicas */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Informações da Dívida</h2>
                  <p className="text-muted-foreground">
                    Defina o tipo e quem está envolvido na dívida
                  </p>
                </div>

                {/* Toggle Tipo de Dívida */}
                <Card className="bg-muted/50 border-2">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-semibold">Tipo de Dívida</Label>
                          <p className="text-sm text-muted-foreground">
                            Selecione o tipo de dívida que você está registrando
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'text-sm font-medium transition-colors',
                            !isPersonalDebt && 'text-primary font-bold'
                          )}>
                            Alguém me deve
                          </span>
                          <Switch
                            checked={isPersonalDebt}
                            onCheckedChange={setIsPersonalDebt}
                          />
                          <span className={cn(
                            'text-sm font-medium transition-colors',
                            isPersonalDebt && 'text-primary font-bold'
                          )}>
                            Eu devo
                          </span>
                        </div>
                      </div>
                      
                      {/* Sub-opções quando "Eu devo" está ativado */}
                      {isPersonalDebt && (
                        <div className="space-y-3 pt-3 border-t">
                          <Label className="text-sm font-medium">Você deve para:</Label>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={isPersonalDebtForMyself}
                                onChange={() => setIsPersonalDebtForMyself(true)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Mim mesmo</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                checked={!isPersonalDebtForMyself}
                                onChange={() => setIsPersonalDebtForMyself(false)}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Outra pessoa</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Explicação clara */}
                      <Alert className={cn(
                        'border-2',
                        isPersonalDebt 
                          ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-700' 
                          : 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700'
                      )}>
                        <Info className={cn(
                          'h-4 w-4',
                          isPersonalDebt ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300'
                        )} />
                        <AlertTitle className={cn(
                          isPersonalDebt ? 'text-orange-900 dark:text-orange-100' : 'text-blue-900 dark:text-blue-100'
                        )}>
                          {isPersonalDebt 
                            ? (isPersonalDebtForMyself 
                              ? '📝 Dívida Pessoal (Para Mim Mesmo)' 
                              : '📝 Dívida Pessoal (Eu devo para outra pessoa)')
                            : '💰 Dívida de Terceiro (Alguém deve para você)'}
                        </AlertTitle>
                        <AlertDescription className={cn(
                          'mt-2',
                          isPersonalDebt ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200'
                        )}>
                          {isPersonalDebt ? (
                            isPersonalDebtForMyself ? (
                              <>
                                <p className="font-semibold mb-1">Dívida para você mesmo.</p>
                                <p className="text-sm">
                                  Você é o <strong>devedor</strong> e também o <strong>credor</strong> (o mesmo email será usado).
                                  Esta dívida aparecerá na sua lista de dívidas pessoais.
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold mb-1">Você deve para outra pessoa.</p>
                                <p className="text-sm">
                                  Você é o <strong>devedor</strong>. Precisará informar o <strong>credor</strong> (quem vai receber).
                                  Esta dívida aparecerá na sua lista de dívidas pessoais.
                                </p>
                              </>
                            )
                          ) : (
                            <>
                              <p className="font-semibold mb-1">Alguém deve para você.</p>
                              <p className="text-sm">
                                Você é o <strong>credor</strong> (quem vai receber) e precisará informar o <strong>devedor</strong> (quem deve).
                                Esta dívida aparecerá na sua lista de cobranças a receber.
                              </p>
                            </>
                          )}
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {!isPersonalDebt ? (
                    // Dívida de terceiro - campos normais
                    <>
                      <div>
                        <Label htmlFor="debtorEmail">Email do Devedor *</Label>
                        <Input 
                          id="debtorEmail"
                          {...register('debtorEmail', { 
                            required: 'Email é obrigatório',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Email inválido'
                            }
                          })} 
                          type="email" 
                          placeholder="exemplo@email.com"
                        />
                        {errors.debtorEmail && (
                          <p className="text-sm text-destructive mt-1">{errors.debtorEmail.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="debtorName">Nome do Devedor (opcional)</Label>
                        <Input 
                          id="debtorName"
                          {...register('debtorName')} 
                          placeholder="João Silva"
                        />
                      </div>
                    </>
                  ) : (
                    // Dívida pessoal
                    <>
                      {isPersonalDebtForMyself ? (
                        // Para mim mesmo
                        <>
                          <Alert className="bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-300 dark:border-blue-700">
                            <Info className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                            <AlertTitle className="text-blue-900 dark:text-blue-100">
                              Dívida Pessoal - Para Mim Mesmo
                            </AlertTitle>
                            <AlertDescription className="text-blue-800 dark:text-blue-200 mt-2">
                              <p className="text-sm">
                                Você é o devedor e também o credor (o mesmo email será usado).
                                Seu email: <strong>{user?.email}</strong>
                              </p>
                            </AlertDescription>
                          </Alert>
                          
                          {/* Campos ocultos */}
                          <input type="hidden" {...register('creditorEmail')} value={user?.email || ''} />
                          <input type="hidden" {...register('creditorName')} value={user?.name || ''} />
                        </>
                      ) : (
                        // Para outra pessoa
                        <>
                          <div>
                            <Label htmlFor="creditorEmail">
                              Email do Credor (para quem você deve) *
                            </Label>
                            <Input 
                              id="creditorEmail"
                              {...register('creditorEmail', { 
                                required: isPersonalDebt && !isPersonalDebtForMyself ? 'Email do credor é obrigatório' : false,
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Email inválido'
                                }
                              })} 
                              type="email" 
                              placeholder="credor@email.com"
                            />
                            {errors.creditorEmail && (
                              <p className="text-sm text-destructive mt-1">{errors.creditorEmail.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="creditorName">Nome do Credor (opcional)</Label>
                            <Input 
                              id="creditorName"
                              {...register('creditorName')} 
                              placeholder="Banco XYZ, João Silva..."
                            />
                          </div>
                        </>
                      )}
                      
                      {/* Campos ocultos para devedor (sempre você) */}
                      <input type="hidden" {...register('debtorEmail')} value={user?.email || ''} />
                      <input type="hidden" {...register('debtorName')} value={user?.name || ''} />
                    </>
                  )}

                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea 
                      id="description"
                      {...register('description')} 
                      rows={3}
                      placeholder="Ex: Empréstimo pessoal, Parcela do carro..."
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Descreva brevemente o motivo da dívida
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Valores e Pagamento */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Quanto e quando pagar?</h2>
                  <p className="text-muted-foreground">
                    Defina o valor total e forma de pagamento
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="totalAmount">Valor Total *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input
                        id="totalAmount"
                        {...register('totalAmount', { 
                          required: 'Valor é obrigatório',
                          min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                        })}
                        type="number"
                        step="0.01"
                        className="pl-12"
                        placeholder="1.000,00"
                      />
                    </div>
                    {errors.totalAmount && (
                      <p className="text-sm text-destructive mt-1">{errors.totalAmount.message}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="installments">Número de Parcelas</Label>
                      <div className="flex gap-2">
                        {!useCustomInstallments ? (
                          <Select
                            value={String(installments || 1)}
                            onValueChange={(value) => {
                              if (value === 'custom') {
                                setUseCustomInstallments(true);
                                setValue('installments', 1);
                              } else {
                                setValue('installments', parseInt(value));
                              }
                            }}
                          >
                            <SelectTrigger id="installments" className="flex-1">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">À vista (1x)</SelectItem>
                              <SelectItem value="2">2x</SelectItem>
                              <SelectItem value="3">3x</SelectItem>
                              <SelectItem value="4">4x</SelectItem>
                              <SelectItem value="5">5x</SelectItem>
                              <SelectItem value="6">6x</SelectItem>
                              <SelectItem value="12">12x</SelectItem>
                              <SelectItem value="custom">Personalizar</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <>
                            <Input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Ex: 24"
                              value={installments || 1}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                setValue('installments', Math.min(Math.max(value, 1), 120));
                              }}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setUseCustomInstallments(false);
                                setValue('installments', 1);
                              }}
                            >
                              Voltar
                            </Button>
                          </>
                        )}
                      </div>
                      {installments > 1 && totalAmount && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {Number(installments)}x de R$ {(Number(totalAmount) / Number(installments)).toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="dueDate">Primeiro Vencimento</Label>
                      <Input 
                        id="dueDate"
                        {...register('dueDate')} 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  {/* Configurações Avançadas (Opcional) */}
                  <div className="border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="addInterest"
                        checked={addInterest}
                        onCheckedChange={(checked) => setValue('addInterest', checked)}
                      />
                      <Label htmlFor="addInterest" className="font-medium cursor-pointer">
                        Adicionar juros e multa por atraso?
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Valores serão calculados automaticamente em caso de atraso
                    </p>

                    {addInterest && (
                      <div className="grid md:grid-cols-2 gap-4 mt-4 animate-fade-in">
                        <div>
                          <Label htmlFor="interestRate" className="text-sm">Juros ao mês (%)</Label>
                          <Input 
                            id="interestRate"
                            {...register('interestRate')} 
                            type="number" 
                            step="0.1" 
                            placeholder="2.0"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Padrão: 2% ao mês</p>
                        </div>
                        <div>
                          <Label htmlFor="penaltyRate" className="text-sm">Multa por atraso (%)</Label>
                          <Input 
                            id="penaltyRate"
                            {...register('penaltyRate')} 
                            type="number" 
                            step="0.1" 
                            placeholder="5.0"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Padrão: 5% fixo</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmação */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Confirmação e Pagamento</h2>
                  <p className="text-muted-foreground">
                    Revise os dados e escolha a forma de pagamento
                  </p>
                </div>

                {/* Preview */}
                <Card className="bg-muted/50">
                  <CardContent className="pt-6 space-y-3">
                    <h3 className="font-bold text-lg mb-3">Resumo da Dívida</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="font-medium">
                          {isPersonalDebt ? 'Dívida Pessoal' : 'Dívida de Terceiro'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Devedor:</span>
                        <span className="font-medium">
                          {isPersonalDebt ? user?.email : watch('debtorEmail')}
                        </span>
                      </div>
                      {isPersonalDebt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Credor:</span>
                          <span className="font-medium">
                            {user?.email || 'Você mesmo'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Total:</span>
                        <span className="font-bold text-lg">
                          R$ {parseFloat(String(watch('totalAmount') || '0')).toFixed(2)}
                        </span>
                      </div>
                      {installments > 1 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Parcelas:</span>
                          <span className="font-medium">
                            {Number(installments)}x de R$ {(parseFloat(String(watch('totalAmount') || '0')) / Number(installments)).toFixed(2)}
                          </span>
                        </div>
                      )}
                      {watch('dueDate') && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vencimento:</span>
                          <span className="font-medium">
                            {new Date(watch('dueDate')).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base">Forma de Pagamento</Label>
                    <Card className={cn(
                      'cursor-pointer transition-all hover:border-primary',
                      useGateway && 'border-primary'
                    )}>
                      <CardContent className="pt-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            value="true"
                            {...register('useGateway')}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">Pagamento Online (Recomendado)</div>
                            <p className="text-sm text-muted-foreground">
                              O devedor receberá um link para pagar com cartão, PIX ou boleto
                            </p>
                          </div>
                        </label>
                      </CardContent>
                    </Card>

                    <Card className={cn(
                      'cursor-pointer transition-all hover:border-primary',
                      !useGateway && 'border-primary'
                    )}>
                      <CardContent className="pt-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            value="false"
                            {...register('useGateway')}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">Apenas Registrar</div>
                            <p className="text-sm text-muted-foreground">
                              Registrar a dívida sem processar pagamento automático
                            </p>
                          </div>
                        </label>
                      </CardContent>
                    </Card>
                  </div>

                  {useGateway && (
                    <div className="animate-fade-in space-y-3">
                      <Label className="text-base">Gateway de Pagamento</Label>
                      <Card className="border-primary">
                        <CardContent className="pt-6">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="radio" 
                              value="MERCADOPAGO"
                              {...register('preferredGateway')}
                              defaultChecked
                            />
                            <div>
                              <div className="font-semibold">Mercado Pago</div>
                              <p className="text-xs text-muted-foreground">PIX, Cartão e Boleto</p>
                            </div>
                          </label>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {!useGateway && (
                    <div className="animate-fade-in space-y-3">
                      <Label className="text-base">Chave PIX para Recebimento *</Label>
                      <Select
                        value={selectedPixKeyId || ''}
                        onValueChange={(value) => {
                          if (value === 'new') {
                            setShowNewPixKeyForm(true);
                            setSelectedPixKeyId('new');
                          } else {
                            setShowNewPixKeyForm(false);
                            setSelectedPixKeyId(value);
                            setValue('pixKeyId', value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione ou crie uma chave PIX" />
                        </SelectTrigger>
                        <SelectContent>
                          {pixKeys?.filter(key => !key.isThirdParty).map((key: PixKey) => (
                            <SelectItem key={key.id} value={key.id}>
                              {key.label} - {key.keyValue.substring(0, 20)}...
                            </SelectItem>
                          ))}
                          <SelectItem value="new">+ Criar nova chave PIX</SelectItem>
                        </SelectContent>
                      </Select>

                      {showNewPixKeyForm && (
                        <Card className="bg-muted/50 p-4 space-y-3">
                          <Label className="text-sm font-medium">Nova Chave PIX</Label>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="pixKeyType" className="text-xs">Tipo *</Label>
                              <Select
                                value={watch('pixKeyType') || ''}
                                onValueChange={(value: any) => setValue('pixKeyType' as any, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="CPF">CPF</SelectItem>
                                  <SelectItem value="EMAIL">E-mail</SelectItem>
                                  <SelectItem value="PHONE">Telefone</SelectItem>
                                  <SelectItem value="RANDOM">Chave Aleatória</SelectItem>
                                </SelectContent>
                              </Select>
                              {!watch('pixKeyType') && showNewPixKeyForm && (
                                <p className="text-xs text-destructive mt-1">Selecione o tipo de chave</p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="pixKeyValue" className="text-xs">Valor da Chave *</Label>
                              <Input
                                id="pixKeyValue"
                                {...register('pixKeyValue' as any, { 
                                  required: showNewPixKeyForm && !useGateway ? 'Valor da chave é obrigatório' : false 
                                })}
                                placeholder="Digite a chave PIX"
                              />
                              {errors.pixKeyValue && (
                                <p className="text-xs text-destructive mt-1">{errors.pixKeyValue.message}</p>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="pixKeyLabel" className="text-xs">Nome/Apelido (Opcional)</Label>
                              <Input
                                id="pixKeyLabel"
                                {...register('pixKeyLabel' as any)}
                                placeholder="Ex: PIX Principal"
                              />
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Voltar
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    nextStep();
                  }}
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(onSubmit)(e);
                  }}
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

