import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'primary' | 'blue' | 'green' | 'orange' | 'red';
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'primary' }: StatsCardProps) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {trend && (
            <p className={cn(
              'mt-1 text-xs',
              trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', colors[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
