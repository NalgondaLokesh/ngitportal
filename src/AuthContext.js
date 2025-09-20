import React, { useState, useEffect, createContext, useContext } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      
      setUser(currentUser);
      if (currentUser) {
        try {
          
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            setRole(userData.role || 'user');
          } else {
            
            setRole('user');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setError(error.message);
          // If there's an error, set a default role to prevent infinite loading
          setRole('user');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Add the logout function here
  const logout = async () => {
    setLoading(true); // Set loading to true immediately on logout
    try {
      await signOut(auth);
    } catch (logoutError) {
      console.error("Error during logout:", logoutError);
      setError(logoutError.message);
      setLoading(false); // Reset loading if logout fails
    }
  };

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error("Auth loading timeout - forcing loading to false");
        setLoading(false);
        setError("Authentication timeout - please check your connection");
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, error }}>
      {error && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          background: 'red', 
          color: 'white', 
          padding: '10px', 
          textAlign: 'center',
          zIndex: 9999
        }}>
          Error: {error}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}