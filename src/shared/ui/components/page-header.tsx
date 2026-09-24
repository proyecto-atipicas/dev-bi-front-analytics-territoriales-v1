import { cn } from '@/shared/ui/utils/cn';
import { ReactNode } from 'react';
import { Breadcrumbs } from '../layout/breadcrumbs';

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Oculta breadcrumbs (cuando ya están en el header global). */
  hideBreadcrumbs?: boolean;
}

export function PageHeader({
  title,
  description,
  action,
  className,
  hideBreadcrumbs = false,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {!hideBreadcrumbs && <Breadcrumbs />}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display truncate text-lg font-bold text-foreground sm:text-xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-xs text-foreground-muted sm:text-sm">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
