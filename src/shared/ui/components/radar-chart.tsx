'use client';

import { useResolvedTheme } from '@/shared/application/hooks/use-resolved-theme';
import { getChartPalette, withAlpha } from '@/shared/ui/utils/chart-palette';
import {
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export interface RadarDataset {
  label: string;
  data: number[];
}

export interface RadarChartProps {
  labels: string[];
  datasets: RadarDataset[];
  /** Colores por dataset (hex/rgb). Si se omite usa la serie de la paleta. */
  colors?: string[];
}

/** Parte una etiqueta en líneas de hasta `ancho` caracteres (máx. 3). */
function envolver(texto: string, ancho = 18): string | string[] {
  if (texto.length <= ancho) return texto;
  const lineas: string[] = [];
  let actual = '';
  for (const p of texto.split(/\s+/)) {
    if (!actual) actual = p;
    else if (actual.length + 1 + p.length <= ancho) actual = `${actual} ${p}`;
    else {
      lineas.push(actual);
      actual = p;
    }
  }
  if (actual) lineas.push(actual);
  if (lineas.length > 3) {
    lineas.length = 3;
    lineas[2] = `${lineas[2]}…`;
  }
  return lineas;
}

export function RadarChart({ labels, datasets, colors }: RadarChartProps) {
  const isDark = useResolvedTheme() === 'dark';
  const p = getChartPalette(isDark);
  const angleColor = isDark ? 'rgb(184 195 218)' : 'rgb(42 47 61)';
  const gridSoft = isDark ? 'rgba(132, 146, 173, 0.18)' : 'rgba(91, 100, 121, 0.18)';

  return (
    <Radar
      data={{
        labels: labels.map((l) => envolver(l)),
        datasets: datasets.map((d, i) => {
          const stroke = colors?.[i] ?? p.series[i % p.series.length];
          return {
            label: d.label,
            data: d.data,
            borderColor: stroke,
            backgroundColor: withAlpha(stroke, 0.18),
            borderWidth: 2,
            pointBackgroundColor: stroke,
            pointBorderColor: stroke,
            pointHoverRadius: 5,
            pointRadius: 3,
          };
        }),
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: p.text,
              font: { size: 11 },
              usePointStyle: true,
              padding: 14,
            },
          },
          tooltip: {
            backgroundColor: p.tooltipBg,
            titleColor: p.tooltipTitle,
            bodyColor: p.tooltipBody,
            borderColor: gridSoft,
            borderWidth: 1,
            padding: 10,
            usePointStyle: true,
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            angleLines: { color: gridSoft },
            grid: { color: gridSoft },
            pointLabels: { color: angleColor, font: { size: 11 } },
            ticks: {
              color: p.text,
              backdropColor: 'transparent',
              font: { size: 10 },
              showLabelBackdrop: false,
            },
          },
        },
      }}
    />
  );
}
