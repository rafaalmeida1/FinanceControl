import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, User, CreditCard, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authStore } from '@/stores/authStore';
import { useDebts } from '@/hooks/useDebts';
import { Card, CardContent } from '@/components/ui/card';
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
import { HelpDialog, HelpStep } from '@/components/help/HelpDialog';
import { HelpIconButton } from '@/components/help/HelpIconButton';

interface MercadoPagoDebtFormData {
  // Passo 1: Informações Básicas
  debtorEmail: string;
  debtorName: string;
  creditorEmail: string;
  creditorName: string;
  description: string;
  
  // Passo 2: Tipo de Pagamento
  paymentType: 'INSTALLMENT' | 'SINGLE_PIX' | 'RECURRING_PIX' | 'RECURRING_CARD';
  
  // Valores
  totalAmount: number | string;
  installments?: number;
  dueDate: string;
  
  // Configuração de parcelas
  installmentInterval?: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY';
  
  // Configuração de assinatura
  subscriptionName?: string;
  durationMonths?: number | null;
  
  // Dívida pessoal
  isPersonalDebt?: boolean;
}

export default function CreateMercadoPagoDebt() {
  const navigate = useNavigate();
  const { createDebt, isCreatingDebt } = useDebts();
  const { user } = authStore();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MercadoPagoDebtFormData>({
    defaultValues: {
      installments: 1,
      paymentType: 'INSTALLMENT',
      installmentInterval: 'MONTHLY',
    }
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isPersonalDebt, setIsPersonalDebt] = useState(false);
  const [isPersonalDebtForMyself, setIsPersonalDebtForMyself] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const totalSteps = 3;

  const paymentType = watch('paymentType');
  const totalAmount = watch('totalAmount');
  const installments = watch('installments') || 1;

  // Passos do walkthrough de ajuda
  const helpSteps: HelpStep[] = [
    {
      title: 'Informações Básicas',
      content: 'Preencha os dados do devedor e credor, além de uma descrição clara da dívida.',
    },
    {
      title: 'Tipo de Pagamento',
      content: 'Escolha o tipo de pagamento:\n\n• Parcelado: pagamento em múltiplas parcelas\n• PIX Único: pagamento único via PIX\n• Assinatura PIX: cobrança mensal via PIX\n• Assinatura Cartão: cobrança mensal no cartão',
    },
    {
      title: 'Revisão',
      content: 'Revise todas as informações antes de criar a dívida. Você poderá enviar o link de pagamento por email.',
    },
  ];

  const steps = [
    { number: 1, label: 'Informações', icon: User },
    { number: 2, label: 'Pagamento', icon: CreditCard },
    { number: 3, label: 'Revisão', icon: Check },
  ];

  const onSubmit = async (data: MercadoPagoDebtFormData) => {
    // Validar descrição
    if (!data.description || data.description.trim() === '') {
      toast.error('A descrição é obrigatória');
      return;
    }

    // Converter data
    let dueDate: string | undefined = undefined;
    if (data.dueDate) {
      try {
        const [year, month, day] = String(data.dueDate).split('-');
        const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59));
        dueDate = date.toISOString();
      } catch (error) {
        toast.error('Data inválida');
        return;
      }
    }

    // Preparar dados para envio
    let finalCreditorEmail: string | undefined;
    let finalCreditorName: string | undefined;
    let finalDebtorEmail: string;
    let finalDebtorName: string | undefined;

    if (isPersonalDebt) {
      finalDebtorEmail = user?.email || '';
      finalDebtorName = user?.name || undefined;
      finalCreditorEmail = isPersonalDebtForMyself 
        ? user?.email 
        : (data.creditorEmail || undefined);
      finalCreditorName = isPersonalDebtForMyself
        ? user?.name || undefined
        : (data.creditorName || undefined);
    } else {
      if (!data.debtorEmail) {
        toast.error('Email do devedor é obrigatório');
        return;
      }
      finalDebtorEmail = data.debtorEmail;
      finalDebtorName = data.debtorName || undefined;
      finalCreditorEmail = user?.email;
      finalCreditorName = user?.name || undefined;
    }

    // Preparar payload
    const payload: any = {
      debtorEmail: finalDebtorEmail,
      debtorName: finalDebtorName,
      creditorEmail: finalCreditorEmail,
      creditorName: finalCreditorName,
      description: data.description.trim(),
      totalAmount: Number(data.totalAmount),
      dueDate,
      useGateway: true,
      preferredGateway: 'MERCADOPAGO',
      mercadoPagoPaymentType: data.paymentType,
      isPersonalDebt,
    };

    // Adicionar configurações específicas por tipo
    if (data.paymentType === 'INSTALLMENT') {
      payload.installments = data.installments || 1;
      payload.installmentConfig = {
        interval: data.installmentInterval || 'MONTHLY',
        intervalCount: 1,
      };
    } else if (data.paymentType === 'RECURRING_PIX' || data.paymentType === 'RECURRING_CARD') {
      payload.recurringConfig = {
        subscriptionName: data.subscriptionName || `${data.description} - ${finalDebtorName || finalDebtorEmail}`,
        durationMonths: data.durationMonths || null,
      };
    }

    try {
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
      toast.error(error?.message || 'Erro ao criar dívida');
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <HelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="Como criar uma dívida com Mercado Pago"
        description="Aprenda passo a passo como criar uma dívida com pagamento automático"
        steps={helpSteps}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/debts/create')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nova Dívida - Mercado Pago</h1>
          <p className="text-sm md:text-base text-muted-foreground">Preencha as informações em {totalSteps} etapas</p>
        </div>
        <HelpIconButton onClick={() => setHelpOpen(true)} />
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-4 md:p-6">
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
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={cn(
                        'h-0.5 flex-1 min-w-[20px] transition-colors',
                        isCompleted ? 'bg-green-600' : 'bg-muted'
                      )} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <div className="hidden md:flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm',
                      isCompleted && 'bg-green-600 text-white',
                      isActive && !isCompleted && 'bg-primary text-primary-foreground ring-2 ring-primary/20',
                      !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                    )}>
                      {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                    </div>
                    <div>
                      <div className={cn(
                        'text-sm font-medium',
                        isActive && 'text-primary font-semibold',
                        isCompleted && 'text-green-600',
                        !isActive && !isCompleted && 'text-muted-foreground'
                      )}>
                        {step.label}
                      </div>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'h-0.5 flex-1 mx-4 transition-colors',
                      isCompleted ? 'bg-green-600' : 'bg-muted'
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
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Passo 1: Informações Básicas */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Tipo de Dívida</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary',
                        !isPersonalDebt && 'border-primary'
                      )}
                      >
                        <CardContent className="pt-6" onClick={() => setIsPersonalDebt(false)}>
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              checked={!isPersonalDebt}
                              onChange={() => setIsPersonalDebt(false)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="font-semibold">Alguém me deve</div>
                              <p className="text-sm text-muted-foreground">
                                Você está cobrando uma dívida de outra pessoa
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary',
                        isPersonalDebt && 'border-primary'
                      )}
                    >
                      <CardContent className="pt-6" onClick={() => setIsPersonalDebt(true)}>
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={isPersonalDebt}
                            onChange={() => setIsPersonalDebt(true)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">Eu devo</div>
                            <p className="text-sm text-muted-foreground">
                              Você está registrando uma dívida que você tem
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {!isPersonalDebt ? (
                    <>
                      <div>
                        <Label htmlFor="debtorEmail">Email do Devedor *</Label>
                        <Input
                          id="debtorEmail"
                          type="email"
                          {...register('debtorEmail', { required: 'Email do devedor é obrigatório' })}
                          placeholder="devedor@example.com"
                        />
                        {errors.debtorEmail && (
                          <p className="text-sm text-destructive mt-1">{errors.debtorEmail.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="debtorName">Nome do Devedor</Label>
                        <Input
                          id="debtorName"
                          {...register('debtorName')}
                          placeholder="João Silva"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label>Para quem você deve?</Label>
                        <div className="space-y-2 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={isPersonalDebtForMyself}
                              onChange={() => setIsPersonalDebtForMyself(true)}
                            />
                            <span>Para mim mesmo</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={!isPersonalDebtForMyself}
                              onChange={() => setIsPersonalDebtForMyself(false)}
                            />
                            <span>Para outra pessoa</span>
                          </label>
                        </div>
                      </div>
                      {!isPersonalDebtForMyself && (
                        <>
                          <div>
                            <Label htmlFor="creditorEmail">Email do Credor *</Label>
                            <Input
                              id="creditorEmail"
                              type="email"
                              {...register('creditorEmail', { required: !isPersonalDebtForMyself ? 'Email do credor é obrigatório' : false })}
                              placeholder="credor@example.com"
                            />
                            {errors.creditorEmail && (
                              <p className="text-sm text-destructive mt-1">{errors.creditorEmail.message}</p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="creditorName">Nome do Credor</Label>
                            <Input
                              id="creditorName"
                              {...register('creditorName')}
                              placeholder="Banco XYZ"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Descrição da Dívida *</Label>
                  <Textarea
                    id="description"
                    {...register('description', {
                      required: 'Descrição é obrigatória',
                      minLength: { value: 3, message: 'Descrição deve ter pelo menos 3 caracteres' },
                      maxLength: { value: 2000, message: 'Descrição deve ter no máximo 2000 caracteres' },
                    })}
                    placeholder="Ex: Empréstimo pessoal, Mensalidade academia, etc."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Passo 2: Tipo de Pagamento */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Tipo de Pagamento</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary',
                        paymentType === 'INSTALLMENT' && 'border-primary ring-2 ring-primary/20'
                      )}
                      onClick={() => setValue('paymentType', 'INSTALLMENT')}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={paymentType === 'INSTALLMENT'}
                            onChange={() => setValue('paymentType', 'INSTALLMENT')}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">Pagamento Parcelado</div>
                            <p className="text-sm text-muted-foreground">
                              Divida o valor em múltiplas parcelas com vencimentos mensais
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary',
                        paymentType === 'SINGLE_PIX' && 'border-primary ring-2 ring-primary/20'
                      )}
                      onClick={() => setValue('paymentType', 'SINGLE_PIX')}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={paymentType === 'SINGLE_PIX'}
                            onChange={() => setValue('paymentType', 'SINGLE_PIX')}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">PIX Único</div>
                            <p className="text-sm text-muted-foreground">
                              Pagamento único via PIX com QR Code
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary',
                        paymentType === 'RECURRING_PIX' && 'border-primary ring-2 ring-primary/20'
                      )}
                      onClick={() => setValue('paymentType', 'RECURRING_PIX')}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={paymentType === 'RECURRING_PIX'}
                            onChange={() => setValue('paymentType', 'RECURRING_PIX')}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">Assinatura PIX</div>
                            <p className="text-sm text-muted-foreground">
                              Cobrança mensal recorrente via PIX
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary',
                        paymentType === 'RECURRING_CARD' && 'border-primary ring-2 ring-primary/20'
                      )}
                      onClick={() => setValue('paymentType', 'RECURRING_CARD')}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={paymentType === 'RECURRING_CARD'}
                            onChange={() => setValue('paymentType', 'RECURRING_CARD')}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold">Assinatura Cartão</div>
                            <p className="text-sm text-muted-foreground">
                              Cobrança mensal recorrente no cartão de crédito
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalAmount">Valor Total *</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...register('totalAmount', {
                        required: 'Valor é obrigatório',
                        min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                      })}
                      placeholder="0.00"
                    />
                    {errors.totalAmount && (
                      <p className="text-sm text-destructive mt-1">{errors.totalAmount.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Data de Vencimento *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      {...register('dueDate', { required: 'Data de vencimento é obrigatória' })}
                    />
                    {errors.dueDate && (
                      <p className="text-sm text-destructive mt-1">{errors.dueDate.message}</p>
                    )}
                  </div>
                </div>

                {paymentType === 'INSTALLMENT' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="installments">Número de Parcelas *</Label>
                      <Input
                        id="installments"
                        type="number"
                        min="2"
                        max="120"
                        {...register('installments', {
                          required: 'Número de parcelas é obrigatório',
                          min: { value: 2, message: 'Mínimo de 2 parcelas' },
                        })}
                        placeholder="Ex: 12"
                      />
                      {errors.installments && (
                        <p className="text-sm text-destructive mt-1">{errors.installments.message}</p>
                      )}
                      {totalAmount && installments > 1 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {installments}x de R$ {(Number(totalAmount) / installments).toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="installmentInterval">Intervalo entre Parcelas</Label>
                      <Select
                        value={watch('installmentInterval') || 'MONTHLY'}
                        onValueChange={(value) => setValue('installmentInterval', value as any)}
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
                  </div>
                )}

                {(paymentType === 'RECURRING_PIX' || paymentType === 'RECURRING_CARD') && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="subscriptionName">Nome da Assinatura *</Label>
                      <Input
                        id="subscriptionName"
                        {...register('subscriptionName', {
                          required: 'Nome da assinatura é obrigatório',
                        })}
                        placeholder="Ex: Mensalidade Academia - João"
                      />
                      {errors.subscriptionName && (
                        <p className="text-sm text-destructive mt-1">{errors.subscriptionName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="durationMonths">Duração (meses)</Label>
                      <Input
                        id="durationMonths"
                        type="number"
                        min="1"
                        {...register('durationMonths', {
                          valueAsNumber: true,
                        })}
                        placeholder="Deixe vazio para indefinida"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Deixe vazio para assinatura indefinida (até cancelamento)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Passo 3: Revisão */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-semibold mb-4">Revisão</h2>
                
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Tipo</Label>
                      <p className="font-medium">{isPersonalDebt ? 'Eu devo' : 'Alguém me deve'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Devedor</Label>
                      <p className="font-medium">
                        {isPersonalDebt 
                          ? (user?.name || user?.email || 'Você')
                          : (watch('debtorName') || watch('debtorEmail') || 'Não informado')
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Credor</Label>
                      <p className="font-medium">
                        {isPersonalDebt
                          ? (isPersonalDebtForMyself 
                              ? (user?.name || user?.email || 'Você')
                              : (watch('creditorName') || watch('creditorEmail') || 'Não informado')
                            )
                          : (user?.name || user?.email || 'Você')
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Descrição</Label>
                      <p className="font-medium">{watch('description') || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Valor Total</Label>
                      <p className="font-medium text-lg">R$ {Number(totalAmount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tipo de Pagamento</Label>
                      <p className="font-medium">
                        {paymentType === 'INSTALLMENT' && 'Pagamento Parcelado'}
                        {paymentType === 'SINGLE_PIX' && 'PIX Único'}
                        {paymentType === 'RECURRING_PIX' && 'Assinatura PIX'}
                        {paymentType === 'RECURRING_CARD' && 'Assinatura Cartão'}
                      </p>
                    </div>
                    {paymentType === 'INSTALLMENT' && (
                      <div>
                        <Label className="text-muted-foreground">Parcelas</Label>
                        <p className="font-medium">
                          {installments}x de R$ {(Number(totalAmount || 0) / installments).toFixed(2)}
                        </p>
                      </div>
                    )}
                    {watch('dueDate') && (
                      <div>
                        <Label className="text-muted-foreground">Vencimento</Label>
                        <p className="font-medium">
                          {new Date(watch('dueDate')).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isCreatingDebt}>
                  {isCreatingDebt ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
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

