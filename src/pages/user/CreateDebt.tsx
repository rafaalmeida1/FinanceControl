import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { HelpDialog, HelpStep } from '@/components/help/HelpDialog';
import { HelpIconButton } from '@/components/help/HelpIconButton';
import { EmailAutocomplete } from '@/components/ui/email-autocomplete';

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
  
  // Dívida em andamento
  isInProgress?: boolean;
  installmentAmount?: number | string;
  totalInstallments?: number;
  paidInstallments?: number;
  
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
  pixKeyIsThirdParty?: boolean;
  pixKeyContactEmail?: string;
  pixKeyContactName?: string;
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
  
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'mercadopago' | null>(null); // null = não selecionado ainda
  const [currentStep, setCurrentStep] = useState(1);
  const [isPersonalDebt, setIsPersonalDebt] = useState(false);
  const [isPersonalDebtForMyself, setIsPersonalDebtForMyself] = useState(true); // true = para mim mesmo, false = para outra pessoa
  const [selectedPixKeyId, setSelectedPixKeyId] = useState<string | 'new' | null>(null);
  const [showNewPixKeyForm, setShowNewPixKeyForm] = useState(false);
  const [useCustomInstallments, setUseCustomInstallments] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const totalSteps = 3;

  // Passos do walkthrough de ajuda
  const helpSteps: HelpStep[] = [
    {
      title: 'Tipo de Dívida',
      content: 'Primeiro, escolha o tipo de dívida:\n\n• "Alguém me deve": quando outra pessoa deve dinheiro para você\n• "Eu devo": quando você deve dinheiro para alguém\n\nPara dívidas pessoais, você pode escolher se é para você mesmo ou para outra pessoa.',
    },
    {
      title: 'Informações Básicas',
      content: 'Preencha os dados:\n\n• Email e nome do devedor/credor\n• Descrição da dívida (obrigatória - será enviada no email)\n\nA descrição ajuda a identificar a dívida e é importante para comunicação.',
    },
    {
      title: 'Dívida em Andamento',
      content: 'Se a dívida já começou e algumas parcelas foram pagas:\n\n• Ative "Dívida já em andamento?"\n• Informe o valor de cada parcela\n• Total de parcelas\n• Parcelas já pagas\n\nO sistema calculará automaticamente o valor total restante e as parcelas que faltam.',
    },
    {
      title: 'Valor e Parcelas',
      content: 'Para dívidas novas:\n\n• Informe o valor total\n• Número de parcelas\n• Data do primeiro vencimento\n\nPara dívidas em andamento, o sistema calcula automaticamente baseado nas informações fornecidas.',
    },
    {
      title: 'Juros e Multa',
      content: 'Você pode configurar:\n\n• Juros ao mês (%): aplicado apenas em caso de atraso\n• Multa por atraso (%): aplicada quando houver atraso no pagamento\n\nEsses valores são calculados automaticamente quando necessário.',
    },
    {
      title: 'Forma de Pagamento',
      content: 'Escolha como criar sua dívida:\n\n• Pagamento por Mercado Pago: crie cobranças automáticas com links, QR Code PIX, parcelamento ou assinaturas. Ideal para receber de terceiros ou pagar suas próprias dívidas.\n• Pagamento por PIX: registre a dívida e envie a chave PIX para pagamento manual. Ideal para dívidas de terceiros com você (receber) ou suas próprias dívidas (pagar).\n\nSe escolher PIX, você precisará informar uma chave PIX para recebimento ou pagamento.',
    },
  ];

  // Buscar chaves PIX
  const queryClient = useQueryClient();
  const { data: pixKeys } = useQuery({
    queryKey: ['pixKeys'],
    queryFn: () => pixKeysService.getAll(),
  });

  // Watch values for conditional rendering
  // Converter useGateway para boolean (vem como string do radio)
  const useGatewayValue = watch('useGateway');
  const useGateway = useGatewayValue === true || useGatewayValue === 'true';
  const addInterest = watch('addInterest');
  const installments = watch('installments');
  const totalAmount = watch('totalAmount');
  const installmentAmount = watch('installmentAmount');
  const totalInstallments = watch('totalInstallments');
  const paidInstallments = watch('paidInstallments');

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Mutation para criar chave PIX
  const createPixKeyMutation = useMutation({
    mutationFn: async (data: {
      keyType: string;
      keyValue: string;
      label?: string;
      isThirdParty?: boolean;
      contactEmail?: string;
      contactName?: string;
    }) => {
      return pixKeysService.create({
        keyType: data.keyType as 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM',
        keyValue: data.keyValue,
        label: data.label,
        isThirdParty: data.isThirdParty || false,
        contactEmail: data.contactEmail,
        contactName: data.contactName,
      });
    },
    onSuccess: (newPixKey) => {
      queryClient.invalidateQueries({ queryKey: ['pixKeys'] });
      setSelectedPixKeyId(newPixKey.id);
      setShowNewPixKeyForm(false);
      setValue('pixKeyId', newPixKey.id);
      toast.success('Chave PIX salva com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar chave PIX');
    },
  });

  const handleSavePixKey = async () => {
    const pixKeyType = watch('pixKeyType');
    const pixKeyValue = watch('pixKeyValue');
    const pixKeyLabel = watch('pixKeyLabel');
    const pixKeyIsThirdParty = watch('pixKeyIsThirdParty');
    const pixKeyContactEmail = watch('pixKeyContactEmail');
    const pixKeyContactName = watch('pixKeyContactName');

    if (!pixKeyType || !pixKeyValue) {
      toast.error('Preencha o tipo e o valor da chave PIX');
      return;
    }

    createPixKeyMutation.mutate({
      keyType: pixKeyType,
      keyValue: pixKeyValue,
      label: pixKeyLabel || undefined,
      isThirdParty: pixKeyIsThirdParty || false,
      contactEmail: pixKeyContactEmail || undefined,
      contactName: pixKeyContactName || undefined,
    });
  };

  // Inicializar pixKeyType quando mostrar o form
  useEffect(() => {
    if (showNewPixKeyForm && !watch('pixKeyType')) {
      setValue('pixKeyType' as any, 'CPF');
    }
  }, [showNewPixKeyForm, watch, setValue]);

  const onSubmit = (data: DebtFormData) => {
    // Validar descrição
    if (!data.description || data.description.trim() === '') {
      toast.error('A descrição é obrigatória');
      return;
    }
    if (data.description.trim().length > 2000) {
      toast.error('A descrição deve ter no máximo 2000 caracteres');
      return;
    }
    if (data.description.trim().length < 3) {
      toast.error('A descrição deve ter pelo menos 3 caracteres');
      return;
    }
    
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
    // Se paymentMethod é 'pix', sempre usar PIX manual (não gateway)
    const shouldUseGateway = paymentMethod === 'pix' ? false : (data.useGateway === true || data.useGateway === 'true');
    
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
    
    // Validar dívida em andamento
    if (isInProgress) {
      if (!data.installmentAmount || !data.totalInstallments || data.paidInstallments === undefined) {
        toast.error('Preencha todos os campos da dívida em andamento');
        return;
      }
      if (data.paidInstallments >= data.totalInstallments) {
        toast.error('Parcelas pagas deve ser menor que total de parcelas');
        return;
      }
    }
    
    createDebt(
      {
        debtorEmail: finalDebtorEmail,
        debtorName: finalDebtorName,
        creditorEmail: finalCreditorEmail,
        creditorName: finalCreditorName,
        description: data.description.trim(),
        totalAmount: parseFloat(data.totalAmount as any),
        installments: parseInt(data.installments as any) || 1,
        dueDate,
        interestRate: data.addInterest && data.interestRate ? parseFloat(data.interestRate as any) : undefined,
        penaltyRate: data.addInterest && data.penaltyRate ? parseFloat(data.penaltyRate as any) : undefined,
        useGateway: shouldUseGateway,
        preferredGateway: shouldUseGateway ? data.preferredGateway : undefined,
        isPersonalDebt,
        isInProgress: isInProgress || undefined,
        installmentAmount: isInProgress && data.installmentAmount ? parseFloat(data.installmentAmount as any) : undefined,
        totalInstallments: isInProgress && data.totalInstallments ? parseInt(data.totalInstallments as any) : undefined,
        paidInstallments: isInProgress && data.paidInstallments !== undefined ? parseInt(data.paidInstallments as any) : undefined,
        pixKeyId: selectedPixKeyId && selectedPixKeyId !== 'new' ? selectedPixKeyId : undefined,
        pixKeyValue: showNewPixKeyForm && data.pixKeyValue ? data.pixKeyValue : undefined,
        pixKeyType: showNewPixKeyForm && data.pixKeyType ? data.pixKeyType : undefined,
        pixKeyLabel: showNewPixKeyForm && data.pixKeyLabel ? data.pixKeyLabel : undefined,
        pixKeyIsThirdParty: showNewPixKeyForm && isPersonalDebt ? (data.pixKeyIsThirdParty || false) : undefined,
        pixKeyContactEmail: showNewPixKeyForm && data.pixKeyIsThirdParty && data.pixKeyContactEmail ? data.pixKeyContactEmail : undefined,
        pixKeyContactName: showNewPixKeyForm && data.pixKeyIsThirdParty && data.pixKeyContactName ? data.pixKeyContactName : undefined,
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
    { number: 1, label: 'Informações', icon: User },
    { number: 2, label: 'Valores', icon: CreditCard },
    { number: 3, label: paymentMethod === 'pix' ? 'Chave PIX' : 'Confirmação', icon: FileText },
  ];

  // Se ainda não selecionou o método de pagamento, mostrar seleção inicial
  if (paymentMethod === null) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nova Dívida</h1>
            <p className="text-sm md:text-base text-muted-foreground">Escolha como deseja criar sua dívida</p>
          </div>
        </div>

        {/* Seleção de Método de Pagamento */}
        <Card>
          <CardContent className="p-6 md:p-8">
            <h2 className="text-xl font-semibold mb-6">Como deseja criar sua dívida?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                  paymentMethod === 'pix' && 'border-primary ring-2 ring-primary/20'
                )}
                onClick={() => {
                  setPaymentMethod('pix');
                  setValue('useGateway', false);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Pagamento por PIX</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Registre a dívida e envie a chave PIX para pagamento manual. Ideal para dívidas de terceiros com você (receber) ou suas próprias dívidas (pagar).
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>✓ Registro simples e rápido</li>
                        <li>✓ Sem taxas de gateway</li>
                        <li>✓ Controle manual do pagamento</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                  paymentMethod === 'mercadopago' && 'border-primary ring-2 ring-primary/20'
                )}
                onClick={() => {
                  setPaymentMethod('mercadopago');
                  navigate('/debts/create/mercadopago');
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Pagamento por Mercado Pago</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Crie cobranças automáticas com links de pagamento, QR Code PIX, parcelamento ou assinaturas recorrentes. Ideal para receber de terceiros ou pagar suas próprias dívidas.
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>✓ Pagamento parcelado</li>
                        <li>✓ PIX único com QR Code</li>
                        <li>✓ Assinaturas recorrentes</li>
                        <li>✓ Links de pagamento automáticos</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Sistema de Ajuda */}
      <HelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="Como criar uma dívida"
        description="Aprenda passo a passo como registrar uma nova dívida"
        steps={helpSteps}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => {
          if (paymentMethod === 'pix') {
            setPaymentMethod(null);
          } else {
            navigate(-1);
          }
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Nova Dívida</h1>
          <p className="text-sm md:text-base text-muted-foreground">Preencha as informações em {totalSteps} etapas simples</p>
        </div>
        <HelpIconButton onClick={() => setHelpOpen(true)} />
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
                        {step.label}
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
                      {step.label}
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
                <Card id="help-debt-type" className="bg-muted/50 border-2">
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
                      {isPersonalDebt && (
                        <div className={cn(
                          'rounded-lg p-4 border',
                          'bg-muted/50 border-border'
                      )}>
                          <div className="flex items-start gap-3">
                            <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium text-foreground">
                                {isPersonalDebtForMyself 
                                  ? 'Dívida pessoal para você mesmo'
                                  : 'Dívida pessoal - você deve para outra pessoa'}
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {isPersonalDebtForMyself 
                                  ? `Você é o devedor e também o credor. O email ${user?.email} será usado para ambos.`
                                  : 'Você é o devedor. Informe os dados do credor abaixo.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {!isPersonalDebt ? (
                    // Dívida de terceiro - campos normais
                    <>
                      <EmailAutocomplete
                        id="debtorEmail"
                        label="Email do Devedor"
                        value={watch('debtorEmail') || ''}
                        onChange={(value) => setValue('debtorEmail', value)}
                        onBlur={() => {
                          // Trigger validation
                          const field = register('debtorEmail', { 
                            required: 'Email é obrigatório',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Email inválido'
                            }
                          });
                          field.onBlur({ target: { name: 'debtorEmail' } } as any);
                        }}
                        error={errors.debtorEmail?.message}
                        placeholder="exemplo@email.com"
                        required
                      />

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
                          {/* Campos ocultos */}
                          <input type="hidden" {...register('creditorEmail')} value={user?.email || ''} />
                          <input type="hidden" {...register('creditorName')} value={user?.name || ''} />
                        </>
                      ) : (
                        // Para outra pessoa
                        <>
                          <EmailAutocomplete
                            id="creditorEmail"
                            label="Email do Credor (para quem você deve)"
                            value={watch('creditorEmail') || ''}
                            onChange={(value) => setValue('creditorEmail', value)}
                            onBlur={() => {
                              const field = register('creditorEmail', { 
                                required: isPersonalDebt && !isPersonalDebtForMyself ? 'Email do credor é obrigatório' : false,
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Email inválido'
                                }
                              });
                              field.onBlur({ target: { name: 'creditorEmail' } } as any);
                            }}
                            error={errors.creditorEmail?.message}
                            placeholder="credor@email.com"
                            required={isPersonalDebt && !isPersonalDebtForMyself}
                          />

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

                  <div id="help-description">
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea 
                      id="description"
                      {...register('description', {
                        required: 'A descrição é obrigatória',
                        maxLength: {
                          value: 2000,
                          message: 'A descrição deve ter no máximo 2000 caracteres'
                        },
                        minLength: {
                          value: 3,
                          message: 'A descrição deve ter pelo menos 3 caracteres'
                        }
                      })} 
                      rows={3}
                      placeholder="Ex: Empréstimo pessoal, Parcela do carro..."
                      maxLength={2000}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      A descrição será enviada no email de notificação
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

                {/* Toggle para dívida em andamento */}
                <div className="border rounded-lg p-4 md:p-6 bg-muted/30">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-1">
                      <Label htmlFor="isInProgress" className="text-base font-medium cursor-pointer">
                        Dívida já em andamento?
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Marque se a dívida já começou e algumas parcelas foram pagas
                      </p>
                    </div>
                    <Switch
                      id="isInProgress"
                      checked={isInProgress}
                      onCheckedChange={(checked) => {
                        setIsInProgress(checked);
                        setValue('isInProgress', checked);
                        if (!checked) {
                          // Limpar campos quando desativar
                          setValue('installmentAmount', undefined);
                          setValue('totalInstallments', undefined);
                          setValue('paidInstallments', undefined);
                        }
                      }}
                    />
                  </div>
                </div>

                <div id="help-amount" className="space-y-4">
                  {!isInProgress ? (
                    // Dívida nova - valor total
                  <div>
                    <Label htmlFor="totalAmount">Valor Total *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                      <Input
                        id="totalAmount"
                        {...register('totalAmount', { 
                            required: !isInProgress ? 'Valor é obrigatório' : false,
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
                  ) : (
                    // Dívida em andamento - valor da parcela
                    <div className="space-y-4">
                      <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700">
                        <Info className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                        <AlertTitle className="text-blue-900 dark:text-blue-100">
                          Dívida em Andamento
                        </AlertTitle>
                        <AlertDescription className="text-blue-800 dark:text-blue-200 mt-2">
                          Informe o valor da parcela (já com juros embutidos) e quantas parcelas já foram pagas.
                          O sistema calculará automaticamente o valor total restante.
                        </AlertDescription>
                      </Alert>

                      <div>
                        <Label htmlFor="installmentAmount">Valor da Parcela (R$) *</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Valor de cada parcela já com juros embutidos
                        </p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                          <Input
                            id="installmentAmount"
                            {...register('installmentAmount', { 
                              required: isInProgress ? 'Valor da parcela é obrigatório' : false,
                              min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                            })}
                            type="number"
                            step="0.01"
                            className="pl-12"
                            placeholder="500,00"
                            onChange={(e) => {
                              setValue('installmentAmount', e.target.value);
                              // Calcular valor total em tempo real
                              if (totalInstallments && paidInstallments !== undefined) {
                                const remaining = totalInstallments - paidInstallments;
                                const calculatedTotal = Number(e.target.value) * remaining;
                                setValue('totalAmount', calculatedTotal);
                                setValue('installments', remaining);
                              }
                            }}
                          />
                        </div>
                        {errors.installmentAmount && (
                          <p className="text-sm text-destructive mt-1">{errors.installmentAmount.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="totalInstallments">Total de Parcelas *</Label>
                          <Input
                            id="totalInstallments"
                            {...register('totalInstallments', { 
                              required: isInProgress ? 'Total de parcelas é obrigatório' : false,
                              min: { value: 1, message: 'Deve ser pelo menos 1' },
                              validate: (value) => {
                                if (paidInstallments !== undefined && value && paidInstallments >= value) {
                                  return 'Parcelas pagas deve ser menor que total de parcelas';
                                }
                                return true;
                              }
                            })}
                            type="number"
                            min="1"
                            placeholder="9"
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setValue('totalInstallments', value);
                              // Calcular valor total em tempo real
                              if (installmentAmount && paidInstallments !== undefined) {
                                const remaining = value - paidInstallments;
                                if (remaining > 0) {
                                  const calculatedTotal = Number(installmentAmount) * remaining;
                                  setValue('totalAmount', calculatedTotal);
                                  setValue('installments', remaining);
                                }
                              }
                            }}
                          />
                          {errors.totalInstallments && (
                            <p className="text-sm text-destructive mt-1">{errors.totalInstallments.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="paidInstallments">Parcelas Já Pagas *</Label>
                          <Input
                            id="paidInstallments"
                            {...register('paidInstallments', { 
                              required: isInProgress ? 'Parcelas pagas é obrigatório' : false,
                              min: { value: 0, message: 'Deve ser 0 ou mais' },
                              validate: (value) => {
                                if (totalInstallments && value !== undefined && value >= totalInstallments) {
                                  return 'Parcelas pagas deve ser menor que total de parcelas';
                                }
                                return true;
                              }
                            })}
                            type="number"
                            min="0"
                            placeholder="3"
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setValue('paidInstallments', value);
                              // Calcular valor total em tempo real
                              if (installmentAmount && totalInstallments) {
                                const remaining = totalInstallments - value;
                                if (remaining > 0) {
                                  const calculatedTotal = Number(installmentAmount) * remaining;
                                  setValue('totalAmount', calculatedTotal);
                                  setValue('installments', remaining);
                                }
                              }
                            }}
                          />
                          {errors.paidInstallments && (
                            <p className="text-sm text-destructive mt-1">{errors.paidInstallments.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Preview do cálculo */}
                      {installmentAmount && totalInstallments && paidInstallments !== undefined && (
                        <div className="bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-700 rounded-lg p-4">
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                Parcelas restantes:
                              </span>
                              <span className="text-lg md:text-xl font-bold text-green-700 dark:text-green-300">
                                {totalInstallments - paidInstallments} parcelas
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                Valor total restante:
                              </span>
                              <span className="text-lg md:text-xl font-bold text-green-700 dark:text-green-300">
                                R$ {((Number(installmentAmount) || 0) * (totalInstallments - paidInstallments)).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs sm:text-sm text-green-700 dark:text-green-300 mt-2 pt-2 border-t border-green-300 dark:border-green-700">
                              Valor por parcela: R$ {Number(installmentAmount).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {isInProgress ? (
                      // Dívida em andamento - mostrar parcelas calculadas automaticamente
                      <div>
                        <Label htmlFor="installments">Número de Parcelas (Calculado automaticamente)</Label>
                        <Input
                          id="installments"
                          type="number"
                          value={installments || 0}
                          readOnly
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          {installments > 0 ? `${installments} parcelas restantes` : 'Preencha os campos acima para calcular'}
                        </p>
                      </div>
                    ) : (
                      // Dívida nova - campo editável
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
                    )}

                    <div>
                      <Label htmlFor="dueDate">Primeiro Vencimento</Label>
                      <Input 
                        id="dueDate"
                        {...register('dueDate')} 
                        type="date" 
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full max-w-full text-sm sm:text-base"
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
                          <Label htmlFor="interestRate" className="text-sm">Juros ao mês (%) - Aplicado apenas em caso de atraso</Label>
                          <Input 
                            id="interestRate"
                            {...register('interestRate')} 
                            type="number" 
                            step="0.1" 
                            placeholder="2.0"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Este valor será aplicado apenas se houver atraso no pagamento
                          </p>
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

                <div id="help-payment" className="space-y-4">
                  {paymentMethod === 'pix' ? (
                    // Quando for PIX manual, ir direto para seleção de chave PIX
                    <div className="animate-fade-in space-y-3">
                      <div>
                        <Label className="text-base">Chave PIX para {isPersonalDebt ? 'Pagamento' : 'Recebimento'} *</Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          Selecione ou crie uma chave PIX para {isPersonalDebt ? 'realizar o pagamento' : 'receber o pagamento'}.
                        </p>
                      </div>
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
                                  required: showNewPixKeyForm ? 'Valor da chave é obrigatório' : false 
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
                            {isPersonalDebt && (
                              <>
                                <div className="flex items-center space-x-2 pt-2 border-t">
                                  <Switch
                                    id="pixKeyIsThirdParty"
                                    checked={watch('pixKeyIsThirdParty') || false}
                                    onCheckedChange={(checked) => setValue('pixKeyIsThirdParty' as any, checked)}
                                  />
                                  <Label htmlFor="pixKeyIsThirdParty" className="text-xs cursor-pointer">
                                    Chave PIX de outra pessoa (terceiro)
                                  </Label>
                                </div>
                                {watch('pixKeyIsThirdParty') && (
                                  <>
                                    <div>
                                      <Label htmlFor="pixKeyContactEmail" className="text-xs">Email do Contato (Opcional)</Label>
                                      <Input
                                        id="pixKeyContactEmail"
                                        type="email"
                                        {...register('pixKeyContactEmail' as any)}
                                        placeholder="contato@example.com"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="pixKeyContactName" className="text-xs">Nome do Contato (Opcional)</Label>
                                      <Input
                                        id="pixKeyContactName"
                                        {...register('pixKeyContactName' as any)}
                                        placeholder="João Silva"
                                      />
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                            <div className="pt-2 border-t">
                              <Button
                                type="button"
                                onClick={handleSavePixKey}
                                disabled={createPixKeyMutation.isPending || !watch('pixKeyType') || !watch('pixKeyValue')}
                                className="w-full"
                                size="sm"
                              >
                                {createPixKeyMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Salvar Chave PIX
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  ) : (
                    // Quando não for PIX manual, mostrar opções de gateway
                    <>
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
                                <div className="font-semibold">Pagamento por PIX</div>
                            <p className="text-sm text-muted-foreground">
                                  Registrar a dívida para receber ou pagar via PIX manual
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
                    </>
                  )}

                  {!useGateway && paymentMethod !== 'pix' && (
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
                            {isPersonalDebt && (
                              <>
                                <div className="flex items-center space-x-2 pt-2 border-t">
                                  <Switch
                                    id="pixKeyIsThirdParty"
                                    checked={watch('pixKeyIsThirdParty') || false}
                                    onCheckedChange={(checked) => setValue('pixKeyIsThirdParty' as any, checked)}
                                  />
                                  <Label htmlFor="pixKeyIsThirdParty" className="text-xs cursor-pointer">
                                    Chave PIX de outra pessoa (terceiro)
                                  </Label>
                                </div>
                                {watch('pixKeyIsThirdParty') && (
                                  <>
                                    <div>
                                      <Label htmlFor="pixKeyContactEmail" className="text-xs">Email do Contato (Opcional)</Label>
                                      <Input
                                        id="pixKeyContactEmail"
                                        type="email"
                                        {...register('pixKeyContactEmail' as any)}
                                        placeholder="contato@example.com"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="pixKeyContactName" className="text-xs">Nome do Contato (Opcional)</Label>
                                      <Input
                                        id="pixKeyContactName"
                                        {...register('pixKeyContactName' as any)}
                                        placeholder="João Silva"
                                      />
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                            <div className="pt-2 border-t">
                              <Button
                                type="button"
                                onClick={handleSavePixKey}
                                disabled={createPixKeyMutation.isPending || !watch('pixKeyType') || !watch('pixKeyValue')}
                                className="w-full"
                                size="sm"
                              >
                                {createPixKeyMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Salvando...
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Salvar Chave PIX
                                  </>
                                )}
                              </Button>
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

