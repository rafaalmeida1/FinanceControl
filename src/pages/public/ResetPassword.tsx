import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const resetMutation = useMutation({
    mutationFn: (data: { newPassword: string; confirmPassword: string }) =>
      authService.resetPassword(token!, data.newPassword, data.confirmPassword),
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length !== 6 || confirmPassword.length !== 6) {
      toast.error('A senha deve ter 6 dígitos');
      return;
    }
    if (!/^\d+$/.test(newPassword) || !/^\d+$/.test(confirmPassword)) {
      toast.error('A senha deve conter apenas números');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    resetMutation.mutate({ newPassword, confirmPassword });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-2xl font-bold mb-6 text-center">Redefinir Senha</h1>
          <p className="text-center text-muted-foreground mb-6">
            Defina uma nova senha OTP de 6 dígitos
          </p>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-center block">Nova Senha OTP</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={newPassword}
                  onChange={setNewPassword}
                  disabled={resetMutation.isPending}
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
            <div className="space-y-2">
              <Label className="text-center block">Confirmar Senha OTP</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={resetMutation.isPending}
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
            <button
              type="submit"
              disabled={resetMutation.isPending || newPassword.length !== 6 || confirmPassword.length !== 6}
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

