'use client';

import { ResumenCorporacion } from '@/modules/electoral/domain/entities';
import { cn } from '@/shared/ui/utils/cn';
import { formatearCorporacion } from './corporacion-utils';
import {
  Award,
  Building2,
  ChevronRight,
  Crown,
  Landmark,
  LucideIcon,
  ScrollText,
  Shield,
  UserCheck,
  Users,
  Vote,
} from 'lucide-react';

export type TonoCorporacion = 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface TonoConfig {
  /** Color principal del header e iconos */
  text: string;
  /** Fondo suave del header */
  headerBg: string;
  /** Borde inferior del header (acento) */
  headerBorder: string;
}

const TONOS: Record<TonoCorporacion, TonoConfig> = {
  brand:   { text: 'text-brand',   headerBg: 'bg-brand-muted',   headerBorder: 'border-brand/30' },
  success: { text: 'text-success', headerBg: 'bg-success-muted', headerBorder: 'border-success/30' },
  danger:  { text: 'text-danger',  headerBg: 'bg-danger-muted',  headerBorder: 'border-danger/30' },
  warning: { text: 'text-warning', headerBg: 'bg-warning-muted', headerBorder: 'border-warning/30' },
  info:    { text: 'text-info',    headerBg: 'bg-info-muted',    headerBorder: 'border-info/30' },
  neutral: { text: 'text-foreground-muted', headerBg: 'bg-surface-elevated', headerBorder: 'border-border-strong' },
};

/** Mapeo heurístico nombre de corporación → icono + tono */
export function visualParaCorporacion(
  nombre: string,
): { icon: LucideIcon; tono: TonoCorporacion } {
  const n = nombre.toUpperCase();
  if (n.includes('SENADO')) return { icon: Landmark, tono: 'brand' };
  if (n.includes('CÁMARA') || n.includes('CAMARA')) return { icon: ScrollText, tono: 'info' };
  if (n.includes('ASAMBLEA')) return { icon: Building2, tono: 'success' };
  if (n.includes('CONCEJO')) return { icon: Users, tono: 'warning' };
  if (n.includes('ALCALDÍA') || n.includes('ALCALDIA')) return { icon: Shield, tono: 'danger' };
  if (n.includes('GOBERNAC')) return { icon: Crown, tono: 'brand' };
  if (n.includes('JAL')) return { icon: Users, tono: 'info' };
  return { icon: Vote, tono: 'neutral' };
}

const fmt = new Intl.NumberFormat('es-CO');

export interface TarjetaCorporacionProps {
  resumen: ResumenCorporacion;
  seleccionada?: boolean;
  onClick?: () => void;
  /**
   * Muestra el tipo de elección sobre el título. Se omite cuando la tarjeta
   * ya está bajo un encabezado de grupo con ese mismo tipo.
   */
  mostrarFamilia?: boolean;
}

export function TarjetaCorporacion({
  resumen,
  seleccionada = false,
  onClick,
  mostrarFamilia = false,
}: TarjetaCorporacionProps) {
  const { icon: Icon, tono } = visualParaCorporacion(resumen.nombreCorporacion);
  const t = TONOS[tono];
  const nombre = formatearCorporacion(resumen.nombreCorporacion);
  const titulo = nombre.detalle || nombre.familia;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={seleccionada}
      className={cn(
        'group flex w-full flex-col rounded-xl border bg-surface p-4 text-left shadow-panel transition-[border-color,box-shadow] duration-150 sm:p-5',
        'hover:border-brand/50 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        seleccionada ? 'border-brand ring-2 ring-brand/20' : 'border-border/80',
      )}
    >
      <div className="flex w-full items-start gap-3">
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            t.headerBg,
            t.text,
          )}
        >
          <Icon size={17} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {mostrarFamilia && (
            <p className="truncate text-xs text-foreground-muted">{nombre.familia}</p>
          )}
          <h3 className="truncate text-[15px] font-semibold text-foreground" title={nombre.etiqueta}>
            {titulo}
          </h3>
        </div>
        {nombre.anio && (
          <span className="shrink-0 rounded-md bg-background px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground-muted ring-1 ring-inset ring-border">
            {nombre.anio}
          </span>
        )}
      </div>

      <p className="font-display mt-5 text-[28px] font-bold leading-none tabular-nums text-foreground">
        {fmt.format(resumen.totalVotos)}
      </p>
      <p className="mt-1.5 text-xs text-foreground-muted">votos registrados</p>

      <div className="mt-4 flex w-full items-center gap-4 border-t border-border/70 pt-3 text-xs text-foreground-muted">
        <span className="inline-flex items-center gap-1.5">
          <UserCheck size={14} className="text-foreground-subtle" aria-hidden />
          <strong className="font-semibold tabular-nums text-foreground">
            {fmt.format(resumen.totalCandidatos)}
          </strong>
          candidatos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Award size={14} className="text-foreground-subtle" aria-hidden />
          <strong className="font-semibold tabular-nums text-foreground">
            {fmt.format(resumen.totalPartidos)}
          </strong>
          partidos
        </span>
        <ChevronRight
          size={16}
          className="ml-auto text-foreground-subtle transition-colors group-hover:text-brand"
          aria-hidden
        />
      </div>
    </button>
  );
}
