import { cn } from '@/shared/ui/utils/cn';
import { ArrowDownRight, ArrowUpRight, LucideIcon, Minus } from 'lucide-react';
import { ReactNode } from 'react';
import { formatearPorcentaje } from '@/shared/ui/utils/formatear-porcentaje';

export type KpiTone = 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const TONE_STYLES: Record<KpiTone, string> = {
  brand: 'bg-brand-muted text-brand',
  success: 'bg-success-muted text-success-foreground',
  danger: 'bg-danger-muted text-danger-foreground',
  warning: 'bg-warning-muted text-warning-foreground',
  info: 'bg-info-muted text-info-foreground',
  neutral: 'bg-surface-elevated text-foreground-muted',
};

export interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Variación porcentual respecto al período anterior. Positiva = crecimiento. */
  trendPct?: number | null;
  /** Texto descriptivo del trend (ej: "vs período anterior") */
  trendLabel?: string;
  icon?: LucideIcon;
  tone?: KpiTone;
  className?: string;
}

export function KpiCard({
  label,
  value,
  hint,
  trendPct,
  trendLabel,
  icon: Icon,
  tone = 'brand',
  className,
}: KpiCardProps) {
  const showTrend = trendPct !== undefined && trendPct !== null;
  const trendIsUp = (trendPct ?? 0) > 0;
  const trendIsDown = (trendPct ?? 0) < 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/80 bg-surface p-4 shadow-panel sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground-muted">
            {label}
          </p>
          <p className="font-display mt-2 truncate text-2xl font-bold tabular-nums text-foreground sm:text-[28px] sm:leading-9">
            {value}
          </p>
          {hint && (
            <p className="mt-1 truncate text-xs text-foreground-muted">{hint}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              TONE_STYLES[tone],
            )}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      {showTrend && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
              trendIsUp && 'bg-success-muted text-success-foreground',
              trendIsDown && 'bg-danger-muted text-danger-foreground',
              !trendIsUp && !trendIsDown && 'bg-surface-elevated text-foreground-muted',
            )}
          >
            {trendIsUp ? (
              <ArrowUpRight size={12} />
            ) : trendIsDown ? (
              <ArrowDownRight size={12} />
            ) : (
              <Minus size={12} />
            )}
            {formatearPorcentaje(Math.abs(trendPct ?? 0), 1)}
          </span>
          {trendLabel && (
            <span className="text-[11px] text-foreground-subtle">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
