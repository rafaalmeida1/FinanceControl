import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
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
  X,
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { paymentsService } from '@/services/payments.service';

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
  { id: 2, title: 'Tipo de Movimentação', icon: Info },
  { id: 3, title: 'Dados do Usuário', icon: User },
  { id: 4, title: 'Configuração', icon: CreditCard },
  { id: 5, title: 'Confirmação', icon: Check },
];

const PROGRESS_STORAGE_KEY = 'createMovementProgress';

interface CreateMovementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateMovementDrawer({ open, onOpenChange }: CreateMovementDrawerProps) {
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
  const [mercadoPagoConnected, setMercadoPagoConnected] = useState<boolean | null>(null);
  const [checkingMercadoPago, setCheckingMercadoPago] = useState(false);

  const { register, handleSubmit, watch, setValue, trigger, reset, formState: { errors } } = useForm<DebtFormData>({
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

  // Salvar progresso no localStorage
  const saveProgress = useCallback(() => {
    if (!open) return; // Só salvar se o drawer estiver aberto
    
    const formValues = watch();
    const progress = {
      currentStep,
      paymentMethod,
      debtType,
      mercadoPagoPaymentType,
      isPersonalDebt,
      selectedPixKeyId,
      inputMode,
      installmentAmount,
      isInProgress,
      paidInstallments,
      recurringInterval,
      recurringDay,
      subscriptionName,
      durationMonths,
      mercadoPagoConnected,
      formData: {
        walletId: formValues.walletId,
        description: formValues.description,
        totalAmount: formValues.totalAmount,
        installments: formValues.installments,
        dueDate: formValues.dueDate,
        debtorEmail: formValues.debtorEmail,
        debtorName: formValues.debtorName,
        creditorEmail: formValues.creditorEmail,
        creditorName: formValues.creditorName,
        pixKeyId: formValues.pixKeyId,
      },
    };
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  }, [
    open,
    currentStep,
    paymentMethod,
    debtType,
    mercadoPagoPaymentType,
    isPersonalDebt,
    selectedPixKeyId,
    inputMode,
    installmentAmount,
    isInProgress,
    paidInstallments,
    recurringInterval,
    recurringDay,
    subscriptionName,
    durationMonths,
    mercadoPagoConnected,
    watch,
  ]);

  // Restaurar progresso do localStorage
  const restoreProgress = () => {
    try {
      const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (saved) {
        const progress = JSON.parse(saved);
        setCurrentStep(progress.currentStep || 0);
        setPaymentMethod(progress.paymentMethod || null);
        setDebtType(progress.debtType || null);
        setMercadoPagoPaymentType(progress.mercadoPagoPaymentType || null);
        setIsPersonalDebt(progress.isPersonalDebt || 'other-owes-me');
        setSelectedPixKeyId(progress.selectedPixKeyId || null);
        setInputMode(progress.inputMode || 'total');
        setInstallmentAmount(progress.installmentAmount || '');
        setIsInProgress(progress.isInProgress || false);
        setPaidInstallments(progress.paidInstallments || 0);
        setRecurringInterval(progress.recurringInterval || 'MONTHLY');
        setRecurringDay(progress.recurringDay || new Date().getDate());
        setSubscriptionName(progress.subscriptionName || '');
        setDurationMonths(progress.durationMonths || null);
        
        if (progress.formData) {
          Object.keys(progress.formData).forEach((key) => {
            if (progress.formData[key] !== undefined) {
              setValue(key as any, progress.formData[key]);
            }
          });
        }

        // Verificar conexão do Mercado Pago se necessário
        if (progress.paymentMethod === 'mercadopago') {
          paymentsService.getMercadoPagoConnectionStatus()
            .then((status) => {
              setMercadoPagoConnected(status.connected);
            })
            .catch(() => {
              setMercadoPagoConnected(false);
            });
        }
      }
    } catch (error) {
      console.error('Erro ao restaurar progresso:', error);
    }
  };

  // Limpar progresso
  const clearProgress = () => {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  };

  // Verificar conexão do Mercado Pago quando selecionar esse método
  useEffect(() => {
    if (paymentMethod === 'mercadopago') {
      setCheckingMercadoPago(true);
      paymentsService.getMercadoPagoConnectionStatus()
        .then((status) => {
          setMercadoPagoConnected(status.connected);
        })
        .catch(() => {
          setMercadoPagoConnected(false);
        })
        .finally(() => {
          setCheckingMercadoPago(false);
        });
    } else {
      setMercadoPagoConnected(null);
    }
  }, [paymentMethod]);

  // Salvar progresso sempre que houver mudanças (debounce para evitar muitas escritas)
  useEffect(() => {
    if (open) {
      const timeoutId = setTimeout(() => {
        saveProgress();
      }, 300); // Debounce de 300ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    open,
    currentStep,
    paymentMethod,
    debtType,
    mercadoPagoPaymentType,
    isPersonalDebt,
    selectedPixKeyId,
    inputMode,
    installmentAmount,
    isInProgress,
    paidInstallments,
    recurringInterval,
    recurringDay,
    subscriptionName,
    durationMonths,
    mercadoPagoConnected,
    walletId,
    description,
    totalAmount,
    installments,
    dueDate,
    debtorEmail,
    creditorEmail,
    saveProgress,
  ]);

  // Restaurar progresso ao abrir
  useEffect(() => {
    if (open) {
      restoreProgress();
    }
  }, [open]);

  // Restaurar estado após conexão do Mercado Pago
  useEffect(() => {
    const savedState = localStorage.getItem('createDebtState');
    if (savedState) {
      try {
        // Verificar se voltou da conexão
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('connected') === 'true' || urlParams.get('tab') === 'pagamentos') {
          // Recarregar status de conexão
          paymentsService.getMercadoPagoConnectionStatus()
            .then((status) => {
              setMercadoPagoConnected(status.connected);
              if (status.connected) {
                toast.success('Mercado Pago conectado com sucesso!');
              }
              // Limpar localStorage
              localStorage.removeItem('createDebtState');
              // Limpar URL params
              window.history.replaceState({}, '', window.location.pathname);
            });
        }
      } catch (error) {
        console.error('Erro ao restaurar estado:', error);
        localStorage.removeItem('createDebtState');
      }
    }
  }, []);

  // Ajustar tipo de dívida baseado no método de pagamento
  useEffect(() => {
    if (paymentMethod === 'mercadopago' && mercadoPagoConnected) {
      if (mercadoPagoPaymentType === 'RECURRING_CARD') {
        setDebtType('recurring');
      } else if (mercadoPagoPaymentType === 'INSTALLMENT') {
        setDebtType('installment');
      } else if (mercadoPagoPaymentType === 'SINGLE_PIX') {
        setDebtType('single');
      }
    }
  }, [paymentMethod, mercadoPagoPaymentType, mercadoPagoConnected]);

  // Preencher dados automaticamente com dados do usuário logado
  useEffect(() => {
    if (isPersonalDebt === 'i-owe-myself' && user?.email) {
      setValue('debtorEmail', user.email);
      setValue('debtorName', user.name || '');
      setValue('creditorEmail', user.email);
      setValue('creditorName', user.name || '');
    } else if (isPersonalDebt === 'i-owe-other' && user?.email) {
      // Quando "Eu devo para outra pessoa", usar automaticamente os dados do usuário logado
      setValue('debtorEmail', user.email);
      setValue('debtorName', user.name || '');
    } else if (isPersonalDebt === 'other-owes-me') {
      // Quando "Outra pessoa me deve", limpar campos do devedor para o usuário preencher
      setValue('debtorEmail', '');
      setValue('debtorName', '');
    }
  }, [isPersonalDebt, user, setValue]);

  const connectMercadoPago = async () => {
    try {
      const { authUrl } = await paymentsService.getMercadoPagoAuthUrl();
      // Salvar o estado atual no localStorage para restaurar após conexão
      const formValues = watch();
      localStorage.setItem('createDebtState', JSON.stringify({
        currentStep,
        paymentMethod,
        walletId: formValues.walletId,
      }));
      // Redirecionar para conexão
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao conectar Mercado Pago. Verifique se MERCADOPAGO_CLIENT_ID está configurado.');
    }
  };

  const nextStep = async () => {
    let isValid = true;

    if (currentStep === 0) {
      isValid = await trigger('walletId');
      if (!isValid) {
        toast.error('Selecione uma carteira');
        return;
      }
    } else if (currentStep === 1) {
      if (!paymentMethod) {
        toast.error('Selecione um método de pagamento');
        return;
      }
      // Verificar se Mercado Pago está conectado
      if (paymentMethod === 'mercadopago' && !mercadoPagoConnected) {
        toast.error('Você precisa conectar sua conta do Mercado Pago primeiro');
        return;
      }
    } else if (currentStep === 2) {
      // Verificar novamente se Mercado Pago está conectado
      if (paymentMethod === 'mercadopago' && !mercadoPagoConnected) {
        toast.error('Você precisa conectar sua conta do Mercado Pago primeiro');
        return;
      }
      // Validar tipo de pagamento do Mercado Pago apenas se o método for Mercado Pago
      if (paymentMethod === 'mercadopago' && !mercadoPagoPaymentType) {
        toast.error('Selecione o tipo de pagamento do Mercado Pago');
        return;
      }
      // Para PIX manual, validar tipo de movimentação
      if (paymentMethod === 'pix' && !debtType) {
        toast.error('Selecione o tipo de movimentação');
        return;
      }
    } else if (currentStep === 3) {
      // Validar campos baseado no tipo de movimentação
      if (isPersonalDebt === 'other-owes-me') {
        isValid = await trigger(['description', 'debtorEmail']);
      } else if (isPersonalDebt === 'i-owe-other') {
        isValid = await trigger(['description', 'creditorEmail']);
        if (!creditorEmail) {
          isValid = false;
          toast.error('Email do credor é obrigatório');
        }
      } else {
        isValid = await trigger(['description']);
      }
      if (!isValid) return;
    } else if (currentStep === 4) {
      isValid = await trigger(['totalAmount']);
      // Para dívidas recorrentes, não validar dueDate nem installments
      if (debtType !== 'recurring') {
        isValid = isValid && await trigger('dueDate');
        if (debtType === 'installment') {
          isValid = isValid && await trigger('installments');
        }
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
        walletId: data.walletId,
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
      
      // Para dívidas recorrentes, calcular a data baseado no dia do mês
      if (debtType === 'recurring') {
        const now = new Date();
        const day = recurringDay || now.getDate();
        const month = now.getMonth();
        const year = now.getFullYear();
        
        // Criar data com o dia do mês especificado
        let calculatedDate = new Date(year, month, day);
        
        // Se o dia já passou neste mês, usar o próximo mês
        if (calculatedDate < now) {
          calculatedDate = new Date(year, month + 1, day);
        }
        
        dueDateISO = calculatedDate.toISOString();
      } else if (data.dueDate) {
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
          toast.success('Movimentação criada com sucesso!');
          // Limpar progresso e resetar para o passo inicial (após criação completa)
          clearProgress();
          reset();
          setCurrentStep(0);
          setPaymentMethod(null);
          setDebtType(null);
          setMercadoPagoPaymentType(null);
          setIsPersonalDebt('other-owes-me');
          setSelectedPixKeyId(null);
          setInputMode('total');
          setInstallmentAmount('');
          setIsInProgress(false);
          setPaidInstallments(0);
          setRecurringInterval('MONTHLY');
          setRecurringDay(new Date().getDate());
          setSubscriptionName('');
          setDurationMonths(null);
          setMercadoPagoConnected(null);
          setDuplicates([]);
          setShowDuplicateWarning(false);
          setPendingSubmitData(null);
          // Fechar drawer após um pequeno delay para mostrar o toast
          setTimeout(() => {
            onOpenChange(false);
          }, 500);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message || 'Erro ao criar movimentação');
        },
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao criar movimentação');
    }
  };

  const handleDuplicateWarningResponse = (action: 'create' | 'edit' | 'cancel') => {
    setShowDuplicateWarning(false);
    if (action === 'create' && pendingSubmitData) {
      createDebtData(pendingSubmitData);
    }
    setPendingSubmitData(null);
  };

  const handleClose = () => {
    // Salvar progresso antes de fechar (para manter dados se o usuário voltar)
    saveProgress();
    onOpenChange(false);
  };

  // Renderizar step (mesma lógica do CreateDebt.tsx)
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Selecione a Carteira</h2>
              <p className="text-muted-foreground">
                Escolha a carteira para associar esta movimentação
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
              <>
                {checkingMercadoPago ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Verificando conexão...</span>
                  </div>
                ) : mercadoPagoConnected === false ? (
                  <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50">
                    <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="text-amber-800 dark:text-amber-200">
                      Mercado Pago não conectado
                    </AlertTitle>
                    <AlertDescription className="text-amber-700 dark:text-amber-300 mt-2">
                      <p className="mb-3">
                        Para usar o Mercado Pago, você precisa conectar sua conta primeiro.
                      </p>
                      <Button
                        onClick={connectMercadoPago}
                        className="w-full sm:w-auto"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Conectar Mercado Pago
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : mercadoPagoConnected === true ? (
                  <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/50">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-200">
                      Mercado Pago conectado
                    </AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                      Sua conta do Mercado Pago está conectada e pronta para uso.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </>
            )}
          </div>
        );

      case 2:
        // Não permitir avançar se Mercado Pago não estiver conectado
        if (paymentMethod === 'mercadopago' && !mercadoPagoConnected) {
          return (
            <div className="space-y-6">
              <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50">
                <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">
                  Mercado Pago não conectado
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300 mt-2">
                  <p className="mb-3">
                    Para usar o Mercado Pago, você precisa conectar sua conta primeiro.
                  </p>
                  <Button
                    onClick={connectMercadoPago}
                    className="w-full sm:w-auto"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Conectar Mercado Pago
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {paymentMethod === 'mercadopago' ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Tipo de Pagamento</h2>
                  <p className="text-muted-foreground">
                    Como deseja receber o pagamento através do Mercado Pago?
                  </p>
                </div>
                <MercadoPagoTypeSelector
                  selectedType={mercadoPagoPaymentType}
                  onSelectType={setMercadoPagoPaymentType}
                />
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Tipo de Movimentação</h2>
                  <p className="text-muted-foreground">
                    Qual é a natureza desta movimentação?
                  </p>
                </div>
                <DebtTypeSelector
                  selectedType={debtType}
                  onSelect={setDebtType}
                  paymentMethod={paymentMethod}
                />
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Dados do Usuário</h2>
              <p className="text-muted-foreground">
                Informe os dados da pessoa envolvida na movimentação
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
                        <p className="font-medium">Movimentação pessoal (para mim mesmo)</p>
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
                  Identificação da Movimentação <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  {...register('description', { required: 'Identificação é obrigatória' })}
                  placeholder="Ex: Conta de luz, Mensalidade de academia, Empréstimo João, Aluguel..."
                  className="mt-2 min-h-[100px]"
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              {isPersonalDebt === 'other-owes-me' && (
                <>
                  <EmailAutocomplete
                    id="debtorEmail"
                    label="Email do Devedor"
                    value={debtorEmail || ''}
                    onChange={(value) => setValue('debtorEmail', value)}
                    error={errors.debtorEmail?.message}
                    required
                  />

                  <div>
                    <Label htmlFor="debtorName">Nome do Devedor</Label>
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

            {/* Data de Vencimento - Ocultar se for recorrente */}
            {debtType !== 'recurring' && (
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
            )}

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
                Revise os dados antes de criar a movimentação
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumo da Movimentação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Identificação</p>
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
                  {debtType !== 'recurring' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Vencimento</p>
                      <p className="font-medium">{dueDate ? new Date(dueDate).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                  )}
                  {debtType === 'recurring' && (
                    <div>
                      <p className="text-sm text-muted-foreground">Dia do Mês</p>
                      <p className="font-medium">Dia {recurringDay}</p>
                    </div>
                  )}
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
    <>
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DrawerTitle className="text-xl font-bold">
                  Nova Movimentação
                </DrawerTitle>
                <DrawerDescription className="mt-1">
                  Passo {currentStep + 1} de {STEPS.length}: {STEPS[currentStep].title}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>

            {/* Progress Steps */}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                            isActive && 'border-primary bg-primary text-primary-foreground',
                            isCompleted && 'border-primary bg-primary text-primary-foreground',
                            !isActive && !isCompleted && 'border-muted bg-muted text-muted-foreground'
                          )}
                        >
                          {isCompleted ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <p className={cn(
                          'text-xs mt-1 text-center hidden sm:block',
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
          </DrawerHeader>

          <div className="overflow-y-auto flex-1 px-4 py-6">
            <form onSubmit={handleSubmit(onSubmit)} id="create-movement-form">
              {renderStep()}
            </form>
          </div>

          <DrawerFooter className="border-t">
            <div className="flex justify-between gap-4">
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
                <Button type="button" onClick={nextStep} size="lg" className="flex-1">
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="create-movement-form"
                  size="lg"
                  disabled={isCreatingDebt}
                  className="flex-1"
                >
                  {isCreatingDebt ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Criar Movimentação
                    </>
                  )}
                </Button>
              )}
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

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
    </>
  );
}

