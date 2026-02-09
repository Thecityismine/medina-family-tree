import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { updatePassword } from 'firebase/auth';
import { collection, doc, updateDoc, writeBatch } from 'firebase/firestore';
import './Settings.css';

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  if (typeof value._seconds === 'number') return new Date(value._seconds * 1000);
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const toDateOnly = (value) => {
  const date = parseDateValue(value);
  return date ? date.toISOString().split('T')[0] : '';
};

const toCreatedAtIso = (value) => {
  const date = parseDateValue(value);
  return date ? date.toISOString() : '';
};

const normalizeArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

const normalizeImportedMember = (member) => {
  return {
    name: (member.name || '').trim(),
    relationship: member.relationship || '',
    birthDate: toDateOnly(member.birthDate),
    passedAwayDate: toDateOnly(member.passedAwayDate),
    location: member.location || '',
    notes: member.notes || '',
    parentIds: normalizeArray(member.parentIds),
    spouseIds: normalizeArray(member.spouseIds),
    gender: member.gender || '',
    photoURL: member.photoURL || null,
    createdAt: parseDateValue(member.createdAt) || new Date(),
    updatedAt: new Date()
  };
};

function Settings({ user, userRole, members }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileData, setProfileData] = useState({
    name: user.displayName || user.email?.split('@')[0] || '',
    email: user.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const isAdmin = userRole === 'admin';

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
          id: member.id || '',
          name: member.name || '',
          relationship: member.relationship || '',
          birthDate: toDateOnly(member.birthDate),
          passedAwayDate: toDateOnly(member.passedAwayDate),
          location: member.location || '',
          notes: member.notes || '',
          parentIds: normalizeArray(member.parentIds),
          spouseIds: normalizeArray(member.spouseIds),
          gender: member.gender || '',
          photoURL: member.photoURL || '',
          createdAt: toCreatedAtIso(member.createdAt)
        }))
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medina-family-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'Data exported as JSON.');
      return;
    }

    if (format === 'csv') {
      const headers = [
        'ID',
        'Name',
        'Relationship',
        'Birthday',
        'Passed Away',
        'Location',
        'Notes',
        'Parent IDs',
        'Spouse IDs',
        'Gender',
        'Photo URL',
        'Created At'
      ];

      const escapeCsv = (value) => `"${String(value || '').replace(/"/g, '""')}"`;
      const rows = members.map((member) => [
        member.id || '',
        member.name || '',
        member.relationship || '',
        toDateOnly(member.birthDate),
        toDateOnly(member.passedAwayDate),
        member.location || '',
        member.notes || '',
        normalizeArray(member.parentIds).join('|'),
        normalizeArray(member.spouseIds).join('|'),
        member.gender || '',
        member.photoURL || '',
        toCreatedAtIso(member.createdAt)
      ]);

      const csv = [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medina-family-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'Data exported as CSV.');
    }
  };

  const handleImportBackup = async () => {
    if (!isAdmin) {
      showMessage('error', 'Only admins can import backups.');
      return;
    }

    if (!importFile) {
      showMessage('error', 'Select a backup JSON file first.');
      return;
    }

    setImportLoading(true);

    try {
      const text = await importFile.text();
      const parsed = JSON.parse(text);

      if (!parsed || !Array.isArray(parsed.members)) {
        throw new Error('Invalid backup format. Expected a members array.');
      }

      const importEntries = parsed.members
        .filter((member) => member && typeof member === 'object')
        .map((member) => ({
          source: member,
          data: normalizeImportedMember(member)
        }))
        .filter((entry) => entry.data.name);

      if (importEntries.length === 0) {
        throw new Error('No valid members found in this backup file.');
      }

      const confirmed = window.confirm(
        `Import ${importEntries.length} members from backup? This adds or updates members in the current tree.`
      );

      if (!confirmed) {
        setImportLoading(false);
        return;
      }

      const chunkSize = 400;

      for (let i = 0; i < importEntries.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = importEntries.slice(i, i + chunkSize);

        chunk.forEach((entry) => {
          const source = entry.source || {};
          const memberData = entry.data;
          const importedId = typeof source.id === 'string' ? source.id.trim() : '';
          const targetRef = importedId
            ? doc(db, 'members', importedId)
            : doc(collection(db, 'members'));

          batch.set(targetRef, memberData, { merge: true });
        });

        await batch.commit();
      }

      setImportFile(null);
      showMessage(
        'success',
        `Imported ${importEntries.length} members successfully. Reload the page to refresh live order if needed.`
      );
    } catch (error) {
      console.error('Import error:', error);
      showMessage('error', error.message || 'Failed to import backup.');
    } finally {
      setImportLoading(false);
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
                <input type="email" value={profileData.email} disabled className="disabled-input" />
                <small>Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label>Role</label>
                <input type="text" value={userRole || 'viewer'} disabled className="disabled-input" />
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
                    <option value="light" disabled>
                      Light Mode (Coming Soon)
                    </option>
                  </select>
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
                    Full backup including IDs, relationships, and metadata.
                  </div>
                </div>
                <button className="export-button">Download</button>
              </div>

              <div className="export-card" onClick={() => handleExportData('csv')}>
                <div className="export-icon">CSV</div>
                <div className="export-info">
                  <div className="export-title">Export as CSV</div>
                  <div className="export-description">
                    Spreadsheet format for Excel or Google Sheets.
                  </div>
                </div>
                <button className="export-button">Download</button>
              </div>
            </div>

            <div className="import-section">
              <h3>Import Backup</h3>
              <p className="section-description">
                Restore members from a JSON backup file. For best hierarchy restore, use exports that include member
                IDs.
              </p>

              {isAdmin ? (
                <div className="import-card">
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="import-input"
                  />
                  <button
                    type="button"
                    className="import-button"
                    onClick={handleImportBackup}
                    disabled={importLoading}
                  >
                    {importLoading ? 'Importing...' : 'Import Backup JSON'}
                  </button>
                  <small className="import-note">
                    Selected file: {importFile ? importFile.name : 'None'}
                  </small>
                </div>
              ) : (
                <div className="import-readonly">
                  Only admins can import backup files.
                </div>
              )}
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
                  <span className="data-stat-value">{members.filter((member) => member.photoURL).length}</span>
                </div>
                <div className="data-stat-item">
                  <span className="data-stat-label">With Birthdays:</span>
                  <span className="data-stat-value">{members.filter((member) => member.birthDate).length}</span>
                </div>
                <div className="data-stat-item">
                  <span className="data-stat-label">With Locations:</span>
                  <span className="data-stat-value">{members.filter((member) => member.location).length}</span>
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
