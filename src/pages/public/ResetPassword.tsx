import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit } = useForm();

  const resetMutation = useMutation({
    mutationFn: (data: { newPassword: string }) =>
      authService.resetPassword(token!, data.newPassword),
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    },
  });

  const onSubmit = (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    resetMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-2xl font-bold mb-6 text-center">Redefinir Senha</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Nova Senha</label>
              <input
                {...register('newPassword', { required: true, minLength: 6 })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="label">Confirmar Senha</label>
              <input
                {...register('confirmPassword', { required: true })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={resetMutation.isPending}
              className="btn-primary w-full"
            >
              {resetMutation.isPending ? 'Processando...' : 'Redefinir Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

