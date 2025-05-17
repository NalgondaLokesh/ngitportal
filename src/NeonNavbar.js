import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase"; // Adjust the path if needed
import "./NeonNavbar.css";

function NeonNavbar({ isLoggedIn, userRole }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user using Firebase
      // Clear any app-specific state here if needed
      navigate("/"); // Redirect to the login page
    } catch (error) {
      console.error("Logout failed:", error); // Log the error for debugging
    }
  };

  return (
    <nav className="navbar navbar-expand-lg neon-navbar">
      <div className="container">
        <Link className="navbar-brand neon-navbar-brand" to="/">
          <i className="bi bi-lightning-charge-fill"></i> Campus Portal
        </Link>
        <button
          className="navbar-toggler neon-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNeon"
          aria-controls="navbarNeon"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNeon">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            {isLoggedIn ? (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link neon-link${
                      location.pathname === "/events" ? " active" : ""
                    }`}
                    to="/events"
                  >
                    Upcoming Events
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link neon-link${
                      location.pathname === "/profile" ? " active" : ""
                    }`}
                    to="/profile"
                  >
                    Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <button
                    className="nav-link neon-link btn btn-link p-0"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link neon-link" to="/login">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link neon-link" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NeonNavbar;