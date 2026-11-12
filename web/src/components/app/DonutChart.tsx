'use client';
import { ArcElement, Chart as ChartJS, Legend, Tooltip, type ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const options: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: { position: 'bottom', labels: { font: { size: 12 }, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, color: '#475569' } },
    tooltip: { backgroundColor: '#0f172a', padding: 10, cornerRadius: 6, titleFont: { size: 12, weight: 'normal' }, bodyFont: { size: 12 } },
  },
};

export default function DonutChart({ labels, data, colors, hover }: { labels: string[]; data: number[]; colors: string[]; hover: string[] }) {
  return <Doughnut options={options} data={{ labels, datasets: [{ data, backgroundColor: colors, hoverBackgroundColor: hover, borderWidth: 2, borderColor: '#fff' }] }} />;
}
