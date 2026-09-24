import { cn } from '@/shared/ui/utils/cn';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface SectionHeadingProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

/**
 * Encabezado ligero para secciones dentro de una página. Más compacto que
 * `CardHeader` y sin contorno: ideal para introducir grupos de tarjetas.
 */
export function SectionHeading({
  title,
  description,
  icon: Icon,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon && <Icon size={20} className="mt-1 shrink-0 text-brand" aria-hidden />}
        <div className="min-w-0">
          <h2 className="font-display truncate text-lg font-bold text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-foreground-muted">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
