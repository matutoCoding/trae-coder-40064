import React from 'react';
import { cn } from '../lib/utils';
import { CheckCircle, Clock, AlertTriangle, XCircle, Loader } from 'lucide-react';

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'in_progress';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  className?: string;
  showIcon?: boolean;
}

const statusConfig = {
  success: {
    class: 'bg-success/15 text-success border-success/30',
    icon: <CheckCircle size={14} />,
  },
  warning: {
    class: 'bg-warning/15 text-warning border-warning/30',
    icon: <AlertTriangle size={14} />,
  },
  danger: {
    class: 'bg-danger/15 text-danger border-danger/30',
    icon: <XCircle size={14} />,
  },
  info: {
    class: 'bg-accent/15 text-accent border-accent/30',
    icon: <CheckCircle size={14} />,
  },
  pending: {
    class: 'bg-carbon-600/50 text-carbon-300 border-carbon-600',
    icon: <Clock size={14} />,
  },
  in_progress: {
    class: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: <Loader size={14} className="animate-spin" />,
  },
};

export function StatusBadge({ status, label, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.info;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
      config.class,
      className
    )}>
      {showIcon && config.icon}
      {label}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'accent' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = 'accent',
  showLabel = false,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorClasses = {
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('flex-1 bg-carbon-700 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-carbon-300 min-w-[45px] text-right">
          {percentage.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = '#00d4ff',
  label,
  sublabel,
}: CircularProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#363647"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-2xl font-bold text-carbon-100">{label}</span>}
        {sublabel && <span className="text-xs text-carbon-400 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}
