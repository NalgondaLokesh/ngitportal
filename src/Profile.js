import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

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

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) return <p>Please login to view your profile.</p>;

  return (
    <div className="profile-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="neon-profile-card">
        <div className="neon-profile-mainbox">
          <h2 className="neon-profile-title">Your Profile</h2>
          <p><span className="neon-profile-label">Email:</span> {user.email}</p>
          <p><span className="neon-profile-label">Role:</span> {role}</p>
        </div>
        <hr className="neon-section-divider" />

        {role === "user" && (
          <div className="neon-profile-cardbox">
            <h3 className="neon-text mb-3" style={{fontSize: '1.3rem'}}>Your Registered Events</h3>
            {loadingRegistered ? (
              <p>Loading...</p>
            ) : registeredEvents.length === 0 ? (
              <p>You have not registered for any events yet.</p>
            ) : (
              <ul className="neon-profile-list">
                {registeredEvents.map(ev => (
                  <li key={ev.id}>
                    <strong>{ev.title}</strong> <br />
                    {ev.description} <br />
                    <span className="neon-profile-label">Date:</span> {new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {role === "coordinator" && (
          <div className="neon-profile-cardbox">
            <h3 className="neon-text mb-3" style={{fontSize: '1.3rem'}}>Events You Created</h3>
            {loadingCreated ? (
              <p>Loading...</p>
            ) : createdEvents.length === 0 ? (
              <p>You have not created any events yet.</p>
            ) : (
              <ul className="neon-profile-list">
                {createdEvents.map(ev => (
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
                          className="form-control neon-input mb-2"
                        />
                        <textarea
                          name="description"
                          value={editForm.description}
                          onChange={handleEditChange}
                          required
                          placeholder="Description"
                          className="form-control neon-input mb-2"
                        />
                        <input
                          type="datetime-local"
                          name="date"
                          value={editForm.date}
                          onChange={handleEditChange}
                          required
                          className="form-control neon-input mb-2"
                        />
                        <button type="submit" className="neon-profile-btn">Save</button>
                        <button type="button" className="neon-profile-btn" onClick={() => setEditingEventId(null)}>Cancel</button>
                      </form>
                    ) : (
                      <>
                        <strong>{ev.title}</strong> <br />
                        {ev.description} <br />
                        <span className="neon-profile-label">Date:</span> {new Date(ev.date.seconds ? ev.date.seconds * 1000 : ev.date).toLocaleString()} <br />
                        <button className="neon-profile-btn" onClick={() => handleEditStart(ev)}>Edit</button>
                        <button className="neon-profile-btn" onClick={() => handleDelete(ev.id)}>Delete</button>
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