import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({ 
  length = 6, 
  value, 
  onChange, 
  onComplete,
  disabled = false,
  className 
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Sincronizar value externo com estado interno
    if (value !== otp.join('')) {
      const newOtp = value.split('').slice(0, length);
      const paddedOtp = [...newOtp, ...new Array(length - newOtp.length).fill('')];
      setOtp(paddedOtp);
    }
  }, [value, length]);

  const handleChange = (index: number, newValue: string) => {
    // Aceitar apenas números
    if (newValue && !/^\d$/.test(newValue)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);

    const otpValue = newOtp.join('');
    onChange(otpValue);

    // Mover para próximo input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Chamar onComplete quando todos os campos estiverem preenchidos
    if (otpValue.length === length && onComplete) {
      onComplete(otpValue);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    
    if (pastedData) {
      const newOtp = pastedData.split('').concat(new Array(length - pastedData.length).fill(''));
      setOtp(newOtp);
      onChange(pastedData);
      
      if (pastedData.length === length && onComplete) {
        onComplete(pastedData);
      }
      
      // Focar no último input preenchido ou no próximo vazio
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={cn('flex gap-2 justify-center', className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-bold rounded-lg border-2',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'transition-all duration-200',
            'bg-background text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
      ))}
    </div>
  );
}

