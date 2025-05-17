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
  if (events.length === 0) return (
    <div className="neon-events-container" style={{ position: 'relative' }}>
      <h2 className="neon-events-title">Upcoming Events</h2>
      <p style={{ color: '#00ffe7', textShadow: '0 0 8px #00ffe7, 0 0 16px #ff00e6', fontWeight: 'bold', fontSize: '1.4rem', textAlign: 'center', marginTop: '2.5rem' }}>
        No events yet! Check back soon.
      </p>
    </div>
  );

  // Filter out 'Hackathon 1' and 'nice one' from the events list
  const filteredEvents = events.filter(ev => ev.title !== 'Hackathon 1' && ev.title !== 'nice one');

  // Find the next upcoming event (by soonest date)
  const now = new Date();
  let nextEventId = null;
  if (filteredEvents.length > 0) {
    const sorted = [...filteredEvents].sort((a, b) => {
      const da = new Date(a.date.seconds ? a.date.seconds * 1000 : a.date);
      const db = new Date(b.date.seconds ? b.date.seconds * 1000 : b.date);
      return da - db;
    });
    const next = sorted.find(ev => new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date) > now);
    if (next) nextEventId = next.id;
  }

  return (
    <div className="neon-events-container" style={{ position: 'relative' }}>
      {/* Header row: title and top-right controls aligned */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', minHeight: '48px' }}>
        <h2 className="neon-events-title" style={{ margin: 0, lineHeight: 1 }}>Upcoming Events</h2>
        {user && (
          <div style={{ display: 'flex', gap: '0.7em', alignItems: 'center', height: '100%' }}>
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
              marginRight: '0.2em',
              display: 'flex',
              alignItems: 'center',
              height: '40px'
            }}>{role === 'coordinator' ? 'Coordinator' : 'User'}</span>
            {role === 'coordinator' && (
              <button
                className="neon-event-btn"
                style={{ fontSize: '1rem', padding: '0.4em 1.2em', height: '40px', display: 'flex', alignItems: 'center' }}
                onClick={() => navigate('/create-event')}
              >
                + Create Event
              </button>
            )}
          </div>
        )}
      </div>
      {filteredEvents.length === 0 ? (
        <div style={{textAlign:'center',padding:'2em 0'}}>
          <i className="bi bi-calendar-x" style={{fontSize:'3em',color:'#ff00e6',textShadow:'0 0 12px #00ffe7'}}></i>
          <p className="neon-subtext mt-3" style={{ color: '#ff00e6', fontWeight: 'bold', fontSize: '1.2rem' }}>No events yet! Check back soon.</p>
        </div>
      ) : (
      <ul className="neon-event-list">
        {filteredEvents.map((ev) => {
          const isNext = ev.id === nextEventId;
          return (
            <li key={ev.id} className="neon-event-item" style={{
              ...isNext ? {border:'2.5px solid #ff00e6',boxShadow:'0 0 32px #ff00e6, 0 0 48px #00ffe7',animation:'pulse-glow 1.5s infinite alternate'} : {},
              border: '1px solid #00ffe7',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '20px',
              background: 'linear-gradient(145deg, #06002E, #1a004f)',
              boxShadow: '0 0 15px rgba(0, 255, 231, 0.3), 0 0 15px rgba(255, 0, 230, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div style={{marginBottom: '15px'}}>
                <h3 className="neon-event-title" style={{ color: '#00ffe7', textShadow: '0 0 8px #00ffe7, 0 0 16px #ff00e6', marginBottom: '5px' }}>{ev.title}</h3>
                <p className="neon-subtext" style={{ color: '#ffffff99', fontSize: '0.9em', marginBottom: '5px' }}>{ev.description}</p>
                <p className="neon-event-date" style={{ color: '#ffffffcc', fontSize: '0.9em', marginBottom: '5px' }}>
                  Date: {new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date).toLocaleString()}
                </p>
                <p className="neon-subtext" style={{ color: '#ffffffcc', fontSize: '0.9em', marginBottom: '15px' }}>
                  Created by: {ev.createdBy}
                </p>
                <p className="neon-event-regcount" style={{ color: '#ff00e6', textShadow: '0 0 8px #ff00e6, 0 0 16px #00ffe7', fontWeight: 'bold' }}>
                  Registered Students: {regCounts[ev.id] ?? 0}
                </p>
              </div>

              {user && role === "user" && (
                <>
                  {rsvpStatus[ev.id] ? (
                    <button onClick={() => handleUnregister(ev.id)} className="neon-event-btn" style={{ color: "#fff", background: "#ff0033", border: 'none', borderRadius: '5px', padding: '10px 20px', cursor: 'pointer', fontSize: '1em' }}>
                      <i className="bi bi-x-circle" style={{marginRight:4}}></i>Unregister
                    </button>
                  ) : (
                    <button onClick={() => handleRSVP(ev.id)} className="neon-event-btn" style={{ background: 'linear-gradient(90deg, #00ffe7 0%, #ff00e6 100%)', color: '#06002E', border: 'none', borderRadius: '5px', padding: '10px 20px', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}>
                      <i className="bi bi-check-circle" style={{marginRight:4}}></i>Register for Event
                    </button>
                  )}
                </>
              )}

              {user && role === "coordinator" && (
                <>
                  <button onClick={() => handleViewRegistrations(ev.id)} className="neon-event-btn" style={{ background: 'linear-gradient(90deg, #00ffe7 0%, #ff00e6 100%)', color: '#06002E', border: 'none', borderRadius: '5px', padding: '10px 20px', cursor: 'pointer', fontSize: '1em', fontWeight: 'bold' }}>
                    <i className="bi bi-list-check" style={{marginRight:4}}></i>{openEvent === ev.id ? "Hide Registrations" : "View Registrations"}
                  </button>
                  {openEvent === ev.id && (
                    <div className="neon-event-registrations" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ffffff33' }}>
                      <strong style={{ color: '#00ffe7' }}>Registrations:</strong>
                      {registrations[ev.id] && registrations[ev.id].length > 0 ? (
                        <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                          {registrations[ev.id].map((reg, idx) => (
                            <li key={idx} style={{ color: '#ffffffcc', marginBottom: '5px' }}><i className="bi bi-person-badge" style={{marginRight:4}}></i>{reg.email}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: '#ffffff99' }}>No registrations yet.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      )}
      {/* Neon pulse animation for next event */}
      <style>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 32px #ff00e6, 0 0 48px #00ffe7; }
          100% { box-shadow: 0 0 64px #ff00e6, 0 0 96px #00ffe7; }
        }
      `}</style>
    </div>
  );
}

export default EventList;