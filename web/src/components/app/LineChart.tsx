'use client';
import { CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip, type ChartData, type ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register only what we use.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export interface Series { label: string; data: number[]; color: string }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-10-14" -> "14 Oct"; anything else is shown as given. */
function shortDate(label: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(label);
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? ''}` : label;
}

/** Plain line chart: thin lines, a light fill, short date labels and few ticks. Loaded with next/dynamic (ssr: false). */
export default function LineChart({ labels, series, legend = false }: { labels: string[]; series: Series[]; legend?: boolean }) {
  const few = labels.length <= 14;
  const data: ChartData<'line'> = {
    labels: labels.map(shortDate),
    datasets: series.map((s) => ({
      label: s.label,
      data: s.data,
      borderColor: s.color,
      backgroundColor: `${s.color}14`,
      borderWidth: 2,
      pointRadius: few ? 3 : 0,
      pointHoverRadius: 4,
      pointBackgroundColor: s.color,
      fill: 'origin',
      tension: 0.2,
    })),
  };
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: legend, position: 'top', align: 'start', labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, font: { size: 12 }, padding: 16, color: '#475569' } },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        cornerRadius: 6,
        titleFont: { size: 12, weight: 'normal' },
        bodyFont: { size: 12 },
        displayColors: series.length > 1,
        callbacks: { title: (items) => (items[0] ? labels[items[0].dataIndex] ?? '' : '') },
      },
    },
    scales: {
      y: { beginAtZero: true, grace: '5%', border: { display: false }, grid: { color: '#e2e8f0' }, ticks: { precision: 0, maxTicksLimit: 5, font: { size: 11 }, color: '#64748b' } },
      x: { grid: { display: false }, border: { color: '#cbd5e1' }, ticks: { maxTicksLimit: 8, maxRotation: 0, autoSkipPadding: 12, font: { size: 11 }, color: '#64748b' } },
    },
  };
  return <Line data={data} options={options} />;
}
