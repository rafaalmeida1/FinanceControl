import { useCreateMovement } from '@/contexts/CreateMovementContext';
import {
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickAddMovementProps {
  onClose?: () => void;
}

export function QuickAddMovement(_props: QuickAddMovementProps) {
  const { setOpen } = useCreateMovement();

  return (
    <Card 
      className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 hover:border-primary/40 transition-all cursor-pointer group"
      onClick={() => setOpen(true)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-4 sm:p-6 relative">
        {/* Mobile: Layout vertical empilhado */}
        <div className="flex flex-col sm:hidden gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors flex-shrink-0">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-foreground">
                Fez alguma conta nova?
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adicione rapidamente uma nova movimentação
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="w-full group-hover:scale-[1.02] transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            Adicionar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Desktop: Layout horizontal */}
        <div className="hidden sm:flex sm:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
              <Receipt className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground mb-1">
              Fez alguma conta nova?
            </h3>
            <p className="text-sm text-muted-foreground">
              Adicione rapidamente uma nova movimentação
            </p>
          </div>
          <Button 
            size="sm" 
            className="flex-shrink-0 group-hover:scale-105 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
          >
            Adicionar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

