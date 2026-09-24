import { cn } from '@/shared/ui/utils/cn';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  LucideIcon,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from './card';
import { Skeleton } from './skeleton';

export type InsightTone = 'positive' | 'negative' | 'warning' | 'info';

const TONE: Record<
  InsightTone,
  { icon: LucideIcon; iconClass: string; chipClass: string; chipLabel: string }
> = {
  positive: {
    icon: CheckCircle2,
    iconClass: 'text-success-foreground',
    chipClass: 'bg-success-muted text-success-foreground',
    chipLabel: 'Positivo',
  },
  negative: {
    icon: TrendingUp,
    iconClass: 'text-danger-foreground rotate-180',
    chipClass: 'bg-danger-muted text-danger-foreground',
    chipLabel: 'Crítico',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning-foreground',
    chipClass: 'bg-warning-muted text-warning-foreground',
    chipLabel: 'Atención',
  },
  info: {
    icon: Info,
    iconClass: 'text-info-foreground',
    chipClass: 'bg-info-muted text-info-foreground',
    chipLabel: 'Información',
  },
};

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  description: string;
}

export function InsightsPanel({
  insights,
  className,
  cargando = false,
}: {
  insights: Insight[];
  className?: string;
  /**
   * Los datos que alimentan las lecturas son de otra combinación de filtros
   * y la nueva aún no llega: se muestra la carga en lugar de lecturas viejas.
   */
  cargando?: boolean;
}) {
  return (
    <Card className={className} aria-busy={cargando}>
      <CardHeader title="Insights y alertas" icon={Sparkles} />
      <CardBody className="space-y-3">
        {cargando ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-lg border border-border/80 p-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))
        ) : insights.length === 0 ? (
          <p className="py-4 text-center text-sm text-foreground-muted">
            No hay alertas para los filtros aplicados.
          </p>
        ) : (
          insights.map((i) => {
            const config = TONE[i.tone];
            const Icon = config.icon;
            return (
              <div
                key={i.id}
                className="flex items-start gap-3 rounded-lg border border-border/80 bg-background/50 p-3"
              >
                <Icon
                  size={18}
                  className={cn('mt-0.5 shrink-0', config.iconClass)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {i.title}
                    </h4>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        config.chipClass,
                      )}
                    >
                      {config.chipLabel}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {i.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}
