import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, role, logout } = useAuth();
  const [rsvpStatus, setRsvpStatus] = useState({});
  const [registrations, setRegistrations] = useState({});
  const [openEvent, setOpenEvent] = useState(null);
  const [regCounts, setRegCounts] = useState({}); // <--- New state for registration counts
  const navigate = useNavigate();

  // Fetch events on mount
  useEffect(() => {
    async function fetchEvents() {
      const q = query(collection(db, "events"), orderBy("date", "asc"));
      const querySnapshot = await getDocs(q);
      const eventsArr = [];
      querySnapshot.forEach((doc) => {
        eventsArr.push({ id: doc.id, ...doc.data() });
      });
      setEvents(eventsArr);
      setLoading(false);
    }
    fetchEvents();
  }, []);

  // Track registration status (for user)
  useEffect(() => {
    if (!user || role !== "user") return;
    async function checkRSVPs() {
      const status = {};
      for (let ev of events) {
        const regRef = doc(db, "events", ev.id, "registrations", user.uid);
        const regSnap = await getDoc(regRef);
        status[ev.id] = regSnap.exists();
      }
      setRsvpStatus(status);
    }
    checkRSVPs();
  }, [events, user, role]);

  // Listen for registration count changes for each event
  useEffect(() => {
    const unsubscribes = [];
    events.forEach(ev => {
      const regsCol = collection(db, "events", ev.id, "registrations");
      const unsubscribe = onSnapshot(regsCol, snapshot => {
        setRegCounts(prev => ({
          ...prev,
          [ev.id]: snapshot.size
        }));
      });
      unsubscribes.push(unsubscribe);
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [events]);

  // Registration list for coordinators
  const handleViewRegistrations = async (eventId) => {
    if (openEvent === eventId) {
      setOpenEvent(null);
      return;
    }
    const regsCol = collection(db, "events", eventId, "registrations");
    const regsSnap = await getDocs(regsCol);
    const regs = [];
    regsSnap.forEach((doc) => {
      regs.push(doc.data());
    });
    setRegistrations((prev) => ({ ...prev, [eventId]: regs }));
    setOpenEvent(eventId);
  };

  // RSVP (register) for users
  const handleRSVP = async (eventId) => {
    if (!user) return;
    const regRef = doc(db, "events", eventId, "registrations", user.uid);
    await setDoc(regRef, {
      userId: user.uid,
      email: user.email,
      timestamp: new Date(),
    });
    setRsvpStatus((prev) => ({ ...prev, [eventId]: true }));
    // Live count will update via the onSnapshot listener
  };

  // Unregister for users
  const handleUnregister = async (eventId) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to unregister from this event?")) return;
    const regRef = doc(db, "events", eventId, "registrations", user.uid);
    await deleteDoc(regRef);
    setRsvpStatus((prev) => ({ ...prev, [eventId]: false }));
    // Live count will update via the onSnapshot listener
  };

  // Add logout handler
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) return <p>Loading events...</p>;
  if (events.length === 0) return <p>No events yet!</p>;

  // Filter out 'Hackathon 1' from the events list
  const filteredEvents = events.filter(ev => ev.title !== 'Hackathon 1');

  return (
    <div className="neon-events-container" style={{ position: 'relative' }}>
      {/* Top right controls: role badge, create event (for coordinators), logout */}
      {user && (
        <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 2, display: 'flex', gap: '0.7em', alignItems: 'center' }}>
          <span style={{
            background: role === 'coordinator' ? 'linear-gradient(90deg,#ff00e6 0%,#00ffe7 100%)' : 'linear-gradient(90deg,#00ffe7 0%,#ff00e6 100%)',
            color: '#06002E',
            fontWeight: 'bold',
            borderRadius: '0.6em',
            boxShadow: '0 0 8px #00ffe7, 0 0 8px #ff00e6',
            padding: '0.3em 1em',
            fontSize: '1rem',
            letterSpacing: '1px',
            textShadow: '0 0 6px #fff',
            border: 'none',
            marginRight: '0.2em'
          }}>
            {role === 'coordinator' ? 'Coordinator' : 'User'}
          </span>
          {role === 'coordinator' && (
            <button
              className="neon-event-btn"
              style={{ fontSize: '1rem', padding: '0.4em 1.2em' }}
              onClick={() => navigate('/create-event')}
            >
              + Create Event
            </button>
          )}
          <button
            onClick={handleLogout}
            className="neon-event-btn"
            style={{ fontSize: '1rem', padding: '0.4em 1.2em' }}
            title="Logout"
          >
            Logout
          </button>
        </div>
      )}
      <h2 className="neon-events-title">Upcoming Events</h2>
      <ul className="neon-event-list">
        {filteredEvents.map((ev) => (
          <li key={ev.id} className="neon-event-item">
            <span className="neon-event-title">{ev.title}</span><br />
            <span>{ev.description}</span><br />
            <span className="neon-event-date">Date: {new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date).toLocaleString()}</span><br />
            <span>Created by: {ev.createdBy}</span><br />

            {/* Registration count visible to everyone */}
            <span className="neon-event-regcount">
              Registered Students: {regCounts[ev.id] ?? 0}
            </span>
            <br />

            {user && role === "user" && (
              <>
                {rsvpStatus[ev.id] ? (
                  <button onClick={() => handleUnregister(ev.id)} className="neon-event-btn" style={{ color: "#fff", background: "#ff0033" }}>
                    Unregister
                  </button>
                ) : (
                  <button onClick={() => handleRSVP(ev.id)} className="neon-event-btn">
                    Register for Event
                  </button>
                )}
              </>
            )}

            {user && role === "coordinator" && (
              <>
                <button onClick={() => handleViewRegistrations(ev.id)} className="neon-event-btn">
                  {openEvent === ev.id ? "Hide Registrations" : "View Registrations"}
                </button>
                {openEvent === ev.id && (
                  <div className="neon-event-registrations">
                    <strong>Registrations:</strong>
                    {registrations[ev.id] && registrations[ev.id].length > 0 ? (
                      <ul>
                        {registrations[ev.id].map((reg, idx) => (
                          <li key={idx}>{reg.email} (UserID: {reg.userId})</li>
                        ))}
                      </ul>
                    ) : (
                      <p>No registrations yet.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EventList;