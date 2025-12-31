import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';
import { usersService } from '@/services/users.service';

export function SalaryConfirmationCard() {
  const queryClient = useQueryClient();
  const [salaryAmount, setSalaryAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: salaryStatus, isLoading } = useQuery({
    queryKey: ['salary-status'],
    queryFn: () => usersService.getSalaryStatus(),
  });

  const confirmMutation = useMutation({
    mutationFn: (amount?: number) => usersService.confirmSalary(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-status'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      toast.success('Salário confirmado com sucesso!');
      setSalaryAmount('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao confirmar salário');
    },
  });

  const handleConfirm = async () => {
    if (!salaryAmount || parseFloat(salaryAmount) <= 0) {
      toast.error('Por favor, informe o valor do salário');
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmMutation.mutateAsync(parseFloat(salaryAmount));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotYet = async () => {
    // Apenas registrar que ainda não caiu (sem valor)
    setIsSubmitting(true);
    try {
      await confirmMutation.mutateAsync(undefined);
      toast.success('Vamos perguntar novamente amanhã!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null;
  }

  // Se já confirmou, não mostrar o card
  if (salaryStatus?.confirmed) {
    return null;
  }

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const currentMonth = salaryStatus?.month || new Date().getMonth() + 1;
  const currentYear = salaryStatus?.year || new Date().getFullYear();

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Confirme seu salário</CardTitle>
            <CardDescription>
              Seu salário caiu hoje? Confirme o valor para atualizarmos seus saldos.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <strong>Mês:</strong> {monthNames[currentMonth - 1]}/{currentYear}
            {salaryStatus?.expectedSalary && (
              <>
                <br />
                <strong>Salário esperado:</strong> {formatCurrency(salaryStatus.expectedSalary)}
              </>
            )}
          </AlertDescription>
        </Alert>

        <div>
          <Label htmlFor="salaryAmount" className="text-base font-semibold">
            Valor do salário que caiu
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
              placeholder={salaryStatus?.expectedSalary ? formatCurrency(salaryStatus.expectedSalary) : '0.00'}
              value={salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Informe o valor exato que caiu na sua conta. Se ainda não caiu, clique em "Ainda não caiu".
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleNotYet}
            disabled={isSubmitting}
            className="flex-1"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Ainda não caiu
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !salaryAmount || parseFloat(salaryAmount) <= 0}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 animate-pulse" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



