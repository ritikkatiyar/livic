import React from 'react';
import { PropertyType } from '@/types/property';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'indigo' | 'purple' | 'outline';

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 font-semibold',
    indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-semibold',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold',
    outline: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function PropertyTypeBadge({ type }: { type: PropertyType }) {
  const labels: Record<PropertyType, { label: string; variant: BadgeProps['variant'] }> = {
    RENTAL: { label: 'Rental Apartment', variant: 'indigo' },
    HOSTEL: { label: 'Co-Living / Hostel', variant: 'purple' },
    SOCIETY: { label: 'Gated Society', variant: 'success' },
    MESS: { label: 'Mess & Dining', variant: 'warning' },
    INDIVIDUAL: { label: 'Independent House', variant: 'default' },
  };

  const config = labels[type] || { label: type, variant: 'default' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
