'use client';

import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { FiltroPoblacional } from '../../domain/entities';
import { esSinDefinir, UltimaMedicion } from './ultima-medicion';

const fmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/**
 * Tira de lectura rápida de la última medición: qué opción encabeza, con qué
 * ventaja y cuánta gente no se define.
 */
export function KpisPoblacional({
  medicion,
  filtro,
}: {
  medicion: UltimaMedicion;
  filtro: FiltroPoblacional;
}) {
  const { puntos, periodo, isLoading, activo } = medicion;
  if (!activo) return null;

  const definidos = puntos.filter((p) => !esSinDefinir(p.criterio));
  const [primero, segundo] = definidos;
  const sinDefinir = puntos.filter((p) => esSinDefinir(p.criterio));
  const totalSinDefinir = sinDefinir.reduce((a, p) => a + p.valor, 0);

  const indicadores = [
    primero && {
      id: 'lider',
      etiqueta: 'Mayor valor',
      valor: fmt.format(primero.valor),
      detalle: primero.criterio,
    },
    primero &&
      segundo && {
        id: 'ventaja',
        etiqueta: 'Diferencia con el segundo',
        valor: `${fmt.format(primero.valor - segundo.valor)} pts`,
        detalle: `Sobre ${segundo.criterio}`,
      },
    sinDefinir.length > 0 && {
      id: 'sin-definir',
      etiqueta: 'Sin opinión definida',
      valor: fmt.format(totalSinDefinir),
      detalle: sinDefinir.map((p) => p.criterio).join(', '),
    },
    periodo && {
      id: 'periodo',
      etiqueta: 'Última medición',
      valor: periodo,
      detalle: [filtro.fuente, `${puntos.length} criterios`].filter(Boolean).join(', '),
    },
  ].filter(Boolean) as { id: string; etiqueta: string; valor: string; detalle: string }[];

  return (
    <section
      aria-label="Lectura de la última medición"
      className="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-panel"
    >
      <div
        className={cn(
          'grid grid-cols-1 gap-px bg-border/70',
          // Tantas columnas como indicadores haya: sin celdas vacías.
          isLoading || indicadores.length === 4
            ? 'sm:grid-cols-2 xl:grid-cols-4'
            : indicadores.length === 3
              ? 'sm:grid-cols-3'
              : indicadores.length === 2 && 'sm:grid-cols-2',
        )}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 bg-surface px-5 py-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-40" />
              </div>
            ))
          : indicadores.map((ind) => (
              <div key={ind.id} className="flex min-w-0 flex-col gap-1 bg-surface px-5 py-4">
                <p className="text-xs font-medium text-foreground-muted">{ind.etiqueta}</p>
                <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                  {ind.valor}
                </p>
                <p className="line-clamp-2 text-xs leading-snug text-foreground-muted" title={ind.detalle}>
                  {ind.detalle}
                </p>
              </div>
            ))}
      </div>
    </section>
  );
}

/**
 * Resultado por criterio como barras horizontales ordenadas. Reemplaza al
 * radar como vista principal: con 10+ criterios de nombres largos (fórmulas
 * presidenciales) el radar recortaba y encimaba las etiquetas.
 */
export function BarrasCriterios({
  medicion,
  anteriores,
}: {
  medicion: UltimaMedicion;
  anteriores?: Map<string, number>;
}) {
  const { puntos, isLoading, activo } = medicion;

  if (!activo) {
    return (
      <EmptyState size="md" description="Seleccione una referencia para ver el resultado por criterio." />
    );
  }
  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (puntos.length === 0) {
    return <EmptyState size="md" description="No hay datos para el último periodo." />;
  }

  return <ListaBarrasCriterios puntos={puntos} anteriores={anteriores} />;
}

/**
 * Barras horizontales ordenadas de mayor a menor con el nombre completo de
 * cada criterio (sin recortes). La primera opción con preferencia definida
 * se destaca; "NS/NR" y similares van en gris para no competir con ellas.
 */
export function ListaBarrasCriterios({
  puntos,
  anteriores,
}: {
  puntos: { criterio: string; valor: number }[];
  /** Valores de la medición anterior: se muestra cuánto subió o bajó cada uno. */
  anteriores?: Map<string, number>;
}) {
  const ordenados = [...puntos].sort((a, b) => b.valor - a.valor);
  const max = Math.max(...ordenados.map((p) => p.valor), 0);
  const primeroDefinido = ordenados.find((p) => !esSinDefinir(p.criterio));

  return (
    <ol className="space-y-2.5" aria-label="Resultado por criterio, de mayor a menor">
      {ordenados.map((p) => {
        const sinDefinir = esSinDefinir(p.criterio);
        const destacado = p === primeroDefinido;
        return (
          <li key={p.criterio} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1">
            <span
              className={cn(
                'text-xs leading-snug',
                destacado ? 'font-semibold text-foreground' : 'text-foreground',
                sinDefinir && 'text-foreground-muted',
              )}
            >
              {p.criterio}
            </span>
            <span className="flex items-baseline gap-2 text-xs tabular-nums">
              {anteriores && (
                <Variacion actual={p.valor} anterior={anteriores.get(p.criterio)} />
              )}
              <span
                className={cn(
                  destacado ? 'font-bold text-foreground' : 'font-medium text-foreground-muted',
                )}
              >
                {fmt.format(p.valor)}
              </span>
            </span>
            <div className="col-span-2 h-2 overflow-hidden rounded-full bg-surface-elevated" aria-hidden>
              <div
                className={cn(
                  'h-full rounded-full',
                  destacado ? 'bg-brand' : sinDefinir ? 'bg-border-strong' : 'bg-brand/55',
                )}
                style={{ width: `${max > 0 ? Math.max(1.5, (p.valor / max) * 100) : 0}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}


/**
 * Cambio frente a la medición anterior. Neutro a propósito (sin verde/rojo):
 * que un valor suba no siempre es bueno, depende de la pregunta ("¿por quién
 * nunca votaría?").
 */
function Variacion({ actual, anterior }: { actual: number; anterior: number | undefined }) {
  if (anterior === undefined) {
    return <span className="text-[11px] text-foreground-subtle">nuevo</span>;
  }
  const delta = actual - anterior;
  if (Math.abs(delta) < 0.05) {
    return <span className="text-[11px] text-foreground-subtle">sin cambio</span>;
  }
  return (
    <span
      className="text-[11px] font-medium text-foreground-muted"
      title={`Antes: ${fmt.format(anterior)}`}
    >
      <span aria-hidden>{delta > 0 ? '▲' : '▼'}</span>
      <span className="sr-only">{delta > 0 ? 'Subió' : 'Bajó'}</span> {fmt.format(Math.abs(delta))}
    </span>
  );
}
