// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyDJGoxdqh-8fm8pZP6_8xL3ebIg4mH3PLw",
  authDomain: "medina-family-tree.firebaseapp.com",
  projectId: "medina-family-tree",
  storageBucket: "medina-family-tree.firebasestorage.app",
  messagingSenderId: "316754229252",
  appId: "1:316754229252:web:262a4d743df445c67f1d51",
  measurementId: "G-SFYBXKKB69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
