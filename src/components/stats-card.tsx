import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: React.ReactNode;
  description?: string;
}

export function StatsCard({
  title,
  value,
  change,
  trend,
  icon,
  description,
}: StatsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
              {change && (
                <div
                  className={cn(
                    'flex items-center text-sm font-medium',
                    trend === 'up' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend === 'up' ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  {change}
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

