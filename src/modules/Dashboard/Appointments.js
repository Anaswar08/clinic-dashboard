import React, { useEffect, useState } from 'react';
import { db } from '../../services/firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [newDentist, setNewDentist] = useState('');
  const [showAddDentist, setShowAddDentist] = useState(false);

  const [form, setForm] = useState({
    patientName: '',
    patientAge: '',
    patientGender: '',
    dentistName: '',
    treatment: '',
    date: '',
    time: '',
    phone: '',
    status: 'Upcoming',
    notes: '',
  });

  const [editingId, setEditingId] = useState(null);

  // Fetch appointments and dentists
  useEffect(() => {
    const fetchAppointments = async () => {
      const snapshot = await getDocs(collection(db, 'appointments'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    };

    const fetchDentists = async () => {
      const snapshot = await getDocs(collection(db, 'dentists'));
      const data = snapshot.docs.map(doc => doc.data().name);
      setDentists(data);
    };

    fetchAppointments();
    fetchDentists();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedForm = {
      ...form,
      date: Timestamp.fromDate(new Date(form.date)), // ✅ store as Timestamp
    };

    if (editingId) {
      await updateDoc(doc(db, 'appointments', editingId), updatedForm);
    } else {
      await addDoc(collection(db, 'appointments'), updatedForm);
    }

    window.location.reload(); // refresh
  };

  // Edit existing
  const handleEdit = (appointment) => {
    setForm({
      ...appointment,
      date: appointment.date?.toDate().toISOString().split('T')[0] || '',
    });
    setEditingId(appointment.id);
  };

  // Delete appointment
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      await deleteDoc(doc(db, 'appointments', id));
      setAppointments(prev => prev.filter(app => app.id !== id));
    }
  };

  // Add new dentist
  const handleAddNewDentist = async () => {
    if (!newDentist.trim()) return;
    await addDoc(collection(db, 'dentists'), { name: newDentist.trim() });
    setDentists(prev => [...prev, newDentist.trim()]);
    setForm(prev => ({ ...prev, dentistName: newDentist.trim() }));
    setNewDentist('');
    setShowAddDentist(false);
  };

  // Format time display
  const formatTime = (value) => {
    try {
      return new Date(`1970-01-01T${value}`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Appointments</h2>

      {/* Appointment Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <input
          type="text"
          name="patientName"
          placeholder="Patient Name"
          value={form.patientName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="patientAge"
          placeholder="Patient Age"
          value={form.patientAge}
          onChange={handleChange}
          required
        />
        <label>Gender:</label>
        <select name="patientGender"value={form.patientGender}onChange={handleChange}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>

        {/* Dentist Dropdown */}
        <label>Dentist:</label>
        <select
          name="dentistName"
          value={form.dentistName}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'add-new') {
              setShowAddDentist(true);
            } else {
              setForm(prev => ({ ...prev, dentistName: val }));
            }
          }}
          required
        >
          <option value="">Select Dentist</option>
          {dentists.map((dentist, index) => (
            <option key={index} value={dentist}>{dentist}</option>
          ))}
          <option value="add-new">+ Add New Dentist</option>
        </select>

        {showAddDentist && (
          <div style={{ marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Enter new dentist name"
              value={newDentist}
              onChange={(e) => setNewDentist(e.target.value)}
            />
            <button type="button" onClick={handleAddNewDentist}>Add</button>
            <button type="button" onClick={() => setShowAddDentist(false)}>Cancel</button>
          </div>
        )}

        <input
          type="text"
          name="treatment"
          placeholder="Treatment"
          value={form.treatment}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          required
        />
        <input
          type="time"
          name="time"
          value={form.time}
          onChange={handleChange}
          required
        />
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <input
          type="text"
          name="notes"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={handleChange}
        />
        <button type="submit">{editingId ? 'Update' : 'Add'} Appointment</button>
      </form>

      {/* Card View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {appointments.map(app => (
          <div key={app.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
            <h3>{app.patientName}</h3>
            <p><strong>Age:</strong> {app.patientAge}</p>
            <p><strong>Gender:</strong> {app.patientGender}</p>
            <p><strong>Dentist:</strong> {app.dentistName}</p>
            <p><strong>Treatment:</strong> {app.treatment}</p>
            <p>
              <strong>Date:</strong>{' '}
              {app.date instanceof Object && app.date.toDate
                ? app.date.toDate().toLocaleDateString()
                : new Date(app.date).toLocaleDateString()}
            </p>
            <p><strong>Phone:</strong> {app.phone}</p>
            <p><strong>Time:</strong> {formatTime(app.time)}</p>
            <p><strong>Status:</strong> {app.status}</p>
            {app.notes && <p><strong>Notes:</strong> {app.notes}</p>}
            <button onClick={() => handleEdit(app)} style={{ marginRight: '10px' }}>Edit</button>
            <button onClick={() => handleDelete(app.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Appointments;
