// src/dashboard/Patients.js
import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [history, setHistory] = useState("");
  const [lastVisit, setLastVisit] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 5;

  useEffect(() => {
    const fetchPatients = async () => {
      const q = query(collection(db, "patients"), orderBy("lastVisit", "desc"));
      const snapshot = await getDocs(q);
      const patientData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(patientData);
    };

    fetchPatients();
  }, []);

  const handleAddOrUpdate = async () => {
    const newPatient = {
      name,
      age,
      gender,
      address,
      history,
      lastVisit: lastVisit ? new Date(lastVisit) : null,
    };

    if (editIndex !== null) {
      const patientRef = doc(db, "patients", patients[editIndex].id);
      await updateDoc(patientRef, newPatient);
      const updatedPatients = [...patients];
      updatedPatients[editIndex] = { ...updatedPatients[editIndex], ...newPatient };
      setPatients(updatedPatients);
      setEditIndex(null);
    } else {
      const docRef = await addDoc(collection(db, "patients"), newPatient);
      setPatients([{ id: docRef.id, ...newPatient }, ...patients]);
    }

    setName("");
    setAge("");
    setGender("");
    setAddress("");
    setHistory("");
    setLastVisit("");
  };

  const handleEdit = (index) => {
    const patient = patients[index];
    setName(patient.name);
    setAge(patient.age);
    setGender(patient.gender);
    setAddress(patient.address);
    setHistory(patient.history);
    setLastVisit(patient.lastVisit?.seconds ? new Date(patient.lastVisit.seconds * 1000).toISOString().split("T")[0] : "");
    setEditIndex(index);
  };

  const handleDelete = async (index) => {
    const patient = patients[index];
    await deleteDoc(doc(db, "patients", patient.id));
    const updatedPatients = patients.filter((_, i) => i !== index);
    setPatients(updatedPatients);
  };

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleExportCSV = () => {
    const csvContent = [
      ["Name", "Age", "Gender", "Address", "History", "Last Visit"],
      ...patients.map((p) => [
        p.name,
        p.age,
        p.gender,
        p.address,
        p.history,
        p.lastVisit?.seconds ? new Date(p.lastVisit.seconds * 1000).toLocaleDateString() : ""
      ])
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "patients.csv");
    link.click();
  };

  const handleProfileView = (patient) => {
    alert(`\nPatient Profile:\n\nName: ${patient.name}\nAge: ${patient.age}\nGender: ${patient.gender}\nAddress: ${patient.address}\nHistory: ${patient.history}\nLast Visit: ${patient.lastVisit?.seconds ? new Date(patient.lastVisit.seconds * 1000).toLocaleDateString() : "N/A"}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Patient Records</h2>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Name"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Age"
          className="form-input"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <input
          type="text"
          placeholder="Gender"
          className="form-input"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />
        <input
          type="text"
          placeholder="Address"
          className="form-input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="Medical History"
          className="form-input"
          value={history}
          onChange={(e) => setHistory(e.target.value)}
        />
        <input
          type="date"
          className="form-input"
          value={lastVisit}
          onChange={(e) => setLastVisit(e.target.value)}
        />
        <button onClick={handleAddOrUpdate} className="bg-blue-600 text-white px-4 py-2 rounded">
          {editIndex !== null ? "Update" : "Add"} Patient
        </button>
        <button
          onClick={handleExportCSV}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name..."
        className="form-input mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Age</th>
            <th className="py-2">Gender</th>
            <th className="py-2">Address</th>
            <th className="py-2">History</th>
            <th className="py-2">Last Visit</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPatients.map((patient, index) => (
            <tr key={index} className="border-t">
              <td className="py-2">{patient.name}</td>
              <td className="py-2">{patient.age}</td>
              <td className="py-2">{patient.gender}</td>
              <td className="py-2">{patient.address}</td>
              <td className="py-2">{patient.history}</td>
              <td className="py-2">
                {patient.lastVisit?.seconds
                  ? new Date(patient.lastVisit.seconds * 1000).toLocaleDateString()
                  : "—"}
              </td>
              <td className="py-2">
                <button
                  onClick={() => handleEdit(index)}
                  className="text-blue-600 hover:underline mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="text-red-600 hover:underline mr-2"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleProfileView(patient)}
                  className="text-gray-600 hover:underline"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* <div className="mt-4">
        {Array.from({ length: Math.ceil(filteredPatients.length / patientsPerPage) }).map((_, i) => (
          <button
            key={i}
            onClick={() => paginate(i + 1)}
            className={`px-3 py-1 border ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-white"}`}
          >
            {i + 1}
          </button>
        ))}
      </div> */}
    </div>
  );
};

export default Patients;
