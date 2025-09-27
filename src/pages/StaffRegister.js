import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  doc,
  getDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

const StaffRegister = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const inviteId = searchParams.get("inviteId");

  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", password: "" });
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Fetch invite details
  useEffect(() => {
    const fetchInvite = async () => {
      if (!inviteId) {
        setError("Invalid invite link.");
        setLoading(false);
        return;
      }

      try {
        const inviteRef = doc(db, "staffInvites", inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
          setError("Invite not found or already used.");
          setLoading(false);
          return;
        }

        const invite = inviteSnap.data();

        // Check expiry
        if (invite.expiresAt.toDate() < new Date()) {
          setError("Invite link has expired.");
          setLoading(false);
          return;
        }

        setInviteData(invite);
        setForm((prev) => ({ ...prev, name: invite.name || "" }));
      } catch (err) {
        console.error(err);
        setError("Failed to fetch invite.");
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [inviteId]);

  // Handle form input
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Register staff
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      // 1. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        inviteData.email,
        form.password
      );

      const user = userCredential.user;

      // 2. Send verification email
      await sendEmailVerification(user);

      // 3. Save user in "users" collection
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: form.name,
        email: inviteData.email,
        role: inviteData.role || "staff",
        createdAt: serverTimestamp(),
      });

      // 4. Delete invite to prevent reuse
      await deleteDoc(doc(db, "staffInvites", inviteId));

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Registration failed: " + err.message);
    }
  };

  if (loading) return <p>Loading invite details...</p>;

  if (submitted) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Registration Successful!</h2>
        <p>
          We've sent you an email verification link.  
          Please verify before logging in.
        </p>
        <button onClick={() => navigate("/")}>Go to Login</button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h3>{error}</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Staff Registration</h2>
      <p>Registering for: <strong>{inviteData.email}</strong></p>

      <form onSubmit={handleRegister}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: "10px" }}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={{ width: "100%", marginBottom: "10px" }}
          required
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#1e40af",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Complete Registration
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
};

export default StaffRegister;
