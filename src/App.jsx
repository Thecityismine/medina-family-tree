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
        setShowLogin(false);
        setUserRole(null);
        
        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading The Medina Family Tree...</p>
      </div>
    );
  }

  if (!user && showLogin) {
    return <Login onCancel={() => setShowLogin(false)} />;
  }

  return (
    <Dashboard
      user={user}
      userRole={userRole}
      onSignIn={() => setShowLogin(true)}
    />
  );
}

export default App;
