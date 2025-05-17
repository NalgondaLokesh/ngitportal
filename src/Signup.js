import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./Signup.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      // Register user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Save user role to Firestore (user or coordinator)
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: userCredential.user.email,
        role: isCoordinator ? "coordinator" : "user"
      });
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    }
  };

  return (
    <div className="signup-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="neon-signup-card p-4">
        <h2 className="neon-text text-center mb-4">Sign Up</h2>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success neon-success-popup py-2 text-center">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="email">Email</label>
            <input className="form-control neon-input"
              type="email" id="email" value={email} required
              onChange={e=>setEmail(e.target.value)} placeholder="Enter your email" />
          </div>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="password">Password</label>
            <input className="form-control neon-input"
              type="password" id="password" value={password} required
              onChange={e=>setPassword(e.target.value)} placeholder="Password" />
          </div>
          <div className="mb-4">
            <label className="form-label neon-subtext" htmlFor="confirm">Confirm Password</label>
            <input className="form-control neon-input"
              type="password" id="confirm" value={confirm} required
              onChange={e=>setConfirm(e.target.value)} placeholder="Re-type password" />
          </div>
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="coordinatorCheck"
              checked={isCoordinator}
              onChange={e => setIsCoordinator(e.target.checked)}
            />
            <label className="form-check-label neon-subtext" htmlFor="coordinatorCheck">
              Register as Coordinator
            </label>
          </div>
          <button type="submit" className="btn btn-neon w-100 mb-2">
            Sign Up
          </button>
        </form>
        <div className="text-center mt-3">
          <span className="neon-subtext">Already have an account?</span> <br />
          <a href="/login" className="btn btn-outline-neon mt-2 px-4">Login</a>
        </div>
      </div>
    </div>
  );
}

export default Signup;