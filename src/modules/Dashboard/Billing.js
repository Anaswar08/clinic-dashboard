""// Updated Billing.js with Pagination and PDF Invoice View
import React, { useEffect, useState } from "react";
import { db } from "../../services/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Modal from "react-modal";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

Modal.setAppElement("#root");

const Billing = () => {
  const [billings, setBillings] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [formData, setFormData] = useState({
    patientName: "",
    treatment: "",
    dentist: "",
    amount: "",
    status: "Unpaid",
    date: new Date().toISOString().substring(0, 10),
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const billsPerPage = 5;
  const indexOfLastBill = currentPage * billsPerPage;
  const indexOfFirstBill = indexOfLastBill - billsPerPage;
  const currentBills = billings.slice(indexOfFirstBill, indexOfLastBill);
  const totalPages = Math.ceil(billings.length / billsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Fetch billing data
  useEffect(() => {
    const fetchData = async () => {
      const billingSnap = await getDocs(collection(db, "billings"));
      const patientSnap = await getDocs(collection(db, "patients"));
      const appointmentSnap = await getDocs(collection(db, "appointments"));

      setBillings(
        billingSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setPatients(
        patientSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setAppointments(
        appointmentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (bill = null) => {
    if (bill) {
      setFormData({ ...bill });
      setSelectedBilling(bill.id);
      setEditMode(true);
    } else {
      setFormData({
        patientName: "",
        treatment: "",
        dentist: "",
        amount: "",
        status: "Unpaid",
        date: new Date().toISOString().substring(0, 10),
      });
      setEditMode(false);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBilling(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editMode) {
      const billRef = doc(db, "billings", selectedBilling);
      await updateDoc(billRef, formData);
    } else {
      await addDoc(collection(db, 'billings'), {
        patientName: formData.patientName,
        treatment: formData.treatment,
        amount: Number(formData.amount),
        date: formData.date ? new Date(formData.date) : new Date(), // Converts to JS Date object
        appointmentId: formData.appointmentId || '', // optional if linked to appointment
      });
    }
    window.location.reload();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure to delete this bill?")) {
      await deleteDoc(doc(db, "billings", id));
      setBillings(billings.filter((bill) => bill.id !== id));
    }
  };

  const autoFillFromAppointment = (apptId) => {
    const appt = appointments.find((a) => a.id === apptId);
    if (appt) {
      setFormData({
        patientName: appt.patientName,
        treatment: appt.treatment,
        dentist: appt.dentist,
        amount: "",
        status: "Unpaid",
        date: new Date().toISOString().substring(0, 10),
      });
    }
  };

  const generatePDF = (bill) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Clinic Invoice", 14, 20);
    doc.setFontSize(12);

    const invoiceData = [
      ["Patient Name", bill.patientName],
      ["Treatment", bill.treatment],
      ["Dentist", bill.dentist],
      ["Amount", `₹${bill.amount}`],
      ["Status", bill.status],
      ["Date", bill.date],
    ];

    autoTable(doc, {
      startY: 30,
      body: invoiceData,
      theme: "striped",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 100 },
      },
    });

    doc.save(`invoice_${bill.patientName}.pdf`);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Billing</h1>
        <div>
          <button
            onClick={() => openModal()}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            + Add Bill
          </button>
          <CSVLink
            data={billings}
            filename={"clinic_billing.csv"}
            className="ml-4 text-blue-600 underline"
          >
            Export CSV
          </CSVLink>
        </div>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Patient</th>
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Treatment</th>
            <th className="border px-2 py-1">Dentist</th>
            <th className="border px-2 py-1">Amount</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentBills.map((bill) => (
            <tr key={bill.id}>
              <td className="border px-2 py-1">{bill.patientName}</td>
              <td className="border px-2 py-1">
                {bill.date?.seconds ? new Date(bill.date.seconds * 1000).toLocaleDateString() : bill.date}
              </td>
              <td className="border px-2 py-1">{bill.treatment}</td>
              <td className="border px-2 py-1">{bill.dentist}</td>
              <td className="border px-2 py-1">₹{bill.amount}</td>
              <td className="border px-2 py-1">{bill.status}</td>
              <td className="border px-2 py-1 space-x-2">
                <button
                  onClick={() => openModal(bill)}
                  className="text-blue-500"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(bill.id)}
                  className="text-red-500"
                >
                  Delete
                </button>
                <button
                  onClick={() => generatePDF(bill)}
                  className="text-green-500"
                >
                  Invoice
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {/* <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={`px-3 py-1 border rounded ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div> */}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={closeModal}
        contentLabel="Add Bill Modal"
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            width: "500px",
            maxHeight: "90vh",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          },
        }}
      >
        <h2 className="text-lg font-semibold mb-4">
          {editMode ? "Edit Bill" : "Add Bill"}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="patientName"
            placeholder="Patient Name"
            value={formData.patientName}
            onChange={handleChange}
            required
            className="w-full mb-2 p-2 border rounded"
          />
          <input
            type="text"
            name="treatment"
            placeholder="Treatment"
            value={formData.treatment}
            onChange={handleChange}
            required
            className="w-full mb-2 p-2 border rounded"
          />
          <input
            type="text"
            name="dentist"
            placeholder="Dentist"
            value={formData.dentist}
            onChange={handleChange}
            required
            className="w-full mb-2 p-2 border rounded"
          />
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={formData.amount}
            onChange={handleChange}
            required
            className="w-full mb-2 p-2 border rounded"
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full mb-2 p-2 border rounded"
          >
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
          </select>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full mb-4 p-2 border rounded"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {editMode ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Billing;
