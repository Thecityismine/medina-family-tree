import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import MemberList from './MemberList';
import AddMemberForm from './AddMemberForm';
import BirthdayCalendar from './BirthdayCalendar';
import FamilyTree from './FamilyTree';
import HomeDashboard from './HomeDashboard';
import LocationMap from './LocationMap';
import Settings from './Settings';
import { parseBirthDate } from '../utils/birthdays';
import './Dashboard.css';

function Dashboard({ user, userRole, onSignIn }) {
  const [view, setView] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

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
        const birthDate = parseBirthDate(m.birthDate);
        return birthDate ? birthDate.getMonth() === currentMonth : false;
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
  const canEdit = isAuthenticated;
  const userInitial = isAuthenticated ? (user.email?.charAt(0).toUpperCase() || 'U') : 'G';
  const userName = isAuthenticated ? (user.email || 'Signed in user') : 'Guest viewer';
  const roleLabel = isAuthenticated ? (userRole || 'editor') : 'public view';
  const viewTitle = view === 'list'
    ? 'Family Members'
    : 'Add Family Member';
  const showHeader = view === 'list' || view === 'add';

  useEffect(() => {
    if (!canEdit && (view === 'add' || view === 'settings')) {
      setView('home');
    }
  }, [canEdit, view]);

  const handleNavigate = (nextView) => {
    setView(nextView);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className={`dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1>The Medina Family</h1>
          <p>Est. 1947</p>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {userInitial}
          </div>
          <div className="user-details">
            <div className="user-name">{userName}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
        </div>

        <nav className="nav">
          <button
            className={view === 'home' ? 'nav-item active' : 'nav-item'}
            onClick={() => handleNavigate('home')}
          >
            Home
          </button>
          <button
            className={view === 'tree' ? 'nav-item active' : 'nav-item'}
            onClick={() => handleNavigate('tree')}
          >
            Family Tree
          </button>
          <button
            className={view === 'list' ? 'nav-item active' : 'nav-item'}
            onClick={() => handleNavigate('list')}
          >
            Family Members
          </button>
          <button
            className={view === 'birthdays' ? 'nav-item active' : 'nav-item'}
            onClick={() => handleNavigate('birthdays')}
          >
            Birthdays
          </button>
          <button
            className={view === 'locations' ? 'nav-item active' : 'nav-item'}
            onClick={() => handleNavigate('locations')}
          >
            Locations
          </button>
          {canEdit && (
            <button
              className={view === 'add' ? 'nav-item active' : 'nav-item'}
              onClick={() => handleNavigate('add')}
            >
              Add Member
            </button>
          )}
          {canEdit && (
            <button
              className={view === 'settings' ? 'nav-item active' : 'nav-item'}
              onClick={() => handleNavigate('settings')}
            >
              Settings
            </button>
          )}
        </nav>

        {isAuthenticated ? (
          <button className="btn-logout" onClick={handleSignOut}>
            Sign Out
          </button>
        ) : (
          <button className="btn-logout" onClick={onSignIn}>
            Sign In to Edit
          </button>
        )}
      </div>

      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <div className="main-content">
        <div className="main-toolbar">
          <button
            className="menu-toggle"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={isSidebarOpen}
          >
            <span className="menu-bar"></span>
            <span className="menu-bar"></span>
            <span className="menu-bar"></span>
          </button>
        </div>
        {showHeader && (
          <div className="content-header">
            <h2>{viewTitle}</h2>
            {!canEdit && view === 'list' && (
              <div className="viewer-notice">
                View-only access
              </div>
            )}
          </div>
        )}

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
          {view === 'home' && (
            <HomeDashboard members={members} user={user} onNavigate={handleNavigate} />
          )}
          {view === 'tree' && (
            <FamilyTree members={members} />
          )}
          {view === 'list' && (
            <MemberList members={members} canEdit={canEdit} />
          )}
          {view === 'add' && canEdit && (
            <AddMemberForm members={members} onSuccess={() => handleNavigate('list')} />
          )}
          {view === 'birthdays' && (
            <BirthdayCalendar members={members} />
          )}
          {view === 'locations' && (
            <LocationMap members={members} />
          )}
          {view === 'settings' && canEdit && (
            <Settings user={user} userRole={userRole} members={members} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
