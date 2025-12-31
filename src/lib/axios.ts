import axios from 'axios';
import { authStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

// Determinar a baseURL baseado no ambiente
// Se VITE_API_URL estiver definido, usa ele
// Em produção, usar o domínio do backend
// Caso contrário, usa localhost para desenvolvimento
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Em produção, usar o domínio do backend
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    return 'https://api-finance-control.bitrafa.com.br/api/v1';
  }
  
  // Desenvolvimento local
  return 'http://localhost:3444/api/v1';
};

// Flag para evitar loops de redirecionamento
let isRedirectingToLogin = false;
const REDIRECT_COOLDOWN_KEY = 'auth_redirect_cooldown';
const REDIRECT_COOLDOWN_TIME = 5000; // 5 segundos

// Verificar se já estamos na página de login
const isOnLoginPage = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/login' || window.location.pathname.startsWith('/auth/');
};

// Verificar se está em cooldown de redirecionamento
const isInRedirectCooldown = () => {
  if (typeof window === 'undefined') return false;
  const cooldown = localStorage.getItem(REDIRECT_COOLDOWN_KEY);
  if (!cooldown) return false;
  const cooldownTime = parseInt(cooldown, 10);
  const now = Date.now();
  if (now - cooldownTime < REDIRECT_COOLDOWN_TIME) {
    return true;
  }
  localStorage.removeItem(REDIRECT_COOLDOWN_KEY);
  return false;
};

// Endpoints públicos que não devem disparar logout
const publicEndpoints = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/magic-link',
  '/auth/verify-magic-link',
  '/debtor/',
];

const isPublicEndpoint = (url: string | undefined) => {
  if (!url) return false;
  return publicEndpoints.some(endpoint => url.startsWith(endpoint));
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adicionar token apenas se não for endpoint público
api.interceptors.request.use(
  (config) => {
    // Não adicionar token JWT para endpoints públicos
    if (!isPublicEndpoint(config.url)) {
      const token = authStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Se o body for null, converter para objeto vazio para evitar erro de parse JSON
    if (config.data === null) {
      config.data = {};
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - tratar erros e refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Não tentar refresh token para endpoints públicos
    const isPublic = isPublicEndpoint(originalRequest.url);

    // Se erro 401 e não é retry e não é endpoint público
    if (error.response?.status === 401 && !originalRequest._retry && !isPublic) {
      originalRequest._retry = true;

      // Se já estamos na página de login, não redirecionar novamente
      if (isOnLoginPage()) {
        return Promise.reject(error);
      }

      // Se está em cooldown de redirecionamento, não redirecionar novamente
      if (isInRedirectCooldown() || isRedirectingToLogin) {
        return Promise.reject(error);
      }

      const refreshToken = authStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          }, {
            // Não adicionar token de autorização para refresh
            headers: {
              Authorization: undefined,
            },
          });

          authStore.getState().setTokens(data.accessToken, data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Token inválido ou expirado - fazer logout silencioso
          handleLogoutAndRedirect();
          return Promise.reject(refreshError);
        }
      } else {
        // Sem refresh token - fazer logout silencioso
        handleLogoutAndRedirect();
        return Promise.reject(error);
      }
    }

    // Mostrar toast de erro apenas se não for 401 (já tratado acima) e não for endpoint público
    if (error.response?.status !== 401 && !isPublic) {
      const message = error.response?.data?.message || 'Erro ao processar requisição';
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

// Função para fazer logout e redirecionar de forma segura
const handleLogoutAndRedirect = () => {
  // Evitar múltiplos redirecionamentos
  if (isRedirectingToLogin || isOnLoginPage() || isInRedirectCooldown()) {
    return;
  }

  isRedirectingToLogin = true;
  
  // Salvar timestamp do redirecionamento
  if (typeof window !== 'undefined') {
    localStorage.setItem(REDIRECT_COOLDOWN_KEY, Date.now().toString());
  }

  // Fazer logout
  authStore.getState().logout();

  // Mostrar toast apenas se não estiver na página de login
  if (!isOnLoginPage()) {
    toast.error('Sessão expirada. Por favor, faça login novamente.');
  }

  // Redirecionar apenas se não estiver na página de login
  if (!isOnLoginPage() && typeof window !== 'undefined') {
    // Usar replace para evitar adicionar ao histórico
    window.location.replace('/login');
  }

  // Resetar flag após um tempo
  setTimeout(() => {
    isRedirectingToLogin = false;
  }, 1000);
};

export default api;

