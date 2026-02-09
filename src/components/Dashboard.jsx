import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import HomeDashboard from './HomeDashboard';
import MemberList from './MemberList';
import AddMemberForm from './AddMemberForm';
import BirthdayCalendar from './BirthdayCalendar';
import FamilyTree from './FamilyTree';
import LocationMap from './LocationMap';
import Settings from './Settings';
import './Dashboard.css';

function Dashboard({ user, userRole, onRequestLogin }) {
  const [view, setView] = useState('home');
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberData = [];
      snapshot.forEach((docSnapshot) => {
        memberData.push({ id: docSnapshot.id, ...docSnapshot.data() });
      });

      setMembers(memberData);

      const currentMonth = new Date().getMonth();
      const birthdaysThisMonth = memberData.filter((member) => {
        if (!member.birthDate) return false;
        const birthMonth = new Date(member.birthDate).getMonth();
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

  const isAuthenticated = Boolean(user);
  const isAdmin = isAuthenticated && userRole === 'admin';
  const isReadOnlyViewer = !isAdmin;

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>The Medina Family</h1>
          <p>Est. 1947</p>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {isAuthenticated ? user.email?.charAt(0).toUpperCase() : 'V'}
          </div>
          <div className="user-details">
            <div className="user-name">{isAuthenticated ? user.email : 'Public Viewer'}</div>
            <div className="user-role">
              {isAuthenticated ? (userRole || 'viewer') : 'guest (read-only)'}
            </div>
          </div>
        </div>

        <nav className="nav">
          <button
            className={view === 'home' ? 'nav-item active' : 'nav-item'}
            onClick={() => setView('home')}
          >
            Home
          </button>
          <button
            className={view === 'tree' ? 'nav-item active' : 'nav-item'}
            onClick={() => setView('tree')}
          >
            Family Tree
          </button>
          <button
            className={view === 'list' ? 'nav-item active' : 'nav-item'}
            onClick={() => setView('list')}
          >
            Members
          </button>
          <button
            className={view === 'birthdays' ? 'nav-item active' : 'nav-item'}
            onClick={() => setView('birthdays')}
          >
            Birthdays
          </button>
          <button
            className={view === 'map' ? 'nav-item active' : 'nav-item'}
            onClick={() => setView('map')}
          >
            Locations
          </button>
          {isAdmin && (
            <button
              className={view === 'add' ? 'nav-item active' : 'nav-item'}
              onClick={() => setView('add')}
            >
              Add Member
            </button>
          )}
          <button
            className={view === 'settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setView('settings')}
          >
            Settings
          </button>
        </nav>

        {isAuthenticated ? (
          <button className="btn-logout" onClick={handleSignOut}>
            Sign Out
          </button>
        ) : (
          <button className="btn-login" onClick={onRequestLogin}>
            Sign In to Edit
          </button>
        )}
      </div>

      <div className="main-content">
        <div className="content-header">
          <h2>
            {view === 'home' && 'Dashboard'}
            {view === 'tree' && 'Family Tree'}
            {view === 'list' && 'Family Members'}
            {view === 'birthdays' && 'Family Birthdays'}
            {view === 'map' && 'Family Locations'}
            {view === 'add' && 'Add Family Member'}
            {view === 'settings' && 'Settings'}
          </h2>
          {isReadOnlyViewer && view === 'list' && (
            <div className="viewer-notice">View-only access</div>
          )}
        </div>

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

        <div className="content-body">
          {view === 'home' && <HomeDashboard members={members} user={user} />}
          {view === 'tree' && <FamilyTree members={members} />}
          {view === 'list' && <MemberList members={members} isAdmin={isAdmin} />}
          {view === 'birthdays' && <BirthdayCalendar members={members} />}
          {view === 'map' && <LocationMap members={members} />}
          {view === 'add' && isAdmin && (
            <AddMemberForm onSuccess={() => setView('list')} />
          )}
          {view === 'settings' && isAuthenticated && (
            <Settings user={user} userRole={userRole} members={members} />
          )}
          {view === 'settings' && !isAuthenticated && (
            <div className="viewer-settings-card">
              <h3>Sign in required for account settings</h3>
              <p>
                The family tree is public to view. Sign in with your account to manage
                your profile or request edit access.
              </p>
              <button className="btn-login" onClick={onRequestLogin}>
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
