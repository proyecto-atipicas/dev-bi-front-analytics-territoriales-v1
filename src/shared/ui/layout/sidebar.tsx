'use client';

import { useSidebar } from '@/shared/application/stores/sidebar.store';
import { cn } from '@/shared/ui/utils/cn';
import {
  BarChart3,
  ChevronLeft,
  Files,
  GitCompareArrows,
  Home,
  LucideIcon,
  Trophy,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

const NAV: NavItem[] = [
  { href: '/', label: 'Resumen ejecutivo', icon: Home, group: 'General' },
  {
    href: '/electoral/comportamiento',
    label: 'Comportamiento electoral',
    icon: BarChart3,
    group: 'Análisis electoral',
  },
  {
    href: '/electoral/comparativo',
    label: 'Comparativo electoral',
    icon: GitCompareArrows,
    group: 'Análisis electoral',
  },
  {
    href: '/electoral/territorios-ganados',
    label: 'Territorios ganados',
    icon: Trophy,
    group: 'Análisis electoral',
  },
  { href: '/socioeconomico', label: 'Socioeconómico', icon: TrendingUp, group: 'Análisis social' },
  { href: '/poblacional', label: 'Impacto poblacional', icon: Users, group: 'Análisis social' },
  { href: '/fuentes', label: 'Fuentes documentales', icon: Files, group: 'Transparencia' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

  // Cerrar el drawer móvil al navegar.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const groups = NAV.reduce<Record<string, NavItem[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop móvil */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-chrome/50 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-col bg-chrome text-chrome-foreground transition-[width,transform] duration-200',
          'lg:sticky lg:top-0 lg:z-30 lg:translate-x-0',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[256px]',
          // En móvil convive con el botón de cerrar: 288px evita cortar la marca.
          'w-[288px]',
          mobileOpen ? 'translate-x-0 shadow-elevated' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Navegación principal"
      >
        {/* Marca */}
        <div className={cn('flex items-center gap-3 px-4 pb-5 pt-5', collapsed && 'lg:justify-center lg:px-0')}>
          <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-xl bg-chrome-foreground/10 ring-1 ring-inset ring-chrome-foreground/15">
            <BarChart3 className="h-[18px] w-[18px]" />
            <span className="flag-rule flag-rule-on-chrome block h-[3px] w-5" aria-hidden />
          </div>
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <p className="font-display truncate text-[15px] font-bold leading-tight">
              Analítica Territorial
            </p>
            <p className="truncate text-xs text-chrome-muted">República de Colombia</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-chrome-muted transition-colors hover:bg-chrome-hover hover:text-chrome-foreground lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-5 last:mb-0">
              <p
                className={cn(
                  'mb-1.5 px-3 text-xs font-medium text-chrome-muted/80',
                  collapsed && 'lg:sr-only',
                )}
              >
                {group}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                          collapsed && 'lg:justify-center lg:px-0',
                          active
                            ? 'bg-chrome-foreground/[0.12] font-semibold text-chrome-foreground'
                            : 'font-medium text-chrome-muted hover:bg-chrome-foreground/[0.06] hover:text-chrome-foreground',
                        )}
                      >
                        {/* Indicador de vista activa: el amarillo de la bandera */}
                        <span
                          className={cn(
                            'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-flag-yellow transition-opacity',
                            active ? 'opacity-100' : 'opacity-0',
                          )}
                          aria-hidden
                        />
                        <Icon
                          size={18}
                          className={cn('shrink-0', active && 'text-flag-yellow')}
                        />
                        <span className={cn('truncate', collapsed && 'lg:hidden')}>
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Colapsar (escritorio) */}
        <div className="hidden border-t border-chrome-foreground/10 p-3 lg:block">
          <button
            type="button"
            onClick={toggle}
            className={cn(
              'flex h-9 w-full items-center gap-2 rounded-lg px-3 text-xs font-medium text-chrome-muted transition-colors hover:bg-chrome-foreground/[0.06] hover:text-chrome-foreground',
              collapsed && 'justify-center px-0',
            )}
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          >
            <ChevronLeft
              size={16}
              className={cn('transition-transform duration-200', collapsed && 'rotate-180')}
            />
            {!collapsed && <span>Contraer menú</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
