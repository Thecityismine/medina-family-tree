import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { parseBirthDate } from '../utils/birthdays';
import './Settings.css';

const formatBirthDateValue = (value) => {
  const date = parseBirthDate(value);
  return date ? date.toISOString().split('T')[0] : '';
};

const formatCreatedAt = (value) => {
  if (!value) return '';
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
  if (typeof value._seconds === 'number') return new Date(value._seconds * 1000).toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  return '';
};

function Settings({ user, userRole, members }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileData, setProfileData] = useState({
    name: user.displayName || user.email?.split('@')[0] || '',
    email: user.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          name: profileData.name
        });
      }

      showMessage('success', 'Profile updated successfully.');
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(auth.currentUser, passwordData.newPassword);
      showMessage('success', 'Password updated successfully.');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = (format) => {
    if (format === 'json') {
      const data = {
        exportDate: new Date().toISOString(),
        family: 'The Medina Family',
        established: 1947,
        members: members.map((member) => ({
          name: member.name || '',
          relationship: member.relationship || '',
          birthDate: formatBirthDateValue(member.birthDate),
          passedAwayDate: formatBirthDateValue(member.passedAwayDate),
          location: member.location || '',
          notes: member.notes || '',
          parentIds: Array.isArray(member.parentIds) ? member.parentIds : [],
          spouseIds: Array.isArray(member.spouseIds) ? member.spouseIds : [],
          gender: member.gender || '',
          photoURL: member.photoURL || '',
          createdAt: formatCreatedAt(member.createdAt)
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medina-family-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'Data exported as JSON.');
    } else if (format === 'csv') {
      const headers = [
        'Name',
        'Relationship',
        'Birthday',
        'Passed Away',
        'Location',
        'Notes',
        'Parents',
        'Spouses'
      ];
      const rows = members.map((member) => [
        member.name || '',
        member.relationship || '',
        formatBirthDateValue(member.birthDate),
        formatBirthDateValue(member.passedAwayDate),
        member.location || '',
        member.notes || '',
        Array.isArray(member.parentIds) ? member.parentIds.join('|') : '',
        Array.isArray(member.spouseIds) ? member.spouseIds.join('|') : ''
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medina-family-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMessage('success', 'Data exported as CSV.');
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p className="settings-subtitle">Manage your account and preferences</p>
      </div>

      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.type === 'success' ? 'Success: ' : 'Error: '}
          {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
        <button
          className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
        <button
          className={`settings-tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data & Export
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'profile' && (
          <div className="settings-section">
            <h3>Profile Information</h3>
            <p className="section-description">Update your personal information</p>

            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="disabled-input"
                />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={userRole || 'viewer'}
                  disabled
                  className="disabled-input"
                />
                <small>Role is managed by administrators</small>
              </div>

              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="settings-section">
            <h3>Change Password</h3>
            <p className="section-description">Update your account password</p>

            <form onSubmit={handleUpdatePassword} className="settings-form">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  minLength="6"
                />
                <small>Minimum 6 characters</small>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  minLength="6"
                />
              </div>

              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="settings-section">
            <h3>Appearance</h3>
            <p className="section-description">Customize how the app looks</p>

            <div className="preference-group">
              <div className="preference-item">
                <div className="preference-info">
                  <div className="preference-label">Theme</div>
                  <div className="preference-description">Choose your preferred color theme</div>
                </div>
                <div className="preference-control">
                  <select value={theme} onChange={(e) => setTheme(e.target.value)} className="theme-select">
                    <option value="dark">Dark Mode</option>
                    <option value="light" disabled>Light Mode (Coming Soon)</option>
                  </select>
                </div>
              </div>
            </div>

            <h3 style={{ marginTop: '40px' }}>Notifications</h3>
            <p className="section-description">Manage your notification preferences</p>

            <div className="preference-group">
              <div className="preference-item">
                <div className="preference-info">
                  <div className="preference-label">Birthday Reminders</div>
                  <div className="preference-description">Get notified about upcoming birthdays</div>
                </div>
                <div className="preference-control">
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="preference-item">
                <div className="preference-info">
                  <div className="preference-label">New Member Alerts</div>
                  <div className="preference-description">Get notified when new members are added</div>
                </div>
                <div className="preference-control">
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="settings-section">
            <h3>Export Family Data</h3>
            <p className="section-description">Download your family tree data</p>

            <div className="export-options">
              <div className="export-card" onClick={() => handleExportData('json')}>
                <div className="export-icon">JSON</div>
                <div className="export-info">
                  <div className="export-title">Export as JSON</div>
                  <div className="export-description">
                    Complete data backup with all information
                  </div>
                </div>
                <button className="export-button">Download</button>
              </div>

              <div className="export-card" onClick={() => handleExportData('csv')}>
                <div className="export-icon">CSV</div>
                <div className="export-info">
                  <div className="export-title">Export as CSV</div>
                  <div className="export-description">
                    Spreadsheet format for Excel or Google Sheets
                  </div>
                </div>
                <button className="export-button">Download</button>
              </div>
            </div>

            <div className="data-stats">
              <h4>Data Summary</h4>
              <div className="data-stat-grid">
                <div className="data-stat-item">
                  <span className="data-stat-label">Total Members:</span>
                  <span className="data-stat-value">{members.length}</span>
                </div>
                <div className="data-stat-item">
                  <span className="data-stat-label">With Photos:</span>
                  <span className="data-stat-value">
                    {members.filter((member) => member.photoURL).length}
                  </span>
                </div>
                <div className="data-stat-item">
                  <span className="data-stat-label">With Birthdays:</span>
                  <span className="data-stat-value">
                    {members.filter((member) => member.birthDate).length}
                  </span>
                </div>
                <div className="data-stat-item">
                  <span className="data-stat-label">With Locations:</span>
                  <span className="data-stat-value">
                    {members.filter((member) => member.location).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
