import { useMutation } from '@tanstack/react-query';
import { paymentsService } from '@/services/payments.service';
import toast from 'react-hot-toast';

export const usePayment = () => {
  const processPaymentMutation = useMutation({
    mutationFn: ({ chargeId, gateway }: { chargeId: string; gateway: 'STRIPE' | 'MERCADOPAGO' }) =>
      paymentsService.processPayment(chargeId, gateway),
    onSuccess: () => {
      toast.success('Pagamento iniciado!');
    },
    onError: () => {
      toast.error('Erro ao processar pagamento');
    },
  });

  return {
    processPayment: processPaymentMutation.mutate,
    isProcessing: processPaymentMutation.isPending,
  };
};

