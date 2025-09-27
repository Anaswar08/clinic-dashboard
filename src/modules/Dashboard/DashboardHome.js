import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import StatCard from '../../components/StatCard';
import PatientsOverviewChart from '../../components/PatientsOverviewChart';
import AppointmentStatusChart from '../../components/AppointmentStatusChart';
import { format } from 'date-fns';

const DashboardHome = () => {
    const [timeFilter, setTimeFilter] = useState('weekly');
    const [todayPatients, setTodayPatients] = useState(0);
    const [todayAppointments, setTodayAppointments] = useState(0);
    const [labTests, setLabTests] = useState(0);
    const [revenue, setRevenue] = useState(0);
    const [labels, setLabels] = useState([]);
    const [newData, setNewData] = useState([]);
    const [returningData, setReturningData] = useState([]);
    const [statusCounts, setStatusCounts] = useState({});

    const getDateRange = (filter) => {
        const now = new Date();
        const end = new Date();
        let start;

        if (filter === 'weekly') {
            start = new Date();
            start.setDate(now.getDate() - 6);
        } else if (filter === 'monthly') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (filter === 'yearly') {
            start = new Date(now.getFullYear(), 0, 1);
        }

        return {
            start: Timestamp.fromDate(new Date(start.setHours(0, 0, 0, 0))),
            end: Timestamp.fromDate(new Date(end.setHours(23, 59, 59, 999))),
        };
    };

    useEffect(() => {
        const fetchData = async () => {
            const { start, end } = getDateRange(timeFilter);

            // Patients
            const patientQuery = query(
                collection(db, 'patients'),
                where('visitDate', '>=', start),
                where('visitDate', '<=', end)
            );
            const patientSnapshot = await getDocs(patientQuery);

            let newPatients = 0;
            let returningPatients = 0;
            const patientList = [];

            patientSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.isReturning) returningPatients++;
                else newPatients++;

                const visitDate = data.visitDate?.toDate();
                if (visitDate) {
                    const dateStr = format(visitDate, 'MMM d');
                    patientList.push({ date: dateStr, isReturning: data.isReturning });
                }
            });

            setTodayPatients(newPatients + returningPatients);

            // Group for chart
            const grouped = {};
            patientList.forEach(({ date, isReturning }) => {
                if (!grouped[date]) grouped[date] = { new: 0, returning: 0 };
                isReturning ? grouped[date].returning++ : grouped[date].new++;
            });

            const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));
            setLabels(sortedDates);
            setNewData(sortedDates.map(date => grouped[date].new));
            setReturningData(sortedDates.map(date => grouped[date].returning));

            // Revenue
            try {
                const revenueQuery = query(
                    collection(db, 'billings'),
                    where('date', '>=', start),
                    where('date', '<=', end)
                );

                const revenueSnapshot = await getDocs(revenueQuery);
                let totalRevenue = 0;
                revenueSnapshot.forEach(doc => {
                    const amount = Number(doc.data().amount);
                    if (!isNaN(amount)) {
                        totalRevenue += amount;
                    }
                });
                console.log("Total Revenue:", totalRevenue);
                setRevenue(totalRevenue);
            } catch (error) {
                console.error("Error fetching revenue:", error);
                setRevenue(0);
            }

            // Lab Tests
            const labQuery = query(
                collection(db, 'labtests'),
                where('date', '>=', start),
                where('date', '<=', end)
            );
            const labSnapshot = await getDocs(labQuery);
            setLabTests(labSnapshot.size);

            // Appointments
            const apptQuery = query(
                collection(db, 'appointments'),
                where('date', '>=', start),
                where('date', '<=', end)
            );
            const apptSnapshot = await getDocs(apptQuery);
            setTodayAppointments(apptSnapshot.size);

            // Appointment Status
            const statusMap = {};
            apptSnapshot.forEach(doc => {
                const status = doc.data().status || 'Unknown';
                statusMap[status] = (statusMap[status] || 0) + 1;
            });
            setStatusCounts(statusMap);
        };

        fetchData();
    }, [timeFilter]);

    return (
        <div style={{ padding: '0px 20px' }}>
            <h3>Dashboard Overview</h3>

            {/* Stat Cards */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
                <StatCard title="Today's Patients" value={todayPatients} icon="🧍" bgColor="#e0f2fe" growth="+12%" />
                <StatCard title="Appointments" value={todayAppointments} icon="📅" bgColor="#dcfce7" growth="-3%" />
                <StatCard title="Today's Revenue" value={`$${revenue}`} icon="💰" bgColor="#fce7f3" growth="+8%" />
                <StatCard title="Lab Tests" value={labTests} icon="🧪" bgColor="#fef9c3" growth="+5%" />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                {['weekly', 'monthly', 'yearly'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setTimeFilter(type)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '5px',
                            border: timeFilter === type ? '2px solid #3b82f6' : '1px solid #ccc',
                            background: timeFilter === type ? '#e0f2fe' : '#fff',
                            cursor: 'pointer',
                        }}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            {/* Line Chart */}
            <div style={{ marginTop: '40px' }}>
                <h3>Patients Overview</h3>
                <PatientsOverviewChart
                    labels={labels}
                    newPatientsData={newData}
                    returningPatientsData={returningData}
                />
            </div>

            {/* Appointment Status Chart */}
            {Object.keys(statusCounts).length > 0 ? (
                <div style={{ marginTop: '40px' }}>
                    <h3>Appointment Status</h3>
                    {console.log("Status Counts:", statusCounts)}
                    <AppointmentStatusChart statusCounts={statusCounts} />
                </div>
            ) : (
                <div style={{ marginTop: '40px' }}>
                    <h3>Appointment Status</h3>
                    <p>No appointment data found for selected time range.</p>
                </div>
            )}
        </div>
    );
};

export default DashboardHome;
