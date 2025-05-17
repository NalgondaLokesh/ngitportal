import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import Home from "./Home";
import CreateEvent from "./CreateEvent";
import Profile from "./Profile";
import CalendarView from "./CalendarView";
import EventList from "./EventList";
import NeonNavbar from "./NeonNavbar"; // Import NeonNavbar
import { useAuth } from "./AuthContext";

function App() {
  const { user, role, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <NeonNavbar isLoggedIn={!!user} userRole={role} /> {/* Use NeonNavbar */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/events" element={<EventList />} />
      </Routes>
    </Router>
  );
}

export default App;