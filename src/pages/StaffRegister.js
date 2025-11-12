// src/pages/StaffRegister.js

import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

const StaffRegister = () => {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("inviteId");
  const navigate = useNavigate();

  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch and validate invite
  useEffect(() => {
    const fetchInvite = async () => {
      if (!inviteId) {
        setError("Invalid invite link. No invite ID provided.");
        setLoading(false);
        return;
      }

      try {
        const inviteRef = doc(db, "staffInvites", inviteId);
        const inviteSnap = await getDoc(inviteRef);

        if (!inviteSnap.exists()) {
          setError("This invite link is invalid or has been removed.");
          setLoading(false);
          return;
        }

        const invite = inviteSnap.data();

        // Check if invite has expired
        const expiresAt = invite.expiresAt?.toDate?.();
        if (expiresAt && expiresAt < new Date()) {
          setError("This invite link has expired. Please contact your admin for a new invite.");
          setLoading(false);
          return;
        }

        // Check if invite is still pending
        if (invite.status !== "pending") {
          setError("This invite has already been used or cancelled.");
          setLoading(false);
          return;
        }

        setInviteData(invite);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching invite:", err);
        setError("Failed to load invite details.");
        setLoading(false);
      }
    };

    fetchInvite();
  }, [inviteId]);

  // ✅ Handle staff registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        inviteData.email,
        password
      );
      const user = userCredential.user;

      // 2. Send email verification
      await sendEmailVerification(user, {
        url: window.location.origin + "/",
        handleCodeInApp: false,
      });

      // 3. Create user document in top-level users collection
      await setDoc(doc(db, "users", user.uid), {
        name: inviteData.name,
        email: inviteData.email,
        clinicId: inviteData.clinicId,        // ✅ Auto-linked to clinic
        role: inviteData.role,
        status: "active",                     // Immediately active
        emailVerified: false,
        invitedBy: inviteData.invitedBy,
        createdAt: new Date(),
      });

      // 4. Add minimal reference to clinic's users subcollection
      await setDoc(doc(db, `clinics/${inviteData.clinicId}/users/${user.uid}`), {
        role: inviteData.role,
        addedAt: new Date(),
      });

      // 5. Delete the invite (it's been used)
      await deleteDoc(doc(db, "staffInvites", inviteId));

      alert(
        `Registration successful! 🎉\n\n` +
        `Welcome to ${inviteData.clinicName}!\n\n` +
        `Please check your email (${inviteData.email}) and verify your account before logging in.`
      );

      // Redirect to login
      navigate("/");
    } catch (err) {
      console.error("Registration error:", err);
      
      // Handle specific Firebase errors
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use a stronger password.");
      } else {
        setError("Registration failed: " + err.message);
      }
      
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 400, margin: "50px auto", padding: 20, textAlign: "center" }}>
        <p>Loading invite details...</p>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div style={{ maxWidth: 400, margin: "50px auto", padding: 20 }}>
        <h2 style={{ color: "#f44336" }}>Invalid Invite</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate("/")}
          style={{ 
            marginTop: 20, 
            padding: "10px 20px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: 20 }}>
      <h2>Complete Your Registration</h2>
      
      <div style={{ 
        padding: "15px", 
        marginBottom: "20px", 
        background: "#E3F2FD", 
        borderRadius: "5px",
        border: "1px solid #2196F3"
      }}>
        <p style={{ margin: 0, fontSize: "14px" }}>
          <strong>You've been invited to join:</strong><br />
          <span style={{ fontSize: "18px", color: "#1976D2" }}>{inviteData.clinicName}</span>
        </p>
        <p style={{ margin: "10px 0 0 0", fontSize: "14px", color: "#666" }}>
          Role: <strong>{inviteData.role}</strong><br />
          Email: <strong>{inviteData.email}</strong>
        </p>
      </div>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
            Full Name
          </label>
          <input
            type="text"
            value={inviteData.name}
            disabled
            style={{ 
              width: "100%", 
              padding: 10, 
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "#f5f5f5",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
            Email
          </label>
          <input
            type="email"
            value={inviteData.email}
            disabled
            style={{ 
              width: "100%", 
              padding: 10, 
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: "#f5f5f5",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
            Create Password *
          </label>
          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ 
              width: "100%", 
              padding: 10, 
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
            Confirm Password *
          </label>
          <input
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            style={{ 
              width: "100%", 
              padding: 10, 
              border: "1px solid #ddd",
              borderRadius: "4px",
              boxSizing: "border-box"
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#f44336", marginBottom: 15, fontSize: "14px" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: 12,
            background: submitting ? "#ccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: submitting ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "Creating Account..." : "Complete Registration"}
        </button>
      </form>

      <p style={{ marginTop: 20, fontSize: "12px", color: "#666", textAlign: "center" }}>
        By registering, you agree to join {inviteData.clinicName} as a {inviteData.role}.
      </p>
    </div>
  );
};

export default StaffRegister;