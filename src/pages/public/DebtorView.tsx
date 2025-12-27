import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { debtorAccessService } from '@/services/debtor-access.service';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Calendar, DollarSign, FileText } from 'lucide-react';

export default function DebtorView() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['debtor-debt', token],
    queryFn: () => debtorAccessService.getDebt(token!),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Link Inválido</h1>
          <p className="text-gray-600">Este link expirou ou é inválido.</p>
        </div>
      </div>
    );
  }

  const { debt } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card mb-6">
          <h1 className="text-3xl font-bold mb-2">Detalhes da Dívida</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Credor: {debt.user?.name || debt.user?.email}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-primary-600" size={24} />
              <h3 className="font-semibold">Valor Total</h3>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(debt.totalAmount)}</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="text-green-600" size={24} />
              <h3 className="font-semibold">Valor Pago</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(debt.paidAmount)}</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={24} />
              <h3 className="font-semibold">Status</h3>
            </div>
            <span className={`badge ${getStatusColor(debt.status)}`}>
              {getStatusLabel(debt.status)}
            </span>
          </div>
        </div>

        {debt.description && (
          <div className="card mb-6">
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-gray-600 dark:text-gray-400">{debt.description}</p>
          </div>
        )}

        <div className="card">
          <h3 className="text-xl font-bold mb-4">Cobranças</h3>
          <div className="space-y-3">
            {debt.charges?.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold">
                    {charge.installmentNumber
                      ? `Parcela ${charge.installmentNumber}/${charge.totalInstallments}`
                      : 'Cobrança única'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="inline" size={14} />{' '}
                    {formatDateShort(charge.dueDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(charge.amount)}</p>
                  <span className={`badge ${getStatusColor(charge.status)}`}>
                    {getStatusLabel(charge.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

