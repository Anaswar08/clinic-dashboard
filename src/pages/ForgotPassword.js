import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
//import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  //const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent!");
    } catch (err) {
      setError("Failed to send reset email.");
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />
        <button type="submit" style={{ width: "100%", padding: 10 }}>
          Send Reset Link
        </button>
      </form>

      {message && <p style={{ color: "green", marginTop: 10 }}>{message}</p>}
      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      <p style={{ marginTop: 20 }}>
        <a href="/">Back to Login</a>
      </p>
    </div>
  );
};

export default ForgotPassword;
