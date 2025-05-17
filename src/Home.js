import React from "react";
import { Link } from "react-router-dom";
import "./Home.css"; // Neon styles

function Home() {
  return (
    <div className="home-neon-bg min-vh-100">
      {/* Hero Section */}
      <section className="py-5 neon-overlay text-center">
        <div className="container">
          <h1 className="display-3 fw-bold neon-text mb-3">Campus Event Portal</h1>
          <p className="lead neon-subtext mb-4">
            Discover, register, and participate in the latest events on campus.<br/>
            <span className="neon-highlight">Workshops, Seminars, Fun Activities – All in one place!</span>
          </p>
          <Link to="/events" className="btn btn-neon btn-lg shadow-lg mt-3">
            View Events
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container my-5">
        <div className="row text-center g-4">
          <div className="col-md-4">
            <div className="card neon-card h-100 border-0">
              <div className="card-body">
                <i className="bi bi-calendar-event fs-1 neon-icon mb-3"></i>
                <h5 className="card-title fw-bold neon-text">Browse Events</h5>
                <p className="neon-subtext">
                  See all upcoming events and filter by category, date, or popularity.<br/>
                  <span className="neon-highlight">Never miss what's happening!</span>
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card neon-card h-100 border-0">
              <div className="card-body">
                <i className="bi bi-person-plus fs-1 neon-icon mb-3"></i>
                <h5 className="card-title fw-bold neon-text">Easy Registration</h5>
                <p className="neon-subtext">
                  Register or unregister for events in one click.<br/>
                  <span className="neon-highlight">Track your participation and get reminders.</span>
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card neon-card h-100 border-0">
              <div className="card-body">
                <i className="bi bi-people fs-1 neon-icon mb-3"></i>
                <h5 className="card-title fw-bold neon-text">For All Users</h5>
                <p className="neon-subtext">
                  Coordinators can create/manage events.<br/>
                  <span className="neon-highlight">Students can explore and join.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Removed CTA and bottom section */}
    </div>
  );
}

export default Home;