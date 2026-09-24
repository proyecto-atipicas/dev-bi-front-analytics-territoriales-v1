'use client';

import { EmptyState } from '@/shared/ui/components/empty-state';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { cn } from '@/shared/ui/utils/cn';
import { Download, Eye, ExternalLink, FileX } from 'lucide-react';
import { Fuente } from '../../domain/entities';
import { buildPdfUrl } from '../../index';

const fechaFmt = new Intl.DateTimeFormat('es-CO', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

function formatFecha(iso: string | null): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return fechaFmt.format(parsed);
}

function badgeTipificacion(tipificacion: string): string {
  const t = tipificacion.toLowerCase();
  const base =
    'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold';
  if (t.includes('socio')) {
    return cn(base, 'bg-info-muted/60 text-info-foreground');
  }
  if (t.includes('poblacional') || t.includes('impacto')) {
    return cn(base, 'bg-success-muted/60 text-success-foreground');
  }
  return cn(base, 'bg-surface-elevated text-foreground-muted');
}

/** "SOCIO ECONOMICO" → "Socioeconómico": el catálogo llega sin tildes. */
export function etiquetaTipificacion(tipificacion: string): string {
  const t = tipificacion.toLowerCase();
  if (t.includes('socio')) return 'Socioeconómico';
  if (t.includes('poblacional') || t.includes('impacto')) return 'Impacto poblacional';
  return tipificacion.charAt(0).toUpperCase() + tipificacion.slice(1).toLowerCase();
}

export interface TablaFuentesProps {
  data: Fuente[] | undefined;
  isLoading: boolean;
  onPreview: (fuente: Fuente) => void;
}

export function TablaFuentes({ data, isLoading, onPreview }: TablaFuentesProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          size="md"
          description="No se encontraron fuentes con los filtros seleccionados."
        />
      </div>
    );
  }

  return (
    <div className="max-h-[640px] overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 border-b border-border bg-surface-elevated/95 backdrop-blur">
          <tr className="text-left label-eyebrow">
            <th className="px-3 py-2.5">Tipificación</th>
            <th className="px-3 py-2.5">Fuente</th>
            <th className="px-3 py-2.5">Publicación</th>
            <th className="px-3 py-2.5 text-right">Fecha</th>
            <th className="px-3 py-2.5 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((f) => {
            const url = buildPdfUrl(f.link);
            return (
              <tr
                key={f.id}
                className="transition-colors hover:bg-surface-elevated/60"
              >
                <td className="px-3 py-2.5 align-top">
                  <span className={badgeTipificacion(f.tipificacion)}>
                    {etiquetaTipificacion(f.tipificacion)}
                  </span>
                </td>
                <td className="px-3 py-2.5 align-top font-medium text-foreground">
                  <span
                    className="block max-w-[14rem] truncate sm:max-w-[18rem]"
                    title={f.fuente}
                  >
                    {f.fuente}
                  </span>
                </td>
                <td className="px-3 py-2.5 align-top text-foreground-muted">
                  {f.link ? (
                    <span
                      className="block max-w-[18rem] truncate sm:max-w-[24rem]"
                      title={f.link}
                    >
                      {f.link.replace(/\.pdf$/i, '')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-foreground-subtle">
                      <FileX size={12} />
                      Sin documento
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 align-top text-right num-tabular text-foreground-muted">
                  {formatFecha(f.fechaPublicacion)}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPreview(f)}
                      disabled={!url}
                      className={cn(
                        'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-colors',
                        url
                          ? 'border-border bg-surface text-foreground-muted hover:border-brand/40 hover:bg-surface-elevated hover:text-foreground'
                          : 'cursor-not-allowed border-border bg-surface-sunken text-foreground-subtle opacity-60',
                      )}
                      aria-label="Previsualizar PDF"
                      title={url ? 'Previsualizar PDF' : 'Sin PDF disponible'}
                    >
                      <Eye size={12} />
                      <span className="hidden sm:inline">Previsualizar</span>
                    </button>
                    {url && (
                      <>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-surface px-2 text-[11px] font-medium text-foreground-muted transition-colors hover:border-brand/40 hover:bg-surface-elevated hover:text-foreground"
                          aria-label="Abrir PDF en nueva pestaña"
                          title="Abrir en nueva pestaña"
                        >
                          <ExternalLink size={12} />
                        </a>
                        <a
                          href={url}
                          download={f.link ?? undefined}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-brand bg-brand px-2 text-[11px] font-semibold text-brand-foreground shadow-soft transition-colors hover:opacity-90"
                          aria-label="Descargar PDF"
                          title="Descargar PDF"
                        >
                          <Download size={12} />
                        </a>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
