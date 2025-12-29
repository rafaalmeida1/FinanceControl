import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HelpStep {
  title: string;
  content: string;
  image?: string; // URL ou path para imagem (opcional)
}

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: HelpStep[];
}

export function HelpDialog({ open, onOpenChange, title, description, steps }: HelpDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleClose = () => {
    setCurrentStep(0);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        'max-h-[90vh] flex flex-col p-0 gap-0',
        isMobile ? 'max-w-[95vw] w-[95vw]' : 'max-w-2xl'
      )}>
        <DialogHeader className={cn(
          'flex-shrink-0 border-b',
          isMobile ? 'px-4 pt-4 pb-3' : 'px-6 pt-6 pb-4'
        )}>
          <DialogTitle className={cn('font-bold', isMobile ? 'text-lg' : 'text-xl')}>
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className={cn('mt-1', isMobile && 'text-xs')}>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Conteúdo do passo atual */}
        <div className={cn(
          'flex-1 overflow-y-auto',
          isMobile ? 'px-4 py-4' : 'px-6 py-6'
        )}>
          <div className="space-y-4">
            {/* Indicador de progresso */}
            <div className="flex items-center gap-2 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-2 flex-1 rounded-full transition-colors',
                    index <= currentStep
                      ? 'bg-primary'
                      : 'bg-muted'
                  )}
                />
              ))}
            </div>

            {/* Número do passo */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'font-medium text-muted-foreground',
                isMobile ? 'text-xs' : 'text-sm'
              )}>
                Passo {currentStep + 1} de {steps.length}
              </span>
            </div>

            {/* Título do passo */}
            <h3 className={cn('font-semibold', isMobile ? 'text-base' : 'text-lg')}>
              {currentStepData.title}
            </h3>

            {/* Conteúdo do passo */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className={cn(
                'text-muted-foreground leading-relaxed whitespace-pre-line',
                isMobile ? 'text-sm' : 'text-base'
              )}>
                {currentStepData.content}
              </p>
            </div>

            {/* Imagem (se houver) */}
            {currentStepData.image && (
              <div className="mt-4 rounded-lg overflow-hidden border bg-muted/50">
                <img
                  src={currentStepData.image}
                  alt={currentStepData.title}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer com navegação */}
        <div className={cn(
          'flex items-center justify-between border-t flex-shrink-0 bg-background',
          isMobile ? 'px-4 py-3' : 'px-6 py-4'
        )}>
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={cn(
              'flex items-center gap-2 touch-manipulation',
              isMobile ? 'text-sm h-9 px-3' : ''
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            {!isMobile && 'Anterior'}
          </Button>

          <div className={cn(
            'text-muted-foreground font-medium',
            isMobile ? 'text-xs' : 'text-sm'
          )}>
            {currentStep + 1} / {steps.length}
          </div>

          <Button
            onClick={handleNext}
            className={cn(
              'flex items-center gap-2 touch-manipulation',
              isMobile ? 'text-sm h-9 px-4' : ''
            )}
          >
            {currentStep === steps.length - 1 ? 'Finalizar' : isMobile ? 'Próximo' : 'Próximo'}
            {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

