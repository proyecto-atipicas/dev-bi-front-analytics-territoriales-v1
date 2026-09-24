'use client';

import { useSidebar } from '@/shared/application/stores/sidebar.store';
import { useVistaActual } from '@/shared/application/hooks/use-vista-actual';
import { Menu } from 'lucide-react';
import { ReactNode } from 'react';
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
    <header className="z-30 border-b border-border bg-surface/90 backdrop-blur-md lg:sticky lg:top-0">
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
          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="font-display shrink-0 truncate text-lg font-bold leading-tight text-foreground sm:text-[22px]">
              {vista.titulo}
            </h1>
            <p className="hidden min-w-0 truncate text-sm text-foreground-muted md:block">
              {vista.descripcion}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {filtros}
    </header>
  );
}
