import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { authStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const LAST_EMAIL_KEY = 'lastLoginEmail';

export default function Login() {
  const navigate = useNavigate();
  const { setUser, setTokens } = authStore();
  
  // Estados
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [isRegister, setIsRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState<'step1' | 'step2'>('step1');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Carregar último email usado
  useEffect(() => {
    const lastEmail = localStorage.getItem(LAST_EMAIL_KEY);
    if (lastEmail) {
      setEmail(lastEmail);
      setStep('otp'); // Ir direto para OTP se tiver email salvo
    }
  }, []);

  // Login - Etapa 1: Solicitar OTP
  const handleLoginStep1 = async (emailValue: string) => {
    setIsLoading(true);
    try {
      const response = await authService.loginStep1(emailValue);
      setEmail(emailValue);
      setSessionToken(response.sessionToken);
      setStep('otp');
      localStorage.setItem(LAST_EMAIL_KEY, emailValue);
      
      if (response.otp && import.meta.env.DEV) {
        toast.success(`OTP (dev): ${response.otp}`, { duration: 10000 });
      } else {
        toast.success('Código OTP enviado para seu email!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao solicitar código OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Login - Etapa 2: Validar OTP
  const handleLoginStep2 = async () => {
    if (otp.length !== 6) {
      toast.error('Digite o código OTP completo');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.loginStep2(email, otp, sessionToken);
      setUser(response.user);
      setTokens(response.accessToken, response.refreshToken);
      toast.success('Login realizado com sucesso!');
      navigate(response.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Código OTP inválido');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  // Registro - Etapa 1: Solicitar OTP
  const handleRegisterStep1 = async () => {
    if (!acceptedTerms) {
      toast.error('Você deve aceitar os termos de uso e política de privacidade');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.registerStep1(email, name);
      setSessionToken(response.sessionToken);
      setRegisterStep('step2');
      localStorage.setItem(LAST_EMAIL_KEY, email);
      
      if (response.otp && import.meta.env.DEV) {
        toast.success(`OTP (dev): ${response.otp}`, { duration: 10000 });
      } else {
        toast.success('Código OTP enviado para seu email!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao solicitar código OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Registro - Etapa 2: Validar OTP e criar conta
  const handleRegisterStep2 = async () => {
    if (otp.length !== 6) {
      toast.error('Digite o código OTP completo');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.registerStep2(email, otp, sessionToken);
      setUser(response.user);
      setTokens(response.accessToken, response.refreshToken);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Código OTP inválido');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };


  const handleBack = () => {
    if (isRegister && registerStep === 'step2') {
      setRegisterStep('step1');
      setOtp('');
    } else if (step === 'otp' && !isRegister) {
      setStep('email');
      setOtp('');
    } else {
      setIsRegister(false);
      setRegisterStep('step1');
      setStep('email');
      setOtp('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              Finance Control
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isRegister 
                ? (registerStep === 'step1' ? 'Criar nova conta' : 'Verificar código')
                : (step === 'email' ? 'Entre na sua conta' : 'Digite o código OTP')}
            </p>
          </div>

          {/* Login - Etapa Email */}
          {!isRegister && step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={() => email && handleLoginStep1(email)}
                disabled={isLoading || !email}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={20} />}
                Continuar
              </button>

              <div className="text-center">
                <button
                  onClick={() => setIsRegister(true)}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Não tem conta? Registre-se
                </button>
              </div>
            </div>
          )}

          {/* Login - Etapa OTP */}
          {!isRegister && step === 'otp' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Código enviado!</h2>
                <p className="text-muted-foreground text-sm">
                  Digite o código de 6 dígitos enviado para
                  <br />
                  <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    // Auto-submit quando completar 6 dígitos
                    if (value.length === 6 && !isLoading) {
                      setTimeout(() => handleLoginStep2(), 100);
                    }
                  }}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <button
                onClick={handleLoginStep2}
                disabled={isLoading || otp.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={20} />}
                Entrar
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={handleBack}
                  className="text-primary-600 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button
                  onClick={() => handleLoginStep1(email)}
                  disabled={isLoading}
                  className="text-primary-600 hover:underline"
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {/* Registro - Etapa 1 */}
          {isRegister && registerStep === 'step1' && (
            <div className="space-y-4">
              <div>
                <label className="label">Nome (opcional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Seu nome"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptedTerms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="acceptedTerms" className="text-sm text-muted-foreground">
                  Eu aceito os{' '}
                  <a href="/terms-of-service" target="_blank" className="text-primary hover:underline">
                    Termos de Uso
                  </a>
                  {' '}e a{' '}
                  <a href="/privacy-policy" target="_blank" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                </label>
              </div>

              <button
                onClick={handleRegisterStep1}
                disabled={isLoading || !email || !acceptedTerms}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={20} />}
                Continuar
              </button>

              <div className="text-center">
                <button
                  onClick={handleBack}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Já tem conta? Entre aqui
                </button>
              </div>
            </div>
          )}

          {/* Registro - Etapa 2 */}
          {isRegister && registerStep === 'step2' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Código enviado!</h2>
                <p className="text-muted-foreground text-sm">
                  Digite o código de 6 dígitos enviado para
                  <br />
                  <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    // Auto-submit quando completar 6 dígitos
                    if (value.length === 6 && !isLoading) {
                      setTimeout(() => handleRegisterStep2(), 100);
                    }
                  }}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <button
                onClick={handleRegisterStep2}
                disabled={isLoading || otp.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="animate-spin" size={20} />}
                Criar Conta
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={handleBack}
                  className="text-primary-600 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
                <button
                  onClick={handleRegisterStep1}
                  disabled={isLoading}
                  className="text-primary-600 hover:underline"
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
