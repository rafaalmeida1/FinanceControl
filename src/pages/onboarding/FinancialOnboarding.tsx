import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, Info, Sparkles, Wallet as WalletIcon } from 'lucide-react';
import { useWallets } from '@/hooks/useWallets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface OnboardingFormData {
  walletName: string;
  walletBalance: number;
  walletColor?: string;
  walletIcon?: string;
}

export default function FinancialOnboarding() {
  const navigate = useNavigate();
  const { createWallet } = useWallets();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      walletName: 'Carteira Principal',
      walletBalance: 0,
      walletColor: '#10b981',
      walletIcon: '💳',
    },
  });

  const walletName = watch('walletName');
  const walletBalance = watch('walletBalance');
  const walletColor = watch('walletColor');
  const walletIcon = watch('walletIcon');

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      // Criar carteira padrão com saldo inicial
      await createWallet.mutateAsync({
        name: data.walletName.trim(),
        color: data.walletColor || '#10b981',
        icon: data.walletIcon || '💳',
        isDefault: true,
        balance: data.walletBalance ? parseFloat(String(data.walletBalance)) : 0,
      });

      toast.success('Carteira criada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro ao criar carteira:', error);
      toast.error(error?.response?.data?.message || 'Erro ao criar carteira');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Bem-vindo ao Finance Control!
          </h1>
          <p className="text-muted-foreground text-lg">
            Vamos criar sua primeira carteira para começar a controlar suas finanças
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              Criar Carteira
            </CardTitle>
            <CardDescription>
              Crie sua primeira carteira para organizar suas movimentações financeiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  A carteira é onde você organiza suas movimentações. Você pode criar quantas
                  carteiras quiser depois.
                </AlertDescription>
              </Alert>

              {/* Nome da Carteira */}
              <div>
                <Label htmlFor="walletName" className="text-base font-semibold">
                  Nome da Carteira <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="walletName"
                  placeholder="Ex: Carteira Principal, Conta Corrente..."
                  className="mt-2"
                  {...register('walletName', {
                    required: 'Nome da carteira é obrigatório',
                    minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' },
                  })}
                />
                {errors.walletName && (
                  <p className="text-sm text-destructive mt-1">{errors.walletName.message}</p>
                )}
              </div>

              {/* Saldo Inicial - Destaque */}
              <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                <Label htmlFor="walletBalance" className="text-base font-semibold">
                  Saldo Inicial <span className="text-muted-foreground font-normal">(Opcional)</span>
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input
                    id="walletBalance"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10 text-lg font-semibold"
                    placeholder="0.00"
                    {...register('walletBalance', {
                      min: { value: 0, message: 'Saldo não pode ser negativo' },
                      valueAsNumber: true,
                    })}
                  />
                </div>
                {errors.walletBalance && (
                  <p className="text-sm text-destructive mt-1">{errors.walletBalance.message}</p>
                )}
                {walletBalance && walletBalance > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Saldo inicial: <span className="font-semibold">{formatCurrency(parseFloat(String(walletBalance)))}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Se você já tem dinheiro disponível, informe o valor inicial. Caso contrário, deixe em zero.
                </p>
              </div>

              {/* Personalização - Acordeon */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="personalization">
                  <AccordionTrigger className="text-sm font-medium">
                    Personalizar Carteira (Opcional)
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="walletIcon">Ícone</Label>
                      <Input
                        id="walletIcon"
                        placeholder="💳"
                        maxLength={2}
                        className="mt-2"
                        {...register('walletIcon')}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Escolha um emoji ou ícone para sua carteira
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="walletColor">Cor</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          id="walletColor"
                          type="color"
                          className="w-16 h-10 cursor-pointer"
                          {...register('walletColor')}
                        />
                        <Input
                          type="text"
                          placeholder="#10b981"
                          className="flex-1"
                          {...register('walletColor')}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Escolha uma cor para identificar sua carteira
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Preview da Carteira */}
              {(walletName || walletIcon || walletColor) && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <p className="text-sm font-medium mb-3">Preview:</p>
                  <div
                    className="flex items-center gap-3 p-4 rounded-lg border"
                    style={{
                      borderLeft: `4px solid ${walletColor || '#10b981'}`,
                    }}
                  >
                    <div
                      className="h-12 w-12 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${walletColor || '#10b981'}20` }}
                    >
                      {walletIcon || '💳'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{walletName || 'Carteira Principal'}</p>
                      <p className="text-sm text-muted-foreground">
                        Saldo: {formatCurrency(parseFloat(String(walletBalance)) || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Pular por enquanto
                </Button>
                <Button
                  type="submit"
                  disabled={createWallet.isPending || !walletName || errors.walletName !== undefined}
                  className="flex-1"
                >
                  {createWallet.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      Criar Carteira
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Você pode criar mais carteiras depois nas configurações
        </p>
      </div>
    </div>
  );
}
