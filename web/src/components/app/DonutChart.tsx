'use client';
import { ArcElement, Chart as ChartJS, Legend, Tooltip, type ChartOptions } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const options: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: { position: 'bottom', labels: { font: { size: 10, weight: 'bold' }, usePointStyle: true, pointStyle: 'circle', padding: 25, color: '#64748b' } },
    tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 12, titleFont: { size: 12, weight: 'bold' }, bodyFont: { size: 12 } },
  },
};

export default function DonutChart({ labels, data, colors, hover }: { labels: string[]; data: number[]; colors: string[]; hover: string[] }) {
  return <Doughnut options={options} data={{ labels, datasets: [{ data, backgroundColor: colors, hoverBackgroundColor: hover, borderWidth: 0, hoverOffset: 10 }] }} />;
}
