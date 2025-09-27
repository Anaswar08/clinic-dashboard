import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const PatientsOverviewChart = ({ labels, newPatientsData, returningPatientsData }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'New Patients',
        data: newPatientsData,
        borderColor: '#3b82f6',
        backgroundColor: '#93c5fd',
        tension: 0.3,
      },
      {
        label: 'Returning Patients',
        data: returningPatientsData,
        borderColor: '#10b981',
        backgroundColor: '#6ee7b7',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
  };

  return (
    <div style={{ width: '100%', height: '250px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default PatientsOverviewChart;
