import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Authenticated users default to viewer until an explicit role is found.
        let role = 'viewer';
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists() && userDoc.data().role) {
            role = userDoc.data().role;
          }
        } catch (error) {
          console.error('Error loading user role:', error);
        }
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && showLogin) {
      setShowLogin(false);
    }
  }, [user, showLogin]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading The Medina Family Tree...</p>
      </div>
    );
  }

  return (
    <>
      <Dashboard
        user={user}
        userRole={userRole}
        onRequestLogin={() => setShowLogin(true)}
      />
      {showLogin && !user && <Login onClose={() => setShowLogin(false)} />}
    </>
  );
}

export default App;
