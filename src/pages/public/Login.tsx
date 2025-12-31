import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email');
  const verifyRequired = searchParams.get('verifyRequired') === 'true';
  const [isRegister, setIsRegister] = useState(false);
  const [useEmailAccess, setUseEmailAccess] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { login, register: registerUser, sendMagicLink, isLoading } = useAuth();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();
  const acceptedTerms = watch('acceptedTerms');

  // Preencher email se vier na URL
  useEffect(() => {
    if (emailFromUrl) {
      setValue('email', emailFromUrl);
    }
  }, [emailFromUrl, setValue]);

  // Mostrar mensagem de verificação necessária
  useEffect(() => {
    if (verifyRequired && emailFromUrl) {
      toast.success(
        `Email de verificação enviado para ${emailFromUrl}. Verifique sua caixa de entrada e clique no link para ativar sua conta.`,
        { duration: 8000 }
      );
    }
  }, [verifyRequired, emailFromUrl]);

  const onSubmit = async (data: any) => {
    if (useEmailAccess) {
      sendMagicLink(data.email);
    } else if (isRegister) {
      if (!data.acceptedTerms) {
        toast.error('Você deve aceitar os termos de uso e política de privacidade');
        return;
      }
      try {
        await registerUser({ email: data.email, password: data.password, name: data.name });
        setRegistrationSuccess(true);
      } catch (error) {
        // Erro já é tratado no hook
      }
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

          {registrationSuccess ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Conta criada com sucesso!</h2>
              <p className="text-muted-foreground mb-4">
                Enviamos um email de verificação para você. Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
              </p>
              <button
                onClick={() => {
                  setRegistrationSuccess(false);
                  setIsRegister(false);
                }}
                className="btn-primary w-full"
              >
                Voltar para o login
              </button>
            </div>
          ) : (
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

              {!useEmailAccess && (
                <div>
                  <label className="label">Senha</label>
                  <input
                    {...register('password', {
                      required: 'Senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'Senha deve ter pelo menos 6 caracteres',
                      },
                    })}
                    type="password"
                    className="input"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">{errors.password.message as string}</p>
                  )}
                </div>
              )}

              {isRegister && (
                <div className="flex items-start gap-2">
                  <input
                    {...register('acceptedTerms', { required: true })}
                    type="checkbox"
                    id="acceptedTerms"
                    className="mt-1"
                  />
                  <label htmlFor="acceptedTerms" className="text-sm text-muted-foreground">
                    Eu aceito os{' '}
                    <Link to="/terms-of-service" target="_blank" className="text-primary hover:underline">
                      Termos de Uso
                    </Link>
                    {' '}e a{' '}
                    <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline">
                      Política de Privacidade
                    </Link>
                  </label>
                </div>
              )}

              {!isRegister && !useEmailAccess && (
                <div className="text-right">
                  <Link to="/auth/forgot-password" className="text-sm text-primary-600 hover:underline">
                    Esqueci minha senha
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (isRegister && !acceptedTerms)}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={20} />}
                {useEmailAccess ? 'Enviar Link de Acesso' : isRegister ? 'Criar Conta' : 'Entrar'}
              </button>
            </form>
          )}

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
                // Manter email preenchido ao alternar entre login e registro
                const currentEmail = watch('email');
                if (currentEmail) {
                  setValue('email', currentEmail);
                }
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

