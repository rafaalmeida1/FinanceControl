import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HelpIconButtonProps {
  onClick: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
}

export function HelpIconButton({ 
  onClick, 
  className, 
  size = 'sm',
  variant = 'ghost'
}: HelpIconButtonProps) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  };

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn(
        'rounded-full touch-manipulation',
        size === 'sm' && 'h-8 w-8',
        size === 'md' && 'h-9 w-9',
        size === 'lg' && 'h-10 w-10',
        className
      )}
      onClick={onClick}
      title="Ajuda"
    >
      <HelpCircle className={cn(sizeClasses[size])} />
      <span className="sr-only">Ajuda</span>
    </Button>
  );
}

