'use client';

import { useResolvedTheme } from '@/shared/application/hooks/use-resolved-theme';
import { getChartPalette } from '@/shared/ui/utils/chart-palette';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

export interface LineDataset {
  label: string;
  /** `null` = sin medición en ese periodo (se deja el hueco, no se pinta 0). */
  data: (number | null)[];
  /** Texto cualitativo (observación) por punto, mismo orden que `data`. */
  observaciones?: Array<string | null | undefined>;
}

export interface LineChartProps {
  labels: string[];
  datasets: LineDataset[];
  /**
   * Formatea el valor numérico en el tooltip y en el eje Y. Útil para inyectar
   * el sufijo de unidad (%, COP, …). Si se omite usa Intl.NumberFormat es-CO.
   */
  formatearValor?: (valor: number) => string;
  /**
   * Alto del área del gráfico (clases Tailwind). Si se indica, el componente
   * gestiona su propio alto y, cuando hay muchas series o nombres largos,
   * pinta la leyenda en HTML debajo: se ajusta en varias líneas en lugar de
   * recortarse dentro del canvas.
   */
  claseAlto?: string;
}

const defaultFmt = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

/** Parte un texto en líneas de hasta `ancho` caracteres, respetando palabras. */
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

export function LineChart({ labels, datasets, formatearValor, claseAlto }: LineChartProps) {
  const isDark = useResolvedTheme() === 'dark';
  const p = getChartPalette(isDark);
  const fmt = formatearValor ?? ((v: number) => defaultFmt.format(v));
  const leyendaHtml =
    !!claseAlto && (datasets.length > 4 || datasets.some((d) => d.label.length > 24));

  // El eje se ajusta al rango de los datos con un 10 % de holgura, sin bajar
  // de 0 cuando ningún valor es negativo (porcentajes, conteos).
  const valores = datasets.flatMap((d) => d.data).filter((v): v is number => v != null);
  const minimo = valores.length ? Math.min(...valores) : 0;
  const maximo = valores.length ? Math.max(...valores) : 0;
  const holgura = (maximo - minimo) * 0.1 || Math.abs(maximo) * 0.1 || 1;
  const ejeMin = minimo >= 0 ? Math.max(0, minimo - holgura) : minimo - holgura;

  const grafica = (
    <Line
      data={{
        labels,
        datasets: datasets.map((d, i) => {
          const color = p.series[i % p.series.length];
          return {
            label: d.label,
            data: d.data,
            borderColor: color,
            backgroundColor: color,
            tension: 0.35,
            spanGaps: true,
            borderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          };
        }),
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: !leyendaHtml,
            position: 'bottom',
            labels: { color: p.text, font: { size: 11 }, usePointStyle: true, padding: 16 },
          },
          tooltip: {
            backgroundColor: p.tooltipBg,
            titleColor: p.tooltipTitle,
            bodyColor: p.tooltipBody,
            borderColor: p.grid,
            borderWidth: 1,
            padding: 10,
            usePointStyle: true,
            // Chart.js no rompe líneas automáticamente; envolvemos el texto
            // manualmente para que la observación se ajuste a un ancho legible.
            boxPadding: 4,
            callbacks: {
              label: (ctx) => {
                const valor = Number(ctx.parsed.y);
                return `${ctx.dataset.label}: ${fmt(valor)}`;
              },
              afterLabel: (ctx) => {
                const ds = datasets[ctx.datasetIndex];
                const obs = ds?.observaciones?.[ctx.dataIndex];
                if (!obs) return '';
                return [`Observación:`, ...envolverTexto(obs, 56)];
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: p.text, font: { size: 11 } },
            grid: { color: p.grid, display: false },
            border: { color: p.grid },
          },
          y: {
            // Una línea compara cambios en el tiempo: no se ancla en 0, que
            // aplanaba variaciones pequeñas como las del coeficiente de Gini.
            beginAtZero: false,
            suggestedMin: ejeMin,
            suggestedMax: maximo + holgura,
            ticks: {
              color: p.text,
              font: { size: 11 },
              callback: (value) => fmt(Number(value)),
            },
            grid: { color: p.grid },
            border: { color: p.grid },
          },
        },
      }}
    />
  );

  if (!claseAlto) return grafica;

  return (
    <div className="space-y-3">
      <div className={claseAlto}>{grafica}</div>
      {leyendaHtml && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Leyenda">
          {datasets.map((d, i) => (
            <li key={d.label} className="flex min-w-0 items-center gap-1.5 text-[11px] text-foreground-muted">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: p.series[i % p.series.length] }}
                aria-hidden
              />
              <span>{d.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
