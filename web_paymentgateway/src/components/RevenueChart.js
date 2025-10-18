import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function RevenueChart({ data }) {
  const chartData = {
    labels: data.map(item => {
      if (item._id.day) return `${item._id.day}/${item._id.month}/${item._id.year}`;
      if (item._id.week) return `Week ${item._id.week} ${item._id.year}`;
      if (item._id.month) return `${item._id.month}/${item._id.year}`;
      return item._id.year;
    }),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.totalRevenue),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Revenue Over Time'
      }
    }
  };

  return <Line data={chartData} options={options} />;
}