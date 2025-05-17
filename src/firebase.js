// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBj0U5qwnT0BoVVElnT_uAS527VuZ4XFck",
  authDomain: "database1-187ec.firebaseapp.com",
  projectId: "database1-187ec",
  storageBucket: "database1-187ec.appspot.com", // <-- FIXED
  messagingSenderId: "625511947158",
  appId: "1:625511947158:web:7be006ae676d98bb0f5bb7",
  measurementId: "G-JBWB9FWK5G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
export { app, analytics, auth, db };