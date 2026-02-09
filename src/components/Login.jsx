import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import './Login.css';

function Login({ onCancel }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          name: name,
          role: 'viewer', // Default role - admin must be set manually in Firebase Console
          createdAt: new Date()
        });
        
        alert('Account created! An admin needs to upgrade your role.');
      } else {
        // Sign in
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>The Medina Family</h1>
          <p>Est. 1947</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          
          {error && <div className="error-message">{error}</div>}

          {isSignup && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
              minLength="6"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait...' : (isSignup ? 'Create Account' : 'Sign In')}
          </button>

          <div className="toggle-mode">
            {isSignup ? (
              <>Already have an account? <button type="button" onClick={() => setIsSignup(false)}>Sign In</button></>
            ) : (
              <>Need an account? <button type="button" onClick={() => setIsSignup(true)}>Sign Up</button></>
            )}
          </div>

          {onCancel && (
            <div className="toggle-mode">
              <button type="button" onClick={onCancel}>Continue as Guest</button>
            </div>
          )}
        </form>

        <div className="login-info">
          <p><strong>First time setup:</strong></p>
          <ol>
            <li>Create your account</li>
            <li>Contact admin to upgrade to Admin role</li>
            <li>Start adding family members!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Login;
