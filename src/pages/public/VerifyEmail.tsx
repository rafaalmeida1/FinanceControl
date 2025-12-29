import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
        toast.success('Email verificado com sucesso!');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        toast.error(error?.response?.data?.message || 'Erro ao verificar email');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="card text-center">
          {status === 'loading' && (
            <div className="mb-6">
              <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary-600 dark:text-primary-400 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Verificando email...</h1>
              <p className="text-muted-foreground">Aguarde enquanto verificamos seu email.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Email Verificado!</h1>
              <p className="text-muted-foreground mb-4">
                Seu email foi verificado com sucesso. Você será redirecionado para o login em instantes.
              </p>
              <Link to="/login" className="btn-primary w-full">
                Ir para o login
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Erro na Verificação</h1>
              <p className="text-muted-foreground mb-4">
                O token de verificação é inválido ou expirou. Por favor, solicite um novo email de verificação.
              </p>
              <div className="space-y-2">
                <Link to="/login" className="btn-primary w-full block">
                  Voltar para o login
                </Link>
                <button
                  onClick={() => {
                    const email = prompt('Digite seu email para reenviar a verificação:');
                    if (email) {
                      authService.resendVerificationEmail(email)
                        .then(() => toast.success('Email de verificação reenviado!'))
                        .catch((err) => toast.error(err?.response?.data?.message || 'Erro ao reenviar email'));
                    }
                  }}
                  className="btn-secondary w-full"
                >
                  Reenviar email de verificação
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

