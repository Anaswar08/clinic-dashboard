import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import {collection, query, where, getDocs, Timestamp} from 'firebase/firestore';
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a1c4fd', '#f78ca0', '#8dd1e1'];

const Treatments = () => {
  const [treatmentData, setTreatmentData] = useState([]);
  const [filterRange, setFilterRange] = useState('month');
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [treatmentDetails, setTreatmentDetails] = useState([]);

  useEffect(() => {
    fetchTreatmentData();
  }, [filterRange]);

  const getStartDate = () => {
    const now = new Date();
    switch (filterRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week': {
        const firstDayOfWeek = now.getDate() - now.getDay() + 1;
        return new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek);
      }
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return null; // all time
    }
  };

  const buildDateCondition = () => {
    const startDate = getStartDate();
    if (!startDate) return []; // no filter
    const startTimestamp = Timestamp.fromDate(new Date(startDate.setHours(0, 0, 0, 0)));
    return [where('date', '>=', startTimestamp)];
  };

  const fetchTreatmentData = async () => {
    try {
      const dateCondition = buildDateCondition();

      const q = query(
        collection(db, 'appointments'),
        ...dateCondition
      );

      const querySnapshot = await getDocs(q);
      const treatmentCount = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const type = data.treatment;
        if (type) {
          treatmentCount[type] = (treatmentCount[type] || 0) + 1;
        }
      });

      const chartData = Object.entries(treatmentCount).map(([type, count]) => ({
        name: type,
        count
      }));

      setTreatmentData(chartData);
    } catch (error) {
      console.error('Error fetching treatment data:', error);
    }
  };

  const handleTreatmentClick = async (treatmentName) => {
    try {
      setSelectedTreatment(treatmentName);
      const dateCondition = buildDateCondition();

      const q = query(
        collection(db, 'appointments'),
        ...dateCondition,
        where('treatment', '==', treatmentName)
      );

      const snapshot = await getDocs(q);
      const results = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        results.push({
          patient: data.patientName || 'N/A',
          phone: data.phone || 'N/A',
          dentist: data.dentistName || 'N/A',
          date: data.date?.toDate().toLocaleDateString() || 'N/A'
        });
      });

      setTreatmentDetails (results);
    } catch (error) {
      console.error('Error fetching treatment details:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Most Performed Treatments</h2>

      <div className="mb-6">
        <label className="mr-3 font-semibold">Filter by:</label>
        <select
          value={filterRange}
          onChange={(e) => setFilterRange(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Treatment Count (Bar Chart)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={treatmentData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#8884d8"
                radius={[5, 5, 0, 0]}
                onClick={(data) => handleTreatmentClick(data.name)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Treatment Distribution (Pie Chart)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={treatmentData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
                onClick={(data) => handleTreatmentClick(data.name)}
              >
                {treatmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {selectedTreatment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full relative">
            <h3 className="text-lg font-bold mb-4">
              {selectedTreatment} Appointments
            </h3>
            <button
              onClick={() => setSelectedTreatment(null)}
              className="absolute top-3 right-4 text-gray-500 hover:text-red-500"
            >
              ✕
            </button>
            <ul className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
              {treatmentDetails.length === 0 ? (
                <li className="py-2 text-gray-500 text-sm">No data found</li>
              ) : (
                treatmentDetails.map((t, i) => (
                  <li key={i} className="py-2 text-sm">
                    <p><strong>Patient:</strong> {t.patient}</p>
                    <p><strong>Phone:</strong> {t.phone}</p>
                    <p><strong>Dentist:</strong> {t.dentist}</p>
                    <p><strong>Date:</strong> {t.date}</p>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treatments;
