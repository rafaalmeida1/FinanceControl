import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { authStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const navigate = useNavigate();
  const { user, setUser, setTokens, logout: logoutStore } = authStore();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens(data.accessToken, data.refreshToken);
      toast.success('Login realizado com sucesso!');
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    },
    onError: () => {
      toast.error('Credenciais inválidas');
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, name }: { email: string; password: string; name?: string }) =>
      authService.register(email, password, name),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens(data.accessToken, data.refreshToken);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard');
    },
  });

  const magicLinkMutation = useMutation({
    mutationFn: (email: string) => authService.sendMagicLink(email),
    onSuccess: () => {
      toast.success('Link de acesso enviado! Verifique seu email.');
    },
  });

  const verifyMagicLinkMutation = useMutation({
    mutationFn: (token: string) => authService.verifyMagicLink(token),
    onSuccess: (data) => {
      setUser(data.user);
      setTokens(data.accessToken, data.refreshToken);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      logoutStore();
      toast.success('Logout realizado!');
      navigate('/login');
    },
  });

  return {
    user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    sendMagicLink: magicLinkMutation.mutate,
    verifyMagicLink: verifyMagicLinkMutation.mutate,
    logout: logoutMutation.mutate,
    isLoading:
      loginMutation.isPending ||
      registerMutation.isPending ||
      magicLinkMutation.isPending ||
      verifyMagicLinkMutation.isPending ||
      logoutMutation.isPending,
  };
};

