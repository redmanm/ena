import { cn } from '@/lib/utils';

interface StatCardProps {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  bgColor?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'teal';
}

export function StatCard({ icon, title, value, subtitle, bgColor = 'blue' }: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
    teal: 'bg-teal-50',
  };

  const iconColorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    teal: 'bg-teal-100 text-teal-600',
  };

  return (
    <div className={cn('rounded-2xl border border-primary/20 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 hover:border-primary/40 group', colorMap[bgColor])}>
      {icon && (
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6', iconColorMap[bgColor])}>
          {icon}
        </div>
      )}
      <p className="text-sm text-muted-foreground mb-2 font-medium">{title}</p>
      <div className="flex items-baseline justify-between">
        <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">{value}</h3>
        {subtitle && <p className="text-xs text-muted-foreground font-semibold">{subtitle}</p>}
      </div>
    </div>
  );
}
