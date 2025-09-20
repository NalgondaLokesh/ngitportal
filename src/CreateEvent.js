import React, { useState } from "react";
import { db, storage } from "./firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

function CreateEvent() {
  const { user, role } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  if (role !== "coordinator") {
    return <div>You don't have permission to create events.</div>;
  }

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    setImages(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploading(true);
    
    
    
    if (!title || !description || !date) {
      setError("Fill in all fields");
      setUploading(false);
      return;
    }

    let imageUrls = [];
    
    // Upload multiple images
    if (images.length > 0) {
      
      try {
        for (const image of images) {
          
          const imageRef = ref(storage, `event_images/${image.name + Date.now() + Math.random()}`);
          const snapshot = await uploadBytes(imageRef, image);
          const downloadURL = await getDownloadURL(snapshot.ref);
          imageUrls.push(downloadURL);
          
        }
        
      } catch (uploadError) {
        console.error("Error uploading images:", uploadError);
        let errorMessage = "Error uploading images: ";
        
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
        setUploading(false);
        return;
      }
    

    
      
      } // This closing brace was missing

    
      
      try {
      
      const docRef = await addDoc(collection(db, "events"), {
        title,
        description,
        date: new Date(date),
        createdBy: user.email,
        createdAt: serverTimestamp(),
        imageUrls: imageUrls, // Store array of image URLs
      });
      
      
      
      // Reset form fields after successful creation
      setTitle("");
      setDescription("");
      setDate("");
      setImages([]);
      setUploading(false);
      alert("Event created successfully!");
      navigate("/events");
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Error creating event: " + err.message);
      setUploading(false);
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
          <div className="mb-4">
            <label className="form-label neon-subtext" htmlFor="images">Event Photos (Multiple)</label>
            <input
              className="form-control neon-input"
              type="file"
              id="images"
              onChange={handleImageChange}
              accept="image/*"
              multiple
            />
            {images.length > 0 && (
              <div className="mt-2">
                <small className="text-muted">Selected {images.length} photo(s)</small>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {images.map((img, index) => (
                    <div key={index} className="position-relative">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '5px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button 
            type="submit" 
            className="btn btn-neon w-100 mb-2"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
              </>
            ) : (
              'Create Event'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;