'use client';
import { CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip, type ChartData, type ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register only what we use (the Angular app registered everything via provideCharts).
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export interface Series { label: string; data: number[]; color: string }

/** Smooth filled line chart in the app's visual style. Loaded with next/dynamic (ssr: false). */
export default function LineChart({ labels, series, legend = false }: { labels: string[]; series: Series[]; legend?: boolean }) {
  const data: ChartData<'line'> = {
    labels,
    datasets: series.map((s) => ({
      label: s.label,
      data: s.data,
      borderColor: s.color,
      backgroundColor: `${s.color}1a`,
      pointBackgroundColor: '#fff',
      pointBorderColor: s.color,
      pointHoverBackgroundColor: s.color,
      pointHoverBorderColor: '#fff',
      fill: 'origin',
      tension: 0.4,
    })),
  };
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: legend, position: 'top', align: 'end', labels: { usePointStyle: true, pointStyle: 'circle', font: { size: 10, weight: 'bold' }, padding: 20 } },
      tooltip: { backgroundColor: '#1e293b', padding: 12, titleFont: { size: 12, weight: 'bold' }, bodyFont: { size: 12 }, cornerRadius: 8, displayColors: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.03)' }, ticks: { font: { size: 11, weight: 'bold' }, color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { font: { size: 11, weight: 'bold' }, color: '#94a3b8' } },
    },
  };
  return <Line data={data} options={options} />;
}
