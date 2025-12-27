import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { formatCurrency } from '@/lib/utils';
import { Users, FileText, CreditCard, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  if (isLoading) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-gray-600 dark:text-gray-400">Visão geral do sistema</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-blue-600" size={24} />
            <h3 className="font-semibold">Usuários</h3>
          </div>
          <p className="text-2xl font-bold">{stats?.users.total || 0}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats?.users.active || 0} ativos
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-green-600" size={24} />
            <h3 className="font-semibold">Dívidas</h3>
          </div>
          <p className="text-2xl font-bold">{stats?.debts.total || 0}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="text-purple-600" size={24} />
            <h3 className="font-semibold">Cobranças</h3>
          </div>
          <p className="text-2xl font-bold">{stats?.charges.total || 0}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {stats?.charges.pending || 0} pendentes
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-yellow-600" size={24} />
            <h3 className="font-semibold">Volume Total</h3>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats?.financialVolume || 0)}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-bold mb-4">Pagamentos</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Total de Pagamentos</p>
            <p className="text-2xl font-bold">{stats?.payments.total || 0}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Pagamentos Completos</p>
            <p className="text-2xl font-bold text-green-600">{stats?.payments.completed || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

