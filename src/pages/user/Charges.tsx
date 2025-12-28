import { useCharges } from '@/hooks/useCharges';
import { formatCurrency, formatDateShort, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Check, XCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Charges() {
  const { charges, isLoading, markPaid, cancelCharge, forceCharge } = useCharges();

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cobranças</h1>
          <p className="text-gray-600 dark:text-gray-400">Gerencie todas as suas cobranças</p>
        </div>
        <Button
          onClick={() => {
            if (confirm('Deseja forçar o envio de cobranças para todos os devedores com dívidas pendentes?')) {
              forceCharge(undefined);
            }
          }}
          className="flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          Forçar Cobrança
        </Button>
      </div>

      <div className="space-y-4">
        {charges?.map((charge) => (
          <div key={charge.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{charge.description || 'Cobrança'}</h3>
                {charge.debt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {charge.debt.debtorName || charge.debt.debtorEmail}
                  </p>
                )}
                {charge.installmentNumber && (
                  <p className="text-sm text-gray-500">
                    Parcela {charge.installmentNumber}/{charge.totalInstallments}
                  </p>
                )}
              </div>
              <span className={`badge ${getStatusColor(charge.status)}`}>
                {getStatusLabel(charge.status)}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor</p>
                <p className="text-xl font-bold">{formatCurrency(charge.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vencimento</p>
                <p className="text-lg font-bold">{formatDateShort(charge.dueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                <p className="text-lg font-bold">{charge.type}</p>
              </div>
            </div>

            {charge.status === 'PENDING' && (
              <div className="flex gap-2">
                <button
                  onClick={() => markPaid({ id: charge.id })}
                  className="btn-primary flex items-center gap-2"
                >
                  <Check size={16} />
                  Marcar como Pago
                </button>
                <button
                  onClick={() => {
                    if (confirm('Deseja cancelar esta cobrança?')) {
                      cancelCharge(charge.id);
                    }
                  }}
                  className="btn-danger flex items-center gap-2"
                >
                  <XCircle size={16} />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}

        {charges?.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">Nenhuma cobrança encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}

