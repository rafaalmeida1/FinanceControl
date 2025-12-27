import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function MagicLink() {
  const { token } = useParams<{ token: string }>();
  const { verifyMagicLink } = useAuth();

  useEffect(() => {
    if (token) {
      verifyMagicLink(token);
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="card text-center">
        <Loader2 className="animate-spin mx-auto mb-4" size={48} />
        <h2 className="text-2xl font-bold mb-2">Verificando acesso...</h2>
        <p className="text-gray-600 dark:text-gray-400">Aguarde enquanto validamos seu acesso</p>
      </div>
    </div>
  );
}

