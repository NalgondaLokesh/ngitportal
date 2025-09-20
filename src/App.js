import 'bootstrap/dist/css/bootstrap.min.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Signup from "./Signup";
import Login from "./Login";
import Home from "./Home";
import CreateEvent from "./CreateEvent";
import EditEvent from "./EditEvent"; // Import EditEvent
import Profile from "./Profile";
import CalendarView from "./CalendarView";
import EventList from "./EventList";
import NeonNavbar from "./NeonNavbar";
import { useAuth } from "./AuthContext";

// ProtectedRoute component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  // const navigate = useNavigate();

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    // User not logged in, redirect to login page
    return <Login />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // User logged in but unauthorized role, redirect to home or show error
    return <Home />;
  }

  return children;
}

function App() {
  const { user, role, loading, error } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#0a0a0a',
        color: '#00ffe7'
      }}>
        <div>Loading...</div>
        {error && <div style={{ color: 'red', marginTop: '10px' }}>Error: {error}</div>}
      </div>
    );
  }

  return (
    <Router>
      <NeonNavbar isLoggedIn={!!user} userRole={role} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-event" element={<ProtectedRoute allowedRoles={["coordinator"]}><CreateEvent /></ProtectedRoute>} />
        <Route path="/edit-event/:id" element={<ProtectedRoute allowedRoles={["coordinator"]}><EditEvent /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/events" element={<EventList />} />
        
      </Routes>
      
    </Router>
  );
}

export default App;