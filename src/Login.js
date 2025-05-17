import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Check Firestore for the user's role
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (!userDoc.exists()) {
        setError("User record not found.");
        return;
      }
      const storedRole = userDoc.data().role;
      if (storedRole !== role) {
        setError(`This account is registered as a ${storedRole}. Please select the correct role.`);
        return;
      }
      setSuccess("Login successful! Redirecting to events...");
      setTimeout(() => navigate("/events"), 1500);
    } catch (err) {
      setError("Invalid email, password, or role.");
    }
  };

  return (
    <div className="login-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="neon-login-card p-4">
        <h2 className="neon-text text-center mb-4">Login</h2>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success neon-success-popup py-2 text-center">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="email">Email</label>
            <input
              className="form-control neon-input"
              type="email"
              id="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="password">Password</label>
            <input
              className="form-control neon-input"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <div className="mb-4">
            <label className="form-label neon-subtext">Login as:</label>
            <div className="d-flex gap-3 mt-1">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="role"
                  id="loginUser"
                  value="user"
                  checked={role === "user"}
                  onChange={() => setRole("user")}
                />
                <label className="form-check-label neon-subtext" htmlFor="loginUser">
                  User
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="role"
                  id="loginCoordinator"
                  value="coordinator"
                  checked={role === "coordinator"}
                  onChange={() => setRole("coordinator")}
                />
                <label className="form-check-label neon-subtext" htmlFor="loginCoordinator">
                  Coordinator
                </label>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-neon w-100 mb-2">
            Login
          </button>
        </form>
        <div className="text-center mt-3">
          <span className="neon-subtext">Don't have an account?</span> <br />
          <a href="/register" className="btn btn-outline-neon mt-2 px-4">Register</a>
        </div>
      </div>
    </div>
  );
}

export default Login;