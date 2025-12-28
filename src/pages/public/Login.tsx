import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [useEmailAccess, setUseEmailAccess] = useState(false);
  const { login, register: registerUser, sendMagicLink, isLoading } = useAuth();
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    if (useEmailAccess) {
      sendMagicLink(data.email);
    } else if (isRegister) {
      registerUser({ email: data.email, password: data.password, name: data.name });
    } else {
      login({ email: data.email, password: data.password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              Finance Control
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isRegister ? 'Criar nova conta' : 'Entre na sua conta'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegister && (
              <div>
                <label className="label">Nome (opcional)</label>
                <input {...register('name')} className="input" placeholder="Seu nome" />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                {...register('email', { required: true })}
                type="email"
                className="input"
                placeholder="seu@email.com"
              />
            </div>

            {!useEmailAccess && (
              <div>
                <label className="label">Senha</label>
                <input
                  {...register('password', { required: !useEmailAccess })}
                  type="password"
                  className="input"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {useEmailAccess ? 'Enviar Link de Acesso' : isRegister ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              <span className="px-4 text-sm text-gray-500">OU</span>
              <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            </div>

            <button
              onClick={() => setUseEmailAccess(!useEmailAccess)}
              className="btn-secondary w-full"
            >
              {useEmailAccess ? 'Usar senha' : 'Acessar por email'}
            </button>

            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setUseEmailAccess(false);
              }}
              className="w-full text-sm text-primary-600 hover:underline"
            >
              {isRegister ? 'Já tem conta? Entre aqui' : 'Não tem conta? Registre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

