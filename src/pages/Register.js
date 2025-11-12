import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { collection, addDoc, setDoc, doc } from "firebase/firestore";
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

            // 3. Create clinic document with "pending" status
            const clinicRef = await addDoc(collection(db, "clinics"), {
                name: form.clinic,
                adminId: user.uid,
                status: "pending", // Super admin needs to approve
                createdAt: new Date(),
            });

            console.log("Clinic created with ID:", clinicRef.id);

            // 4. Add minimal reference in clinic's users subcollection
            await setDoc(doc(db, `clinics/${clinicRef.id}/users/${user.uid}`), {
                role: "admin",
                addedAt: new Date(),
            });

            // 5. Create top-level user document with full details
            await setDoc(doc(db, `users/${user.uid}`), {
                name: form.name,
                email: form.email,
                clinicId: clinicRef.id,
                role: "admin",
                status: "pending", // Super admin needs to approve
                emailVerified: false,
                createdAt: new Date(),
            });

            console.log("User document created for:", user.uid);

            // 6. Show message to verify email and wait for approval
            setSubmitted(true);
        } catch (err) {
            console.error("Registration error:", err);
            setError("Failed to register: " + err.message);
        }
    };

    if (submitted) {
        return (
            <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
                <h2>Registration Submitted</h2>
                <p>
                    Thank you for registering! Please complete these steps:
                </p>
                <ol style={{ textAlign: "left" }}>
                    <li>Check your email and verify your email address</li>
                    <li>Wait for admin approval (you'll receive a confirmation email)</li>
                </ol>
                <p style={{ marginTop: 20, fontSize: 14, color: "#666" }}>
                    You'll be able to log in once both steps are complete.
                </p>
                <button 
                    onClick={() => navigate("/")}
                    style={{ marginTop: 20, padding: "10px 20px" }}
                >
                    Back to Login
                </button>
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
                    style={{ width: "100%", marginBottom: 10, padding: 8 }}
                />
                <input
                    name="name"
                    placeholder="Admin Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", marginBottom: 10, padding: 8 }}
                />
                <input
                    name="email"
                    placeholder="Email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{ width: "100%", marginBottom: 10, padding: 8 }}
                />
                <input
                    name="password"
                    placeholder="Password (min 6 characters)"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    style={{ width: "100%", marginBottom: 10, padding: 8 }}
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