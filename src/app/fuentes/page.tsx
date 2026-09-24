'use client';

import { buildPdfUrl, Fuente } from '@/modules/fuentes';
import {
  useFuentes,
  useNombresFuente,
  useTipificacionesFuente,
} from '@/modules/fuentes/application/hooks';
import { PreviewPdfModal } from '@/modules/fuentes/infrastructure/ui/preview-pdf-modal';
import { TablaFuentes } from '@/modules/fuentes/infrastructure/ui/tabla-fuentes';
import { Card, CardBody, CardHeader } from '@/shared/ui/components/card';
import { FiltrosCard } from '@/shared/ui/components/filtros-card';
import { SelectFiltro } from '@/shared/ui/components/select-filtro';
import { FileText, Files } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function FuentesPage() {
  const [tipificacion, setTipificacion] = useState<string | null>(null);
  const [fuente, setFuente] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<Fuente | null>(null);

  const filtro = useMemo(
    () => ({ tipificacion, fuente }),
    [tipificacion, fuente],
  );

  const { data, isLoading } = useFuentes(filtro);
  const { data: tipificaciones, isLoading: loadingTip } = useTipificacionesFuente();
  const { data: nombres, isLoading: loadingNombres } = useNombresFuente();

  const filtrosActivos = (tipificacion ? 1 : 0) + (fuente ? 1 : 0);

  const totales = useMemo(() => {
    if (!data) return { total: 0, conPdf: 0 };
    return {
      total: data.length,
      conPdf: data.filter((f) => !!f.link).length,
    };
  }, [data]);

  const previewUrl = seleccionada ? buildPdfUrl(seleccionada.link) : null;

  return (
    <div className="space-y-5 animate-fade-in">
      <FiltrosCard
        cols={2}
        filtrosActivos={filtrosActivos}
        onLimpiar={() => {
          setTipificacion(null);
          setFuente(null);
        }}
      >
        <SelectFiltro
          label="Tipificación"
          value={tipificacion}
          loading={loadingTip}
          options={(tipificaciones ?? []).map((t) => ({ value: t, label: t }))}
          onChange={setTipificacion}
          placeholder="Todas"
        />
        <SelectFiltro
          label="Fuente"
          value={fuente}
          loading={loadingNombres}
          options={(nombres ?? []).map((n) => ({ value: n, label: n }))}
          onChange={setFuente}
          placeholder="Todas"
        />
      </FiltrosCard>

      <Card>
        <CardHeader
          title="Fuentes documentales"
          description={
            isLoading
              ? 'Cargando registros…'
              : `${totales.total} fuente${totales.total === 1 ? '' : 's'} · ${totales.conPdf} con documento adjunto`
          }
          icon={Files}
          action={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground-muted">
              <FileText size={12} />
              Trazabilidad
            </span>
          }
        />
        <CardBody padding="none">
          <TablaFuentes
            data={data}
            isLoading={isLoading}
            onPreview={setSeleccionada}
          />
        </CardBody>
      </Card>

      <PreviewPdfModal
        open={!!seleccionada && !!previewUrl}
        url={previewUrl}
        titulo={seleccionada?.fuente ?? ''}
        subtitulo={seleccionada?.tipificacion}
        filename={seleccionada?.link ?? undefined}
        onClose={() => setSeleccionada(null)}
      />
    </div>
  );
}
