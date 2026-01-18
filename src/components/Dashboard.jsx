import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import MemberList from './MemberList';
import AddMemberForm from './AddMemberForm';
import './Dashboard.css';

function Dashboard({ user, userRole }) {
  const [view, setView] = useState('list');
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });

  useEffect(() => {
    // Real-time listener for family members
    const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberData = [];
      snapshot.forEach((doc) => {
        memberData.push({ id: doc.id, ...doc.data() });
      });
      
      setMembers(memberData);
      
      // Calculate stats
      const currentMonth = new Date().getMonth();
      const birthdaysThisMonth = memberData.filter(m => {
        if (!m.birthDate) return false;
        const birthMonth = new Date(m.birthDate).getMonth();
        return birthMonth === currentMonth;
      }).length;
      
      setStats({
        total: memberData.length,
        thisMonth: birthdaysThisMonth
      });
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>The Medina Family</h1>
          <p>Est. 1947</p>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{user.email}</div>
            <div className="user-role">{userRole || 'viewer'}</div>
          </div>
        </div>

        <nav className="nav">
          <button 
            className={view === 'list' ? 'nav-item active' : 'nav-item'}
            onClick={() => setView('list')}
          >
            <span>👥</span> Family Members
          </button>
          {isAdmin && (
            <button 
              className={view === 'add' ? 'nav-item active' : 'nav-item'}
              onClick={() => setView('add')}
            >
              <span>➕</span> Add Member
            </button>
          )}
        </nav>

        <button className="btn-logout" onClick={handleSignOut}>
          🚪 Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-header">
          <h2>{view === 'list' ? 'Family Members' : 'Add Family Member'}</h2>
          {!isAdmin && view === 'list' && (
            <div className="viewer-notice">
              👁️ View-only access
            </div>
          )}
        </div>

        {/* Stats */}
        {view === 'list' && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Family Members</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.thisMonth}</div>
              <div className="stat-label">Birthdays This Month</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">2</div>
              <div className="stat-label">Generations</div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="content-body">
          {view === 'list' && (
            <MemberList members={members} isAdmin={isAdmin} />
          )}
          {view === 'add' && isAdmin && (
            <AddMemberForm members={members} onSuccess={() => setView('list')} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
