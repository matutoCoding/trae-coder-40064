import React from 'react';
import { cn } from '../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DataCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: 'accent' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan';
  className?: string;
}

export default function DataCard({
  title,
  value,
  unit,
  icon,
  trend,
  color = 'accent',
  className,
}: DataCardProps) {
  const colorClasses = {
    accent: 'from-accent/20 to-accent/5 text-accent border-accent/30',
    success: 'from-success/20 to-success/5 text-success border-success/30',
    warning: 'from-warning/20 to-warning/5 text-warning border-warning/30',
    danger: 'from-danger/20 to-danger/5 text-danger border-danger/30',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30',
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30',
  };

  return (
    <div className={cn(
      'card p-5 relative overflow-hidden group hover:shadow-carbon transition-all duration-300',
      className
    )}>
      <div className={cn(
        'absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-50 -translate-y-1/2 translate-x-1/2',
        color === 'accent' && 'bg-accent/30',
        color === 'success' && 'bg-success/30',
        color === 'warning' && 'bg-warning/30',
        color === 'danger' && 'bg-danger/30',
        color === 'purple' && 'bg-purple-500/30',
        color === 'cyan' && 'bg-cyan-500/30',
      )} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm text-carbon-400 font-medium">{title}</p>
          {icon && (
            <div className={cn(
              'p-2.5 rounded-lg bg-gradient-to-br border',
              colorClasses[color]
            )}>
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-carbon-100 tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-sm text-carbon-400 mb-1">{unit}</span>
          )}
        </div>
        
        {trend && (
          <div className={cn(
            'flex items-center gap-1 mt-3 text-sm',
            trend.isUp ? 'text-success' : 'text-danger'
          )}>
            {trend.isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="font-medium">{Math.abs(trend.value)}%</span>
            <span className="text-carbon-500">较昨日</span>
          </div>
        )}
      </div>
    </div>
  );
}
