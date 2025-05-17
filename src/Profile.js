import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const { user, role, logout } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loadingRegistered, setLoadingRegistered] = useState(true);
  const [loadingCreated, setLoadingCreated] = useState(true);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", date: "" });
  const navigate = useNavigate();

  // Fetch events registered (for users)
  useEffect(() => {
    if (!user) return;
    async function fetchRegisteredEvents() {
      const eventsQuery = query(collection(db, "events"));
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = [];
      for (let docSnap of eventsSnapshot.docs) {
        const regRef = collection(db, "events", docSnap.id, "registrations");
        const regSnap = await getDocs(regRef);
        for (let reg of regSnap.docs) {
          if (reg.id === user.uid) {
            events.push({
              id: docSnap.id,
              ...docSnap.data(),
            });
          }
        }
      }
      setRegisteredEvents(events);
      setLoadingRegistered(false);
    }
    fetchRegisteredEvents();
  }, [user]);

  // Fetch events created (for coordinators)
  useEffect(() => {
    if (!user || role !== "coordinator") return;
    async function fetchCreatedEvents() {
      const createdQuery = query(
        collection(db, "events"),
        where("createdBy", "==", user.email)
      );
      const createdSnapshot = await getDocs(createdQuery);
      const events = createdSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setCreatedEvents(events);
      setLoadingCreated(false);
    }
    fetchCreatedEvents();
  }, [user, role]);

  // Edit handlers
  const handleEditStart = (ev) => {
    setEditingEventId(ev.id);
    setEditForm({
      title: ev.title,
      description: ev.description,
      date: ev.date.seconds
        ? new Date(ev.date.seconds * 1000).toISOString().slice(0, 16)
        : ev.date,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (eventId) => {
    const eventRef = doc(db, "events", eventId);
    await updateDoc(eventRef, {
      title: editForm.title,
      description: editForm.description,
      date: new Date(editForm.date),
    });
    setCreatedEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId
          ? { ...ev, title: editForm.title, description: editForm.description, date: new Date(editForm.date) }
          : ev
      )
    );
    setEditingEventId(null);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This cannot be undone.")) return;
    await deleteDoc(doc(db, "events", eventId));
    setCreatedEvents((prev) => prev.filter((ev) => ev.id !== eventId));
  };

  if (!user) return <p>Please login to view your profile.</p>;

  // Get user initials for avatar
  const getInitials = (email) => {
    return email
      .split('@')[0]
      .split('.')
      .map(name => name[0].toUpperCase())
      .join('');
  };

  return (
    <div className="profile-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="dark-mode-container" style={{ maxWidth: 700, width: '100%', margin: '2rem auto' }}>
        <div className="dark-mode-cardbox" style={{
          marginBottom: '2.2rem',
          textAlign: 'center',
          border: '1px solid #00ffe7',
          borderRadius: '10px',
          padding: '20px',
          background: 'linear-gradient(145deg, #06002E, #1a004f)',
          boxShadow: '0 0 15px rgba(0, 255, 231, 0.3), 0 0 15px rgba(255, 0, 230, 0.3)',
        }}>
          <div className="dark-mode-avatar">
            {/* Reverted to displaying initials only */}
            {getInitials(user.email)}
          </div>
          <h2 className="dark-mode-title">{user.email.split('@')[0]}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
            <div>
              <span className="dark-mode-label">EMAIL</span>
              <p style={{ marginTop: '0.5rem' }}>{user.email}</p>
            </div>
            <div>
              <span className="dark-mode-label">ROLE</span>
              <p style={{ marginTop: '0.5rem' }}>{role.charAt(0).toUpperCase() + role.slice(1)}</p>
            </div>
          </div>
        </div>
        
        <hr className="dark-mode-section-divider" />
        
        {role === "user" && (
          <div className="dark-mode-cardbox">
            <h3 className="dark-mode-title" style={{fontSize: '1.5rem', marginBottom: '1.5rem'}}>
              <i className="bi bi-calendar-check" style={{marginRight: '10px'}}></i>
              Your Registered Events
            </h3>
            {loadingRegistered ? (
              <div className="text-center">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : registeredEvents.length === 0 ? (
              <div className="text-center" style={{color: '#ff00e6', textShadow: '0 0 6px #ff00e6'}}>
                <i className="bi bi-calendar-x" style={{fontSize: '2rem', marginBottom: '1rem', display: 'block'}}></i>
                <p>You have not registered for any events yet.</p>
              </div>
            ) : (
              <ul className="dark-mode-list">
                {registeredEvents.map((ev, index) => (
                  <li key={ev.id}>
                    <h4 className="dark-mode-title" style={{textAlign: 'left'}}>{ev.title}</h4>
                    <p>{ev.description}</p>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <i className="bi bi-clock" style={{marginRight: '6px'}}></i>
                      {new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {role === "coordinator" && (
          <div className="dark-mode-cardbox">
            <h3 className="dark-mode-title" style={{fontSize: '1.5rem', marginBottom: '1.5rem'}}>
              <i className="bi bi-calendar-plus" style={{marginRight: '10px'}}></i>
              Events You Created
            </h3>
            {loadingCreated ? (
              <div className="text-center">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : createdEvents.length === 0 ? (
              <div className="text-center" style={{color: '#ff00e6', textShadow: '0 0 6px #ff00e6'}}>
                <i className="bi bi-calendar-x" style={{fontSize: '2rem', marginBottom: '1rem', display: 'block'}}></i>
                <p>You have not created any events yet.</p>
              </div>
            ) : (
              <ul className="dark-mode-list">
                {createdEvents.map((ev, index) => (
                  <li key={ev.id}>
                    {editingEventId === ev.id ? (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          handleEditSubmit(ev.id);
                        }}
                        style={{ marginBottom: 10 }}
                      >
                        <input
                          type="text"
                          name="title"
                          value={editForm.title}
                          onChange={handleEditChange}
                          required
                          placeholder="Event Title"
                          className="dark-mode-input"
                        />
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleEditChange}
                          required
                          placeholder="Description"
                          className="dark-mode-input"
                        />
                        <input
                          type="datetime-local"
                          name="date"
                          value={editForm.date}
                          onChange={handleEditChange}
                          required
                          className="dark-mode-input"
                        />
                        <div style={{display: 'flex', gap: '10px'}}>
                          <button type="submit" className="dark-mode-btn">
                            <i className="bi bi-check-circle" style={{marginRight: '5px'}}></i>Save
                          </button>
                          <button type="button" className="dark-mode-btn" onClick={() => setEditingEventId(null)} style={{background: '#555'}}>
                            <i className="bi bi-x-circle" style={{marginRight: '5px'}}></i>Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <h4 className="dark-mode-title" style={{textAlign: 'left'}}>{ev.title}</h4>
                        <p>{ev.description}</p>
                        <div className="event-details" style={{display: 'flex', alignItems: 'center', marginBottom: '1rem'}}>
                          <i className="bi bi-clock" style={{marginRight: '6px'}}></i>
                          {new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date).toLocaleString()}
                        </div>
                        <p className="created-by-text">Created by: {ev.createdBy}</p>
                        <div style={{display: 'flex', gap: '10px'}}>
                          <button className="dark-mode-btn" onClick={() => handleEditStart(ev)}>
                            <i className="bi bi-pencil" style={{marginRight: '5px'}}></i>Edit
                          </button>
                          <button className="dark-mode-btn" onClick={() => handleDelete(ev.id)} style={{background: '#dc3545', color: 'white'}}>
                            <i className="bi bi-trash" style={{marginRight: '5px'}}></i>Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;