import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

export function ChartWrapper({
  title,
  description,
  children,
  isLoading,
  className,
}: ChartWrapperProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-[350px] w-full" />
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

