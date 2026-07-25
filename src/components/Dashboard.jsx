import React, { useState, useEffect, useMemo } from 'react';
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
import { Avatar, Badge, Button, Icon } from './ui';
import './Dashboard.css';

/* Single source of truth for navigation. Replaces 7 copy-pasted <button>
   blocks that each repeated the same active-class ternary.
   `tab: true` promotes an item into the mobile bottom bar. */
const NAV_ITEMS = [
  { id: 'home',      label: 'Home',           icon: 'home',     tab: true },
  { id: 'tree',      label: 'Family Tree',    icon: 'tree',     tab: true },
  { id: 'list',      label: 'Family Members', icon: 'users',    tab: true },
  { id: 'birthdays', label: 'Birthdays',      icon: 'cake',     tab: true },
  { id: 'locations', label: 'Locations',      icon: 'pin',      tab: true },
  { id: 'add',       label: 'Add Member',     icon: 'plus',     requiresEdit: true },
  { id: 'settings',  label: 'Settings',       icon: 'settings', requiresEdit: true }
];

function Dashboard({ user, userRole, onSignIn }) {
  const [view, setView] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memberData = [];
      snapshot.forEach((doc) => {
        memberData.push({ id: doc.id, ...doc.data() });
      });
      setMembers(memberData);
      setIsLoading(false);
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
  const userName = isAuthenticated ? (user.email || 'Signed in user') : 'Guest viewer';
  const roleLabel = isAuthenticated ? (userRole || 'editor') : 'Public view';

  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((item) => !item.requiresEdit || canEdit),
    [canEdit]
  );

  const tabItems = useMemo(() => NAV_ITEMS.filter((item) => item.tab), []);

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

  /* Screens that render their own page header own their whole layout; only
     these two need the shell to supply a title. */
  const headerTitle = view === 'list' ? 'Family Members' : view === 'add' ? 'Add Family Member' : null;

  return (
    <div className={`dashboard ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1>The Medina Family</h1>
          <p className="t-label">Est. 1947</p>
        </div>

        <div className="user-info">
          <Avatar name={isAuthenticated ? userName : 'Guest'} size="sm" ring />
          <div className="user-details">
            <div className="user-name t-truncate">{userName}</div>
            <div className="user-role">{roleLabel}</div>
          </div>
        </div>

        <nav className="nav" aria-label="Main">
          {visibleNav.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => handleNavigate(item.id)}
              aria-current={view === item.id ? 'page' : undefined}
            >
              <Icon name={item.icon} size={18} />
              <span className="nav-item__label">{item.label}</span>
            </button>
          ))}
        </nav>

        <Button
          variant={isAuthenticated ? 'ghost' : 'primary'}
          full
          onClick={isAuthenticated ? handleSignOut : onSignIn}
        >
          <Icon name={isAuthenticated ? 'signOut' : 'signIn'} size={18} />
          {isAuthenticated ? 'Sign Out' : 'Sign In to Edit'}
        </Button>
      </aside>

      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="main-content">
        <div className="main-toolbar">
          <button
            className="menu-toggle"
            onClick={() => setIsSidebarOpen((open) => !open)}
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isSidebarOpen}
          >
            <Icon name={isSidebarOpen ? 'close' : 'menu'} size={20} />
          </button>
        </div>

        {headerTitle && (
          <header className="content-header">
            <h2>{headerTitle}</h2>
            {!canEdit && view === 'list' && <Badge tone="gold" dot>View-only access</Badge>}
          </header>
        )}

        {/*
          NESTING TEARDOWN.
          This used to be `.content-body` — a bordered, padded, 16px-radius
          card wrapping EVERY screen. Since each screen also draws its own
          cards, every view was three boxes deep. It is now an unstyled
          <main>; each screen owns its own surfaces.
        */}
        <main className="view">
          {view === 'home' && (
            <HomeDashboard
              members={members}
              user={user}
              isLoading={isLoading}
              onNavigate={handleNavigate}
            />
          )}
          {view === 'tree' && <FamilyTree members={members} />}
          {view === 'list' && <MemberList members={members} canEdit={canEdit} />}
          {view === 'add' && canEdit && (
            <AddMemberForm members={members} onSuccess={() => handleNavigate('list')} />
          )}
          {view === 'birthdays' && <BirthdayCalendar members={members} />}
          {view === 'locations' && <LocationMap members={members} />}
          {view === 'settings' && canEdit && (
            <Settings user={user} userRole={userRole} members={members} />
          )}
        </main>
      </div>

      {/*
        Mobile bottom tab bar. Deliberately NOT an icon-only hover-expand rail:
        hover does not exist on touch, and this is a family app used mostly on
        phones. Labels stay visible; targets are 64px tall.
      */}
      <nav className="tabbar" aria-label="Main">
        {tabItems.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? 'tabbar__item is-active' : 'tabbar__item'}
            onClick={() => handleNavigate(item.id)}
            aria-current={view === item.id ? 'page' : undefined}
          >
            <Icon name={item.icon} size={22} />
            <span className="tabbar__label">{item.label.replace('Family ', '')}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default Dashboard;
