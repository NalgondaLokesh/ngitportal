import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const { user, role } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [loadingRegistered, setLoadingRegistered] = useState(true);
  const [loadingCreated, setLoadingCreated] = useState(true);
  const [editingEventId, setEditingEventId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", date: "" });
  // const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    uniqueId: '',
    branch: '',
    year: '',
    section: ''
  });

  // Fetch user profile data
  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    const fetchUserProfile = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        } else {
          
          setUserProfile({ email: user.email, role: role }); // Fallback
        }
      } catch (error) {
        
        setUserProfile({ email: user.email, role: role }); // Fallback on error
      } finally {
        setProfileLoading(false);
      }
    };
    fetchUserProfile();
  }, [user, role]);

  // Fetch events registered (for users)
  useEffect(() => {
    if (!user) return;
    async function fetchRegisteredEvents() {
      const eventsQuery = query(collection(db, "events"));
      const events = [];
      const eventsSnapshot = await getDocs(eventsQuery);
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

  // Profile editing functions
  const handleEditProfileStart = () => {
    
    
    setEditProfileForm({
      name: userProfile.name || '',
      uniqueId: userProfile.uniqueId || '',
      branch: userProfile.branch || '',
      year: userProfile.year || '',
      section: userProfile.section || ''
    });
    setIsEditingProfile(true);
  };

  const handleEditProfileChange = (e) => {
    const { name, value } = e.target;
    setEditProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, editProfileForm);
      setUserProfile(prev => ({ ...prev, ...editProfileForm }));
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleEditProfileCancel = () => {
    setIsEditingProfile(false);
    setEditProfileForm({
      name: '',
      uniqueId: '',
      branch: '',
      year: '',
      section: ''
    });
  };

  // Get user initials for avatar
  const getInitials = (profile) => {
    if (profile.name) {
      return profile.name.split(' ').map(n => n[0].toUpperCase()).join('');
    }
    return profile.email
      .split('@')[0]
      .split('.')
      .map(name => name[0].toUpperCase())
      .join('');
  };

  if (!user || profileLoading) return <p>Loading profile...</p>;
  
  // Debug logging
  
  
  
  

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
            {getInitials(userProfile)}
          </div>
          <h2 className="dark-mode-title">{userProfile.name || userProfile.email.split('@')[0]}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <p><span className="dark-mode-label">Email:</span> {userProfile.email}</p>
            {userProfile.uniqueId && <p><span className="dark-mode-label">User ID:</span> {userProfile.uniqueId}</p>}
            {userProfile.branch && <p><span className="dark-mode-label">Branch:</span> {userProfile.branch}</p>}
            {userProfile.year && <p><span className="dark-mode-label">Year:</span> {userProfile.year}</p>}
            {userProfile.section && <p><span className="dark-mode-label">Section:</span> {userProfile.section}</p>}
            <p><span className="dark-mode-label">Role:</span> {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}</p>
          </div>
          <div style={{ marginTop: '1.5rem', position: 'relative', zIndex: 10 }}>
            <button 
              onClick={handleEditProfileStart}
              className="dark-mode-btn"
              style={{ marginRight: '10px' }}
            >
              <i className="bi bi-pencil-square" style={{marginRight: '5px'}}></i>Edit Profile
            </button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditingProfile && (
          <div className="edit-profile-modal">
            <div className="edit-profile-modal-content">
              <div className="edit-profile-header">
                <h3 className="dark-mode-title" style={{fontSize: '1.5rem', margin: 0}}>
                  <i className="bi bi-person-gear" style={{marginRight: '10px'}}></i>
                  Edit Profile
                </h3>
                <button 
                  onClick={handleEditProfileCancel}
                  className="close-modal-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ff00e6',
                    fontSize: '1.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              </div>
              <form onSubmit={handleEditProfileSubmit} className="edit-profile-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editProfileForm.name}
                    onChange={handleEditProfileChange}
                    className="dark-mode-input"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unique ID</label>
                  <input
                    type="text"
                    name="uniqueId"
                    value={editProfileForm.uniqueId}
                    onChange={handleEditProfileChange}
                    className="dark-mode-input"
                    placeholder="Enter your unique ID"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch</label>
                  <select
                    name="branch"
                    value={editProfileForm.branch}
                    onChange={handleEditProfileChange}
                    className="dark-mode-input"
                  >
                    <option value="">Select Branch</option>
                    <option value="CSE">Computer Science Engineering</option>
                    <option value="IT">Information Technology</option>
                    <option value="ECE">Electronics and Communication Engineering</option>
                    <option value="EEE">Electrical and Electronics Engineering</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="CE">Civil Engineering</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select
                    name="year"
                    value={editProfileForm.year}
                    onChange={handleEditProfileChange}
                    className="dark-mode-input"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input
                    type="text"
                    name="section"
                    value={editProfileForm.section}
                    onChange={handleEditProfileChange}
                    className="dark-mode-input"
                    placeholder="Enter your section (e.g., A, B, C)"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="dark-mode-btn">
                    <i className="bi bi-check-circle" style={{marginRight: '5px'}}></i>Save Changes
                  </button>
                  <button type="button" onClick={handleEditProfileCancel} className="dark-mode-btn" style={{background: '#555'}}>
                    <i className="bi bi-x-circle" style={{marginRight: '5px'}}></i>Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
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