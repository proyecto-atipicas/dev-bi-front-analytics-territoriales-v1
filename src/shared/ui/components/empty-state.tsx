import { cn } from '@/shared/ui/utils/cn';
import { AlertCircle, Inbox, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export type EmptyStateTone = 'neutral' | 'danger' | 'info' | 'warning';

const TONE_CLASSES: Record<EmptyStateTone, { wrap: string; icon: string }> = {
  neutral: {
    wrap: 'border-dashed border-border-strong/70 bg-background/60 text-foreground-muted',
    icon: 'text-foreground-subtle',
  },
  danger: {
    wrap: 'border-danger/30 bg-danger-muted/40 text-danger',
    icon: 'text-danger',
  },
  info: {
    wrap: 'border-info/30 bg-info-muted/40 text-info',
    icon: 'text-info',
  },
  warning: {
    wrap: 'border-warning/30 bg-warning-muted/40 text-warning',
    icon: 'text-warning',
  },
};

export interface EmptyStateProps {
  title?: string;
  description?: ReactNode;
  icon?: LucideIcon;
  tone?: EmptyStateTone;
  action?: ReactNode;
  className?: string;
  /** Altura mínima cómoda para el contenedor (ej. 'min-h-[280px]'). */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<EmptyStateProps['size']>, string> = {
  sm: 'min-h-[140px] py-6 px-4',
  md: 'min-h-[220px] py-8 px-5',
  lg: 'min-h-[320px] py-10 px-6',
};

export function EmptyState({
  title,
  description,
  icon,
  tone = 'neutral',
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const t = TONE_CLASSES[tone];
  const Icon = icon ?? (tone === 'danger' ? AlertCircle : Inbox);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-xl border text-center',
        t.wrap,
        SIZE[size],
        className,
      )}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icon size={22} className={cn('shrink-0', t.icon)} aria-hidden />
      {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
      {description && (
        <p className="max-w-prose text-xs text-foreground-muted">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
