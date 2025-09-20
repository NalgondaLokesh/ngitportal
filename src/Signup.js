import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./Signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [uniqueId, setUniqueId] = useState("");
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [section, setSection] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isCoordinator, setIsCoordinator] = useState(false);
  const [nkey, setNkey] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isCoordinator && nkey !== "2455") {
      setError("Invalid Coordinator Key.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      // Register user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Save user role to Firestore (user or coordinator)
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        uniqueId,
        year,
        branch,
        section,
        email: userCredential.user.email,
        role: isCoordinator ? "coordinator" : "user"
      });
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    }
  };

  let sections = [];
  if (branch === 'CSE') {
    sections = ['A', 'B', 'C', 'D', 'E'];
  } else if (branch === 'CSM') {
    sections = ['A', 'B'];
  }

  return (
    <div className="signup-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="neon-signup-card p-4">
        <h2 className="neon-text text-center mb-4">Sign Up</h2>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success neon-success-popup py-2 text-center">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="name">Name</label>
            <input className="form-control neon-input"
              type="text" id="name" value={name} required
              onChange={e => setName(e.target.value)} placeholder="Enter your name" />
          </div>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="uniqueId">Unique ID</label>
            <input className="form-control neon-input"
              type="text" id="uniqueId" value={uniqueId} required
              onChange={e => setUniqueId(e.target.value)} placeholder="Enter your unique ID" />
          </div>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="year">Year</label>
            <select className="form-control neon-input" id="year" value={year} required onChange={e => setYear(e.target.value)}>
              <option value="">Select Year</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="branch">Branch</label>
            <select className="form-control neon-input" id="branch" value={branch} required onChange={e => { setBranch(e.target.value); setSection(''); }}>
              <option value="">Select Branch</option>
              <option value="CSE">CSE</option>
              <option value="CSM">CSM</option>
            </select>
          </div>
          {branch && (
            <div className="mb-3">
              <label className="form-label neon-subtext" htmlFor="section">Section</label>
              <select className="form-control neon-input" id="section" value={section} required onChange={e => setSection(e.target.value)}>
                <option value="">Select Section</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
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
          {isCoordinator && (
            <div className="mb-3">
              <label className="form-label neon-subtext" htmlFor="nkey">NKEY</label>
              <input className="form-control neon-input"
                type="password" id="nkey" value={nkey} required
                onChange={e => setNkey(e.target.value)} placeholder="Enter Coordinator Key" />
            </div>
          )}
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