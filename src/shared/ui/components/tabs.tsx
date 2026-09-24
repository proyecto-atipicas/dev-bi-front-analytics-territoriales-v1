'use client';

import { cn } from '@/shared/ui/utils/cn';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface TabOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  options: TabOption[];
  className?: string;
  /** Render como pills (default) o segmented (todo en un solo bloque continuo) */
  variant?: 'pills' | 'segmented';
}

export function Tabs({
  value,
  onChange,
  options,
  className,
  variant = 'pills',
}: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border bg-background p-1',
        '[scrollbar-width:thin]',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={opt.disabled}
            onClick={() => !opt.disabled && onChange(opt.value)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm transition-colors duration-150',
              variant === 'segmented' && 'rounded-md',
              active
                ? 'bg-surface font-semibold text-foreground shadow-soft ring-1 ring-border/80'
                : 'font-medium text-foreground-muted hover:text-foreground',
              opt.disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-foreground-muted',
            )}
          >
            {Icon && <Icon size={15} className={cn('shrink-0', active && 'text-brand')} />}
            <span className="whitespace-nowrap">{opt.label}</span>
            {opt.badge && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  active
                    ? 'bg-brand-muted text-brand'
                    : 'bg-surface text-foreground-muted',
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
