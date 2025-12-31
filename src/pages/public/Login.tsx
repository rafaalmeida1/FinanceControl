import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { authStore } from '@/stores/authStore';
import { financialProfileService } from '@/services/financial-profile.service';
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  // Login - Etapa 1: Verificar email
  const handleLoginStep1 = async (emailValue: string) => {
    setIsLoading(true);
    try {
      await authService.loginStep1(emailValue);
      setEmail(emailValue);
      setStep('otp');
      localStorage.setItem(LAST_EMAIL_KEY, emailValue);
      toast.success('Email encontrado. Digite sua senha OTP.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Email não encontrado');
    } finally {
      setIsLoading(false);
    }
  };

  // Login - Etapa 2: Validar senha OTP
  const handleLoginStep2 = async () => {
    if (password.length !== 6) {
      toast.error('Digite sua senha OTP completa (6 dígitos)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.loginStep2(email, password);
      setUser(response.user);
      setTokens(response.accessToken, response.refreshToken);
      toast.success('Login realizado com sucesso!');
      
      // Verificar onboarding
      if (response.user.role !== 'ADMIN') {
        try {
          const profile = await financialProfileService.get();
          if (!profile || !profile.onboardingCompleted) {
            navigate('/onboarding');
            return;
          }
        } catch (error) {
          // Se não conseguir buscar perfil, redirecionar para onboarding
          navigate('/onboarding');
          return;
        }
      }
      
      navigate(response.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Senha inválida');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  // Registro - Etapa 1: Validar email
  const handleRegisterStep1 = async () => {
    if (!acceptedTerms) {
      toast.error('Você deve aceitar os termos de uso e política de privacidade');
      return;
    }

    if (!name || name.trim().length === 0) {
      toast.error('Digite seu nome');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.registerStep1(email, name);
      setSessionToken(response.sessionToken);
      setRegisterStep('step2');
      localStorage.setItem(LAST_EMAIL_KEY, email);
      toast.success('Email válido. Defina sua senha OTP.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao validar email');
    } finally {
      setIsLoading(false);
    }
  };

  // Registro - Etapa 2: Criar conta com senha OTP
  const handleRegisterStep2 = async () => {
    if (password.length !== 6) {
      toast.error('Digite sua senha OTP completa (6 dígitos)');
      return;
    }

    if (confirmPassword.length !== 6) {
      toast.error('Digite a confirmação da senha OTP completa (6 dígitos)');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      setPassword('');
      setConfirmPassword('');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.registerStep2(email, password, confirmPassword, sessionToken);
      setUser(response.user);
      setTokens(response.accessToken, response.refreshToken);
      toast.success('Conta criada com sucesso!');
      
      // Após registro, sempre redirecionar para onboarding
      if (response.user.role !== 'ADMIN') {
        navigate('/onboarding');
      } else {
        navigate('/admin');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar conta');
      setPassword('');
      setConfirmPassword('');
    } finally {
      setIsLoading(false);
    }
  };


  const handleBack = () => {
    if (isRegister && registerStep === 'step2') {
      setRegisterStep('step1');
      setPassword('');
      setConfirmPassword('');
    } else if (step === 'otp' && !isRegister) {
      setStep('email');
      setPassword('');
    } else {
      setIsRegister(false);
      setRegisterStep('step1');
      setStep('email');
      setPassword('');
      setConfirmPassword('');
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
                : (step === 'email' ? 'Entre na sua conta' : 'Digite sua senha OTP')}
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

          {/* Login - Etapa Senha OTP */}
          {!isRegister && step === 'otp' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Digite sua senha</h2>
                <p className="text-muted-foreground text-sm">
                  Digite sua senha OTP de 6 dígitos
                  <br />
                  <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={password}
                  onChange={(value) => {
                    setPassword(value);
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
                disabled={isLoading || password.length !== 6}
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
                <h2 className="text-xl font-bold mb-2">Defina sua senha</h2>
                <p className="text-muted-foreground text-sm">
                  Escolha uma senha OTP de 6 dígitos
                  <br />
                  <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label mb-2">Senha OTP</label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={password}
                      onChange={setPassword}
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
                </div>

                <div>
                  <label className="label mb-2">Confirmar Senha OTP</label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
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
                </div>
              </div>

              <button
                onClick={handleRegisterStep2}
                disabled={isLoading || password.length !== 6 || confirmPassword.length !== 6}
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
