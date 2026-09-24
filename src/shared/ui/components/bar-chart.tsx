'use client';

import { useResolvedTheme } from '@/shared/application/hooks/use-resolved-theme';
import { getChartPalette } from '@/shared/ui/utils/chart-palette';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export interface BarChartProps {
  labels: string[];
  data: number[];
  label: string;
  horizontal?: boolean;
  /** Textos cualitativos por barra (observaciones). */
  observaciones?: Array<string | null | undefined>;
  /** Formato para el valor (eje y tooltip). Si se omite usa Intl.NumberFormat es-CO. */
  formatearValor?: (valor: number) => string;
  /** Colores por barra (hex/rgb). Si se omite usa el color brand único. */
  colors?: string[];
}

const defaultFmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

function envolverTexto(texto: string, ancho: number): string[] {
  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let actual = '';
  for (const p of palabras) {
    if (!actual) {
      actual = p;
    } else if (actual.length + 1 + p.length <= ancho) {
      actual = `${actual} ${p}`;
    } else {
      lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export function BarChart({
  labels,
  data,
  label,
  horizontal = false,
  observaciones,
  formatearValor,
  colors,
}: BarChartProps) {
  const isDark = useResolvedTheme() === 'dark';
  const p = getChartPalette(isDark);
  const fmt = formatearValor ?? ((v: number) => defaultFmt.format(v));

  // Configs por tipo de eje. Cuando horizontal=true, el eje de valores es X
  // y el categórico es Y; en vertical es al revés. Mantener tipos explícitos
  // evita que Chart.js infiera un eje lineal en el lado categórico (lo que
  // hacía aparecer 0,1,2,3,… en lugar de los nombres de las series).
  const valueAxis = {
    type: 'linear' as const,
    beginAtZero: true,
    ticks: {
      color: p.text,
      font: { size: 11 },
      callback: (value: string | number) => fmt(Number(value)),
    },
    grid: { color: p.grid },
    border: { color: p.grid },
  };
  const categoryAxis = {
    type: 'category' as const,
    ticks: {
      color: p.text,
      autoSkip: false,
      font: { size: 11 },
    },
    grid: { color: p.grid, display: false },
    border: { color: p.grid },
  };

  // En horizontal las etiquetas largas se reparten en líneas (Chart.js
  // acepta arreglos) en lugar de recortarse con "…".
  const etiquetas = horizontal
    ? labels.map((l) => (l.length > 20 ? envolverTexto(l, 20).slice(0, 3) : l))
    : labels;

  return (
    <Bar
      data={{
        labels: etiquetas,
        datasets: [
          {
            label,
            data,
            backgroundColor: colors ?? p.brand,
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 28,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: horizontal ? 'y' : 'x',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: p.tooltipBg,
            titleColor: p.tooltipTitle,
            bodyColor: p.tooltipBody,
            borderColor: p.grid,
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const valor = Number(ctx.parsed[horizontal ? 'x' : 'y']);
                return `${ctx.dataset.label}: ${fmt(valor)}`;
              },
              afterLabel: (ctx) => {
                const obs = observaciones?.[ctx.dataIndex];
                if (!obs) return '';
                return [`Observación:`, ...envolverTexto(obs, 56)];
              },
            },
          },
        },
        scales: horizontal
          ? { x: valueAxis, y: categoryAxis }
          : { x: categoryAxis, y: valueAxis },
      }}
    />
  );
}
