'use client';

interface BotonVolverPaisProps {
  onClick: () => void;
  /** Texto opcional (por defecto "Volver al mapa de Colombia"). */
  label?: string;
}

/**
 * Botón flotante de "regreso" que se monta sobre cualquier mapa cuando hay
 * un drill-down activo. Restablece la vista territorial completa al mapa
 * nacional. Se posiciona absolute respecto al `.map-wrapper` contenedor.
 */
export function BotonVolverPais({
  onClick,
  label = 'Volver al mapa de Colombia',
}: BotonVolverPaisProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground shadow-elevated transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
      title={label}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M9.78 4.22a.75.75 0 0 1 0 1.06L6.06 9H17a.75.75 0 0 1 0 1.5H6.06l3.72 3.72a.75.75 0 1 1-1.06 1.06l-5-5a.75.75 0 0 1 0-1.06l5-5a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </button>
  );
}
