import React, { useState, useEffect } from "react";
import { db, storage } from "./firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function EditEvent() {
  const { role, loading: authLoading } = useAuth();
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [newImages, setNewImages] = useState([]); // For newly selected images
  const [existingImageUrls, setExistingImageUrls] = useState([]); // For images already in Firestore
  const [imagesToDelete, setImagesToDelete] = useState([]); // To track images marked for deletion
  const [error, setError] = useState("");
  const [eventLoading, setEventLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      const eventRef = doc(db, "events", id);
      const eventSnap = await getDoc(eventRef);

      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        setTitle(eventData.title);
        setDescription(eventData.description);
        // Format date for datetime-local input
        const eventDate = eventData.date.seconds ? new Date(eventData.date.seconds * 1000) : new Date(eventData.date);
        setDate(eventDate.toISOString().slice(0, 16));
        setExistingImageUrls(eventData.imageUrls || []); // Fetch array of image URLs
      } else {
        setError("Event not found.");
      }
      setEventLoading(false);
    };

    if (!authLoading) { // Only fetch event if auth is not loading
      fetchEvent();
    }
  }, [id, authLoading]); // Add authLoading to dependency array

  if (authLoading || eventLoading) {
    return <div>Loading event details...</div>;
  }

  if (role !== "coordinator") {
    return <div>You don't have permission to edit events.</div>;
  }

  const handleRemoveExistingImage = (urlToRemove) => {
    setExistingImageUrls(prev => prev.filter(url => url !== urlToRemove));
    setImagesToDelete(prev => [...prev, urlToRemove]);
  };

  const handleNewImageChange = (e) => {
    setNewImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title || !description || !date) {
      setError("Fill in all fields");
      return;
    }

    let finalImageUrls = [...existingImageUrls]; // Start with existing images not marked for deletion

    // Upload new images
    for (const imageFile of newImages) {
      try {
        const imageRef = ref(storage, `event_images/${imageFile.name + Date.now()}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        finalImageUrls.push(downloadURL);
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        let errorMessage = "Error uploading image: ";
        
        if (uploadError.code === 'storage/unauthorized') {
          errorMessage += "Unauthorized access. Please check Firebase Storage rules.";
        } else if (uploadError.code === 'storage/object-not-found') {
          errorMessage += "Storage object not found.";
        } else if (uploadError.code === 'storage/bucket-not-found') {
          errorMessage += "Storage bucket not found. Please check Firebase configuration.";
        } else if (uploadError.code === 'storage/project-not-found') {
          errorMessage += "Firebase project not found.";
        } else if (uploadError.code === 'storage/quota-exceeded') {
          errorMessage += "Storage quota exceeded.";
        } else {
          errorMessage += uploadError.message;
        }
        
        setError(errorMessage);
        return;
      }
    }

    // TODO: Implement actual deletion from storage for imagesToDelete if necessary
    // For now, we just don't include them in the updated event document.

    try {
      
      const eventRef = doc(db, "events", id);
      await updateDoc(eventRef, {
        title,
        description,
        date: new Date(date),
        imageUrls: finalImageUrls, // Store array of image URLs
        updatedAt: serverTimestamp(),
      });
      
      alert("Event updated successfully!");
      navigate("/events"); // Navigate back to event list
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Error updating event: " + err.message);
    }
  };

  return (
    <div className="create-event-bg min-vh-100 d-flex align-items-center justify-content-center">
      <div className="neon-signup-card p-4" style={{ maxWidth: 420, width: '100%' }}>
        <h2 className="neon-text text-center mb-4">Edit Event</h2>
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
          <div className="mb-4">
            <label className="form-label neon-subtext">Existing Event Images</label>
            {existingImageUrls.length > 0 ? (
              <div className="d-flex flex-wrap mb-2">
                {existingImageUrls.map((url, index) => (
                  <div key={index} className="position-relative me-2 mb-2" style={{ width: '100px', height: '100px' }}>
                    <img src={url} alt={`Event ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                    <button
                      type="button"
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-0"
                      style={{ width: '24px', height: '24px', fontSize: '0.75rem' }}
                      onClick={() => handleRemoveExistingImage(url)}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="neon-subtext">No existing images.</p>
            )}

            <label className="form-label neon-subtext" htmlFor="newImages">Upload New Images (optional)</label>
            <input
              className="form-control neon-input"
              type="file"
              id="newImages"
              onChange={handleNewImageChange}
              accept="image/*"
              multiple
            />
            {newImages.length > 0 && (
              <div className="mt-2">
                <p className="neon-subtext">Selected new images:</p>
                <ul className="list-unstyled">
                  {newImages.map((file, index) => (
                    <li key={index} className="neon-subtext">{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-neon w-100 mb-2">
            Update Event
          </button>
          <button type="button" className="btn btn-secondary w-100" onClick={() => navigate("/events")}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditEvent;