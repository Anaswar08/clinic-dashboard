import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import {
  collection, query, where, getDocs, Timestamp, orderBy
} from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a1c4fd'];

const Reports = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);

  const [filterRange, setFilterRange] = useState('month');
  const [ageRange, setAgeRange] = useState([0, 100]);

  const [newReturningData, setNewReturningData] = useState([]);
  const [genderData, setGenderData] = useState([]);
  const [ageGroupData, setAgeGroupData] = useState([]);
  const [freqPatientsData, setFreqPatientsData] = useState([]);
  const [growthData, setGrowthData] = useState([]);

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, filterRange, ageRange]);

  const fetchAllAppointments = async () => {
    const snapshot = await getDocs(query(collection(db, 'appointments'), orderBy('date', 'asc')));
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAppointments(docs);
  };

  const getStartDate = () => {
    const now = new Date();
    switch (filterRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return null; // all time
    }
  };

  const applyFilters = () => {
    const startDate = getStartDate();
    const [minAge, maxAge] = ageRange;

    const filtered = appointments.filter(app => {
      const date = app.date?.toDate?.();
      const ageStr = app.patientAge || '';
      const age = parseInt(ageStr, 10);

      const dateOk = startDate ? (date && date >= startDate) : true;
      const ageOk = !isNaN(age) && age >= minAge && age <= maxAge;

      return dateOk && ageOk;
    });

    setFilteredAppointments(filtered);
  };

  useEffect(() => {
    if (filteredAppointments.length) {
      processNewReturning();
      processGender();
      processAgeGroups();
      processFrequentPatients();
      processGrowthTrend();
    } else {
      setNewReturningData([]);
      setGenderData([]);
      setAgeGroupData([]);
      setFreqPatientsData([]);
      setGrowthData([]);
    }
  }, [filteredAppointments]);

  const processNewReturning = () => {
    const allVisits = {};
    const filteredPhones = new Set();
    
    // Step 1: Collect ALL visit dates per phone from full appointments
    appointments.forEach(app => {
        const phone = app.phone || 'Unknown';
        const date = app.date?.toDate();
        if (!allVisits[phone]) allVisits[phone] = [];
        if (date) allVisits[phone].push(date);
    });

    // Step 2: Identify all phones that exist in filtered range
    filteredAppointments.forEach(app => {
        const phone = app.phone || 'Unknown';
        filteredPhones.add(phone);
    });

    let newCount = 0;
    let retCount = 0;
    const startDate = getStartDate();

    // Step 3: For each phone in the filtered set, check full visit history
    filteredPhones.forEach(phone => {
        const firstVisit = allVisits[phone]?.sort((a, b) => a - b)?.[0];
        if (!firstVisit || !startDate || firstVisit >= startDate) {
            newCount++;
        } else {
            retCount++;
        }
    });

    setNewReturningData([
      { name: 'New Patients', count: newCount },
      { name: 'Returning Patients', count: retCount }
    ]);
  };

  const processGender = () => {
    const counts = {};
    filteredAppointments.forEach(a => {
      const g = a.patientGender || 'Unknown';
      counts[g] = (counts[g] || 0) + 1;
    });
    setGenderData(Object.entries(counts).map(([name, count]) => ({ name, count })));
  };

  const processAgeGroups = () => {
    const counts = { '0‑18': 0, '19‑35': 0, '36‑60': 0, '60+': 0 };
    filteredAppointments.forEach(a => {
      const age = parseInt(a.patientAge, 10);
      if (isNaN(age)) return;
      if (age <= 18) counts['0‑18']++;
      else if (age <= 35) counts['19‑35']++;
      else if (age <= 60) counts['36‑60']++;
      else counts['60+']++;
    });

    setAgeGroupData(Object.entries(counts).map(([name, count]) => ({ name, count })));
  };

  const processFrequentPatients = () => {
    const counts = {};
    filteredAppointments.forEach(a => {
        const phone = a.phone || 'Unknown';
        const name = a.patientName || 'Unknown';

        counts[phone] = counts[phone] || { name, phone, count: 0 };
        counts[phone].count++;
    });

    const sorted = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    setFreqPatientsData(sorted);
  };

  const processGrowthTrend = () => {
    const monthly = {};
    filteredAppointments.forEach(a => {
      const dt = a.date?.toDate();
      if (!dt) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + 1;
    });
    const sortedKeys = Object.keys(monthly).sort();
    const data = sortedKeys.map(key => ({ month: key, count: monthly[key] }));
    setGrowthData(data);
  };

  const renderPie = (data, title) => (
    <div className="bg-white shadow rounded-xl p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
            {data.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold">Patient Reports</h2>

      {/* Time Range Selector */}
      <div className="flex items-center gap-4">
        <label className="font-semibold">Time Filter:</label>
        <select
          value={filterRange}
          onChange={e => setFilterRange(e.target.value)}
          className="border rounded px-3 py-1"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        {/* Age Range Slider */}
        <label className="font-semibold ml-6">Age Range: {ageRange[0]} – {ageRange[1]}</label>
        <input
          type="range"
          min={0}
          max={100}
          value={ageRange[0]}
          onChange={e => setAgeRange([parseInt(e.target.value), ageRange[1]])}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={ageRange[1]}
          onChange={e => setAgeRange([ageRange[0], parseInt(e.target.value)])}
        />
      </div>

      {renderPie(newReturningData, 'New vs Returning Patients')}
      {renderPie(genderData, 'Patients by Gender')}
      {renderPie(ageGroupData, 'Patients by Age Group')}

      <div className="bg-white shadow rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Most Frequent Patients</h3>
        <ul className="list-disc ml-6 space-y-1">
          {freqPatientsData.map((p, idx) => (
            <li key={idx}>
              {p.name}: {p.count} appointments
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white shadow rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-3">Monthly Growth Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Reports;
