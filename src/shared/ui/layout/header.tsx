'use client';

import { useSidebar } from '@/shared/application/stores/sidebar.store';
import { useVistaActual } from '@/shared/application/hooks/use-vista-actual';
import { useIsFetching } from '@tanstack/react-query';
import { Menu } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';

export interface HeaderProps {
  /**
   * Barra de filtros de la vista activa. Vive dentro de la cabecera para que
   * título y filtros se lean como un solo bloque de contexto ("qué estoy
   * viendo y con qué recorte").
   */
  filtros?: ReactNode;
}

export function Header({ filtros }: HeaderProps) {
  const vista = useVistaActual();
  const toggleMobile = useSidebar((s) => s.toggleMobile);

  return (
    <header className="relative z-30 border-b border-border bg-surface/90 backdrop-blur-md xl:sticky xl:top-0">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Toggle móvil */}
        <button
          type="button"
          onClick={toggleMobile}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground-muted transition-colors hover:bg-surface-elevated hover:text-foreground lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>

        {/* Contexto de la vista activa */}
        <div className="min-w-0 flex-1">
          <p className="hidden text-xs font-medium text-foreground-muted sm:block">
            {vista.seccion}
          </p>
          {/* La descripción acompaña al título en la misma línea cuando cabe;
              si no, baja a la siguiente en lugar de cortarse con "…". */}
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h1 className="font-display min-w-0 text-lg font-bold leading-tight text-foreground sm:truncate sm:text-[22px]">
              {vista.titulo}
            </h1>
            <p className="hidden min-w-0 text-sm text-foreground-muted md:block">
              {vista.descripcion}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {filtros}
      <IndicadorCarga />
    </header>
  );
}

/**
 * Señal global de que hay datos en camino. Aparece sólo si la espera supera
 * un instante (las consultas rápidas no parpadean) y se anuncia a lectores de
 * pantalla.
 */
function IndicadorCarga() {
  const enVuelo = useIsFetching() > 0;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enVuelo) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(t);
  }, [enVuelo]);

  return (
    <>
      {visible && <span className="barra-carga" aria-hidden />}
      <span className="sr-only" role="status" aria-live="polite">
        {visible ? 'Actualizando datos…' : ''}
      </span>
    </>
  );
}
