import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, Info, Sparkles, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financialProfileService } from '@/services/financial-profile.service';

interface OnboardingFormData {
  salaryAmount: number;
  payday: number;
}

export default function FinancialOnboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      salaryAmount: 0,
      payday: 5,
    },
  });

  const salaryAmount = watch('salaryAmount');
  const payday = watch('payday');

  const createProfile = useMutation({
    mutationFn: (data: OnboardingFormData) =>
      financialProfileService.create({
        salaryAmount: data.salaryAmount,
        payday: data.payday,
        onboardingCompleted: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-profile'] });
      toast.success('Perfil financeiro criado com sucesso!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      console.error('Erro ao criar perfil financeiro:', error);
      toast.error(error?.response?.data?.message || 'Erro ao criar perfil financeiro');
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    if (!data.salaryAmount || data.salaryAmount <= 0) {
      toast.error('Por favor, informe o valor do seu salário');
      return;
    }

    if (!data.payday || data.payday < 1 || data.payday > 31) {
      toast.error('Por favor, informe um dia válido (1-31)');
      return;
    }

    await createProfile.mutateAsync(data);
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
            Configure seu perfil financeiro para começar a controlar suas finanças
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Configurar Perfil Financeiro
            </CardTitle>
            <CardDescription>
              Informe seu salário e dia do pagamento para começarmos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Essas informações nos ajudam a calcular seus saldos e te lembrar quando seu salário cai.
                  Você pode alterar essas informações depois nas configurações.
                </AlertDescription>
              </Alert>

              {/* Salário Mensal */}
              <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                <Label htmlFor="salaryAmount" className="text-base font-semibold">
                  Salário Mensal <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    R$
                  </span>
                  <Input
                    id="salaryAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10 text-lg font-semibold"
                    placeholder="5000.00"
                    {...register('salaryAmount', {
                      required: 'Salário é obrigatório',
                      min: { value: 0.01, message: 'Salário deve ser maior que zero' },
                      valueAsNumber: true,
                    })}
                  />
                </div>
                {errors.salaryAmount && (
                  <p className="text-sm text-destructive mt-1">{errors.salaryAmount.message}</p>
                )}
                {salaryAmount && salaryAmount > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Salário: <span className="font-semibold">{formatCurrency(parseFloat(String(salaryAmount)))}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Informe o valor do seu salário líquido mensal (após descontos).
                </p>
              </div>

              {/* Dia do Pagamento */}
              <div>
                <Label htmlFor="payday" className="text-base font-semibold">
                  Dia do Pagamento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="payday"
                  type="number"
                  min="1"
                  max="31"
                  className="mt-2 text-lg font-semibold"
                  placeholder="5"
                  {...register('payday', {
                    required: 'Dia do pagamento é obrigatório',
                    min: { value: 1, message: 'Dia deve ser entre 1 e 31' },
                    max: { value: 31, message: 'Dia deve ser entre 1 e 31' },
                    valueAsNumber: true,
                  })}
                />
                {errors.payday && (
                  <p className="text-sm text-destructive mt-1">{errors.payday.message}</p>
                )}
                {payday && payday >= 1 && payday <= 31 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Seu salário cai no dia <span className="font-semibold">{payday}</span> de cada mês
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Informe o dia do mês em que seu salário normalmente cai (1-31).
                  No dia do pagamento, vamos te perguntar se o salário caiu e qual foi o valor.
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createProfile.isPending || !salaryAmount || errors.salaryAmount !== undefined || errors.payday !== undefined}
                  className="flex-1"
                >
                  {createProfile.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Configurando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Você pode alterar essas informações depois nas configurações
        </p>
      </div>
    </div>
  );
}
