import React, { useState } from "react";
import { db } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function CreateEvent() {
  const { user, role } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (role !== "coordinator") {
    return <div>You don't have permission to create events.</div>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title || !description || !date) {
      setError("Fill in all fields");
      return;
    }
    try {
      await addDoc(collection(db, "events"), {
        title,
        description,
        date: new Date(date),
        createdBy: user.email,
        createdAt: serverTimestamp(),
      });
      navigate("/");
    } catch (err) {
      setError("Error creating event: " + err.message);
    }
  };

  return (
    <div className="create-event-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="neon-signup-card p-4" style={{ maxWidth: 420, width: '100%' }}>
        <h2 className="neon-text text-center mb-4">Create Event</h2>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="title">Event Title</label>
            <input
              className="form-control neon-input"
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event Title"
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label neon-subtext" htmlFor="description">Description</label>
            <textarea
              className="form-control neon-input"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event Description"
              rows={3}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label neon-subtext" htmlFor="date">Date & Time</label>
            <input
              className="form-control neon-input"
              type="datetime-local"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-neon w-100 mb-2">
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;