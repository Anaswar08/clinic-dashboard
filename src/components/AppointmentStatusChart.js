import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const AppointmentStatusChart = ({ statusCounts }) => {
  const data = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: 'Appointments',
        data: Object.values(statusCounts),
        backgroundColor: ['#60a5fa', '#facc15', '#f87171'],
        borderColor: ['#3b82f6', '#eab308', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div style={{ width: '300px', height: '300px' }}>
      <Doughnut data={data} options={options} />
      {console.log("Status Counts:", statusCounts)}
    </div>
  );
};

export default AppointmentStatusChart;
