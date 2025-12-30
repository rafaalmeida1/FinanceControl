import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, ArrowLeft, TrendingUp, Calendar, Info, Sparkles, Wallet as WalletIcon } from 'lucide-react';
import { useFinancialProfile } from '@/hooks/useFinancialProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface OnboardingFormData {
  monthlyIncome: number;
  payday: number;
  initialBalance?: number;
}

export default function FinancialOnboarding() {
  const navigate = useNavigate();
  const { createProfile, updateProfile } = useFinancialProfile();
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      monthlyIncome: undefined,
      payday: undefined,
      initialBalance: undefined,
    },
  });

  const monthlyIncome = watch('monthlyIncome');
  const payday = watch('payday');

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      await createProfile.mutateAsync({
        monthlyIncome: parseFloat(String(data.monthlyIncome)),
        payday: parseInt(String(data.payday)),
        initialBalance: data.initialBalance ? parseFloat(String(data.initialBalance)) : undefined,
      });

      // Marcar onboarding como completo
      await updateProfile.mutateAsync({
        onboardingCompleted: true,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    }
  };

  const handleSkip = async () => {
      // Skipped - não precisa mais
    // Criar perfil vazio mas marcar como não completo
    try {
      await createProfile.mutateAsync({});
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao pular onboarding:', error);
    }
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
            Vamos configurar seu perfil financeiro para uma experiência personalizada
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`h-2 flex-1 rounded-full transition-colors ${
              currentStep >= 1 ? 'bg-primary' : 'bg-muted'
            }`}
          />
          <div
            className={`h-2 flex-1 rounded-full transition-colors ${
              currentStep >= 2 ? 'bg-primary' : 'bg-muted'
            }`}
          />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              {currentStep === 1 ? 'Informações Financeiras' : 'Dia do Pagamento'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1
                ? 'Essas informações nos ajudam a personalizar sua experiência'
                : 'Quando você recebe seu salário mensalmente?'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Essas informações são usadas apenas para calcular projeções e melhorar sua
                      experiência. Você pode alterá-las a qualquer momento nas configurações.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="monthlyIncome" className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4" />
                      Salário Líquido Mensal
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="monthlyIncome"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-8"
                        placeholder="5000.00"
                        {...register('monthlyIncome', {
                          required: 'Salário é obrigatório',
                          min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                        })}
                      />
                    </div>
                    {errors.monthlyIncome && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.monthlyIncome.message}
                      </p>
                    )}
                    {monthlyIncome && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Você informou: {formatCurrency(parseFloat(String(monthlyIncome)))}
                      </p>
                    )}
                  </div>

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
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!monthlyIncome || errors.monthlyIncome !== undefined}
                      className="flex-1"
                    >
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      Informe o dia do mês em que você recebe seu salário. Isso nos ajuda a
                      calcular quando você terá dinheiro disponível.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label htmlFor="payday" className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      Dia do Pagamento
                    </Label>
                    <Input
                      id="payday"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="5"
                      {...register('payday', {
                        required: 'Dia do pagamento é obrigatório',
                        min: { value: 1, message: 'Dia deve ser entre 1 e 31' },
                        max: { value: 31, message: 'Dia deve ser entre 1 e 31' },
                      })}
                    />
                    {errors.payday && (
                      <p className="text-sm text-destructive mt-1">{errors.payday.message}</p>
                    )}
                    {payday && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Você recebe todo dia {payday} de cada mês
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="initialBalance" className="flex items-center gap-2 mb-2">
                      <WalletIcon className="h-4 w-4" />
                      Saldo Inicial (Opcional)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="initialBalance"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-8"
                        placeholder="0.00"
                        {...register('initialBalance', {
                          min: { value: 0, message: 'Valor não pode ser negativo' },
                        })}
                      />
                    </div>
                    {errors.initialBalance && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.initialBalance.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Este valor será adicionado à sua carteira padrão
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createProfile.isPending || !payday || errors.payday !== undefined}
                      className="flex-1"
                    >
                      {createProfile.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          Finalizar
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Você pode pular esta etapa e completar depois nas configurações
        </p>
      </div>
    </div>
  );
}

