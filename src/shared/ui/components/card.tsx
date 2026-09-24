import { cn } from '@/shared/ui/utils/cn';
import { LucideIcon } from 'lucide-react';
import { HTMLAttributes, ReactNode } from 'react';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Si true, el card se comporta como un contenedor "flat" sin sombra. */
  flat?: boolean;
}

export function Card({ className, children, flat = false, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-surface',
        flat ? 'shadow-none' : 'shadow-panel',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  /** Tamaño compacto para tarjetas pequeñas. */
  dense?: boolean;
}

export function CardHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
  dense = false,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-border/70',
        dense ? 'px-4 py-3' : 'px-5 py-4',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {Icon && (
          <Icon
            size={dense ? 16 : 18}
            className="mt-[3px] shrink-0 text-brand"
            aria-hidden
          />
        )}
        <div className="min-w-0">
          {/* Hasta dos líneas: en móvil los títulos largos se cortaban. */}
          <h3
            className={cn(
              'line-clamp-2 font-semibold text-foreground sm:line-clamp-1',
              dense ? 'text-sm' : 'text-[15px]',
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const PADDING: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
}

export function CardBody({
  children,
  className,
  padding = 'md',
  ...rest
}: CardBodyProps) {
  return (
    <div className={cn(PADDING[padding], className)} {...rest}>
      {children}
    </div>
  );
}
