import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1) Sign in with Firebase Auth
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // 2) Fetch role from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        setError("Your account is not yet approved or completed.");
        return;
      }

      const userData = userDoc.data();
      const role = (userData.role || "").toLowerCase();

      // 3) Require email verification for doctor & staff (super-admins often set manually)
      if ((role === "doctor" || role === "staff") && !user.emailVerified) {
        setError("Please verify your email before logging in.");
        return;
      }

      // 4) Persist minimal session info (optional)
      localStorage.setItem("userRole", role);
      localStorage.setItem("userEmail", user.email || "");

      // 5) Route by role
      switch (role) {
        case "super-admin":
          navigate("/super-admin-dashboard");
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "doctor":
          navigate("/doctor-dashboard");
          break;
        case "staff":
          navigate("/staff-dashboard");
          break;
        default:
          setError("Unknown user role. Please contact support.");
          break;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid email or password.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Login
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <p style={{ marginTop: 10 }}>
        <a href="/register">New Clinic Registration</a> |{" "}
        <a href="/forgot-password">Forgot Password?</a>
      </p>
    </div>
  );
};

export default Login;
  