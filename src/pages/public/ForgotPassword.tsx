import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ForgotPasswordForm {
  email: string;
}

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setEmailSent(true);
      toast.success('Instruções enviadas para seu email!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md">
          <div className="card text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2">Email Enviado!</h1>
              <p className="text-muted-foreground">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
            </div>
            <Link to="/login" className="btn-primary w-full">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              Esqueci minha senha
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Digite seu email para receber instruções de redefinição
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
                type="email"
                className="input"
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message as string}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              Enviar instruções
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:underline">
              ← Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

