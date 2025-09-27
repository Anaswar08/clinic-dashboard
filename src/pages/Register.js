import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const [form, setForm] = useState({
        clinic: "",
        name: "",
        email: "",
        password: "",
    });

    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            // 1. Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                form.email,
                form.password
            );
            const user = userCredential.user;

            // 2. Send email verification link
            await sendEmailVerification(user, {
                url: "http://localhost:3000/", // or your deployed site URL
                handleCodeInApp: false,
            });
            console.log("Verification email sent to:", user.email);

            // 3. Save to "pendingClinicRequests"
            await addDoc(collection(db, "pendingClinicRequests"), {
                uid: user.uid,
                clinic: form.clinic,
                name: form.name,
                email: form.email,
                password: form.password,
                status: "pending",
                createdAt: new Date(),
            });

            // 4. Show message to verify email
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setError("Failed to register: " + err.message);
        }
    };

    if (submitted) {
        return (
            <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
                <h2>Registration Submitted</h2>
                <p>
                    A verification link has been sent to your email. <br />
                    Please verify your email before logging in.
                </p>
                <button onClick={() => navigate("/")}>Back to Login</button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
            <h2>Clinic Registration</h2>
            <form onSubmit={handleSubmit}>
                <input
                    name="clinic"
                    placeholder="Clinic Name"
                    type="text"
                    value={form.clinic}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", marginBottom: 10 }}
                />
                <input
                    name="name"
                    placeholder="Admin Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", marginBottom: 10 }}
                />
                <input
                    name="email"
                    placeholder="Email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", marginBottom: 10 }}
                />
                <input
                    name="password"
                    placeholder="Password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", marginBottom: 10 }}
                />

                <button type="submit" style={{ width: "100%", padding: 10 }}>
                    Submit Registration
                </button>
            </form>

            {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

            <p style={{ marginTop: 10 }}>
                <a href="/">Back to Login</a>
            </p>
        </div>
    );
};

export default Register;
