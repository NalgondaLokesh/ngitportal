import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import './EventList.css';

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, role, logout } = useAuth();
  const [rsvpStatus, setRsvpStatus] = useState({});
  const [registrations, setRegistrations] = useState({});
  const [openEvent, setOpenEvent] = useState(null);
  const [regCounts, setRegCounts] = useState({}); // <--- New state for registration counts
  const [viewingPhotos, setViewingPhotos] = useState(null); // State for photo viewer
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
    console.log('View registrations clicked for event:', eventId);
    if (openEvent === eventId) {
      setOpenEvent(null);
      setRegistrations((prev) => ({ ...prev, [eventId]: [] })); // Clear registrations when closing
      return;
    }
    const regsCol = collection(db, "events", eventId, "registrations");
    const regsSnap = await getDocs(regsCol);
    const regs = [];
    for (const regDoc of regsSnap.docs) {
      const regData = regDoc.data();
      // Fetch user details
      const userRef = doc(db, "users", regData.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        regs.push({
          ...regData,
          name: userData.name,
          section: userData.section,
          uniqueId: userData.uniqueId,
          branch: userData.branch,
          year: userData.year,
        });
      } else {
        regs.push(regData); // Push original data if user not found
      }
    }
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

  // Add logout handler (commented out as not currently used)
  // const handleLogout = async () => {
  //   await logout();
  //   navigate("/login");
  // };

  // Photo viewing handlers
  const handleViewPhotos = (eventId, imageUrls) => {
    setViewingPhotos({ eventId, imageUrls });
  };

  const handleClosePhotos = () => {
    setViewingPhotos(null);
  };

  // Delete event handler for coordinators
  const handleDeleteEvent = async (eventId, eventTitle) => {
    console.log('Delete event clicked for event:', eventId, eventTitle);
    if (!user || role !== "coordinator") {
      alert("You are not authorized to delete events.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete the event "${eventTitle}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, "events", eventId));
        setEvents(prevEvents => prevEvents.filter(ev => ev.id !== eventId));
        alert("Event deleted successfully!");
      } catch (error) {
        console.error("Error deleting event: ", error);
        alert("Failed to delete event.");
      }
    }
  };

  // Export registrations to Excel for coordinators
  const handleExportRegistrations = async (eventId, eventTitle) => {
    console.log('Export registrations clicked for event:', eventId, eventTitle);
    if (!user || role !== "coordinator") {
      alert("You are not authorized to export registrations.");
      return;
    }

    try {
      const regsCol = collection(db, "events", eventId, "registrations");
      const regsSnap = await getDocs(regsCol);
      const regsData = [];

      for (const regDoc of regsSnap.docs) {
        const regData = regDoc.data();
        const userRef = doc(db, "users", regData.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          regsData.push({
            Name: userData.name || 'N/A',
            'Unique ID': userData.uniqueId || 'N/A',
            Branch: userData.branch || 'N/A',
            Year: userData.year || 'N/A',
            Section: userData.section || 'N/A',
            Email: userData.email || 'N/A',
            'Registered On': regData.timestamp ? new Date(regData.timestamp.seconds * 1000).toLocaleString() : 'N/A',
          });
        } else {
          regsData.push({
            Name: 'N/A',
            'Unique ID': 'N/A',
            Branch: 'N/A',
            Year: 'N/A',
            Section: 'N/A',
            Email: regData.email || 'N/A',
            'Registered On': regData.timestamp ? new Date(regData.timestamp.seconds * 1000).toLocaleString() : 'N/A',
          });
        }
      }

      if (regsData.length === 0) {
        alert("No registrations to export for this event.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(regsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Registrations");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(data, `${eventTitle}_Registrations.xlsx`);
      alert("Registrations exported successfully!");

    } catch (error) {
      console.error("Error exporting registrations: ", error);
      alert("Failed to export registrations.");
    }
  };

  if (loading) return <p>Loading events...</p>;
  if (events.length === 0) return (
    <div className="neon-events-container">
      <h2 className="neon-events-title">Upcoming Events</h2>
      <p className="neon-subtext no-events-message">
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
    <div className="neon-events-container">
      {/* Header row: title and top-right controls aligned */}
      <div className="events-header">
        <h2 className="neon-events-title">Upcoming Events</h2>
        {user && (
          <div className="events-controls">
            <span className={`role-tag ${role === 'coordinator' ? 'coordinator-tag' : 'user-tag'}`}>{role === 'coordinator' ? 'Coordinator' : 'User'}</span>
            {role === 'coordinator' && (
              <button
                className="neon-event-btn create-event-btn"
                onClick={() => navigate('/create-event')}
              >
                + Create Event
              </button>
            )}
          </div>
        )}
      </div>
      {filteredEvents.length === 0 ? (
        <div className="no-events-message-container">
          <i className="bi bi-calendar-x no-events-icon"></i>
          <p className="neon-subtext no-events-message">No events yet! Check back soon.</p>
        </div>
      ) : (
      <ul className="neon-event-list">
        {filteredEvents.map((ev) => {
          const isNext = ev.id === nextEventId;
          console.log("Event data:", ev);
          console.log("Event imageUrls:", ev.imageUrls);
          return (
            <li key={ev.id} className={`neon-event-item ${isNext ? 'next-event-pulse' : ''}`}>
              <div className="event-details-content">
                <h3 className="neon-event-title">{ev.title}</h3>
                <p className="neon-subtext event-description">{ev.description}</p>
                <p className="neon-event-date">
                  Date: {new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date).toLocaleString()}
                </p>
                <p className="neon-subtext event-created-by">
                  Created by: {ev.createdBy}
                </p>
                <p className="neon-event-regcount">
                  Registered Students: {regCounts[ev.id] ?? 0}
                </p>
                {((ev.imageUrls && ev.imageUrls.length > 0) || ev.imageUrl) && (
                  <div className="event-photos-section">
                    <button 
                      onClick={() => handleViewPhotos(ev.id, ev.imageUrls || [ev.imageUrl])}
                      className="neon-event-btn view-photos-btn"
                      style={{ marginTop: '10px' }}
                    >
                      <i className="bi bi-images" style={{marginRight: '5px'}}></i>
                      View Photos ({ev.imageUrls ? ev.imageUrls.length : 1})
                    </button>
                    <div className="event-images-preview">
                      {(ev.imageUrls || [ev.imageUrl]).slice(0, 3).map((url, imgIndex) => (
                        <img 
                          key={imgIndex} 
                          src={url} 
                          alt={`Event ${imgIndex + 1}`} 
                          className="event-image-preview" 
                        />
                      ))}
                      {(ev.imageUrls || [ev.imageUrl]).length > 3 && (
                        <div className="more-photos-indicator">
                          +{(ev.imageUrls || [ev.imageUrl]).length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {user && role === "user" && (
                <>
                  {rsvpStatus[ev.id] ? (
                    <button onClick={() => handleUnregister(ev.id)} className="neon-event-btn unregister-btn">
                      <i className="bi bi-x-circle"></i>Unregister
                    </button>
                  ) : (
                    <button onClick={() => handleRSVP(ev.id)} className="neon-event-btn register-btn">
                      <i className="bi bi-check-circle"></i>Register for Event
                    </button>
                  )}
                </>
              )}

              {user && role === "coordinator" && (
                <>
                  <div className="coordinator-buttons">
                    <button onClick={() => handleViewRegistrations(ev.id)} className="neon-event-btn view-registrations-btn">
                        <i className="bi bi-list-check"></i>{openEvent === ev.id ? "Hide Registrations" : "View Registrations"}
                      </button>
                    <button onClick={() => handleExportRegistrations(ev.id, ev.title)} className="neon-event-btn export-btn">
                        <i className="bi bi-file-earmark-excel"></i>Export to Excel
                      </button>
                    <button onClick={() => {
                      console.log('Edit event clicked for event:', ev.id);
                      navigate(`/edit-event/${ev.id}`);
                    }} className="neon-event-btn edit-btn">
                      <i className="bi bi-pencil-square"></i>Edit Event
                    </button>
                    <button onClick={() => handleDeleteEvent(ev.id, ev.title)} className="neon-event-btn delete-btn">
                      <i className="bi bi-trash"></i>Delete Event
                    </button>
                  </div>
                  {openEvent === ev.id && (
                    <div className="neon-event-registrations">
                      <strong className="registrations-title">Registrations:</strong>
                      {registrations[ev.id] && registrations[ev.id].length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-dark table-striped table-hover table-sm">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>ID</th>
                                <th>Branch</th>
                                <th>Year</th>
                                <th>Section</th>
                                <th>Email</th>
                              </tr>
                            </thead>
                            <tbody>
                              {registrations[ev.id].map((reg, idx) => (
                                <tr key={idx}>
                                  <td>{reg.name || 'N/A'}</td>
                                  <td>{reg.uniqueId || 'N/A'}</td>
                                  <td>{reg.branch || 'N/A'}</td>
                                  <td>{reg.year || 'N/A'}</td>
                                  <td>{reg.section || 'N/A'}</td>
                                  <td>{reg.email}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="no-registrations-message">No registrations yet.</p>
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

      {/* Photo Viewer Modal */}
      {viewingPhotos && (
        <div className="photo-viewer-modal">
          <div className="photo-viewer-content">
            <div className="photo-viewer-header">
              <h3 className="photo-viewer-title">Event Photos</h3>
              <button 
                onClick={handleClosePhotos}
                className="close-photo-viewer-btn"
              >
                <i className="bi bi-x-circle"></i>
              </button>
            </div>
            <div className="photo-viewer-body">
              <div className="photo-grid">
                {viewingPhotos.imageUrls.map((url, index) => (
                  <div key={index} className="photo-item">
                    <img 
                      src={url} 
                      alt={`Photo ${index + 1}`}
                      className="photo-viewer-image"
                      onClick={() => window.open(url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

export default EventList;