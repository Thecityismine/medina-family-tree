import React, { useMemo, useState } from 'react';
import { db, storage } from '../firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import EditMemberModal from './EditMemberModal';
import { calculateAge, formatBirthDate } from '../utils/birthdays';
import './MemberList.css';

const GENDER_LABELS = {
  female: 'Female',
  male: 'Male',
  'non-binary': 'Non-binary',
  unspecified: 'Prefer not to say'
};

const RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Grandfather',
  'Grandmother',
  'Great Grandfather',
  'Great Grandmother',
  'Uncle',
  'Aunt',
  'Great Uncle',
  'Great Aunt',
  'Brother',
  'Sister',
  'Sibling',
  'Cousin',
  'First Cousin',
  'Nephew',
  'Niece',
  'Son',
  'Daughter',
  'Child',
  'Grandson',
  'Granddaughter',
  'Grandchild',
  'Spouse',
  'Partner',
  'Self',
  'You',
  'You (Admin)'
];

function MemberList({ members, isAdmin }) {
  const [editingMember, setEditingMember] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [expandedMembers, setExpandedMembers] = useState(() => new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('All');

  const memberNameMap = useMemo(() => {
    return members.reduce((acc, member) => {
      acc[member.id] = member.name || 'Unnamed member';
      return acc;
    }, {});
  }, [members]);

  const childrenMap = useMemo(() => {
    const map = {};
    members.forEach((member) => {
      if (!Array.isArray(member.parentIds)) return;
      member.parentIds.forEach((parentId) => {
        if (!map[parentId]) {
          map[parentId] = [];
        }
        map[parentId].push(member.name || 'Unnamed member');
      });
    });
    Object.keys(map).forEach((parentId) => {
      map[parentId].sort((a, b) => a.localeCompare(b));
    });
    return map;
  }, [members]);

  const resolveNames = (ids) => {
    if (!Array.isArray(ids)) return [];
    return ids.map((id) => memberNameMap[id]).filter(Boolean);
  };

  const relationshipOptions = useMemo(() => {
    const fromMembers = members
      .map((member) => member.relationship)
      .filter(Boolean);
    const combined = new Set([...RELATIONSHIP_OPTIONS, ...fromMembers]);
    return ['All', ...Array.from(combined).sort((a, b) => a.localeCompare(b))];
  }, [members]);

  const filteredMembers = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();
    return members.filter((member) => {
      const nameValue = (member.name || '').toLowerCase();
      const matchesSearch = !searchValue || nameValue.includes(searchValue);
      const matchesRelationship =
        relationshipFilter === 'All' ||
        (member.relationship || '') === relationshipFilter;
      return matchesSearch && matchesRelationship;
    });
  }, [members, relationshipFilter, searchTerm]);

  const toggleMember = (memberId) => {
    setExpandedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  const handleDelete = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to delete ${memberName}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'members', memberId));
      alert('Member deleted successfully!');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Error deleting member. Please try again.');
    }
  };

  const handlePhotoUpload = async (memberId, file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadingPhoto(memberId);

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `photos/${memberId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update member document
      await updateDoc(doc(db, 'members', memberId), {
        photoURL: photoURL
      });

      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo. Please try again.');
    } finally {
      setUploadingPhoto(null);
    }
  };

  if (members.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">*</div>
        <h3>No Family Members Yet</h3>
        <p>Start by adding your first family member!</p>
      </div>
    );
  }

  return (
    <>
      <div className="member-controls">
        <div className="member-search">
          <label htmlFor="member-search">Search</label>
          <input
            id="member-search"
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="member-filter">
          <label htmlFor="member-filter">Filter by Relationship</label>
          <select
            id="member-filter"
            value={relationshipFilter}
            onChange={(e) => setRelationshipFilter(e.target.value)}
          >
            {relationshipOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredMembers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">*</div>
          <h3>No Matches Found</h3>
          <p>Try a different name or relationship filter.</p>
        </div>
      )}

      <div className="member-grid">
        {filteredMembers.map((member) => {
          const age = calculateAge(member.birthDate);
          const parentNames = resolveNames(member.parentIds);
          const spouseNames = resolveNames(member.spouseIds);
          const genderLabel = GENDER_LABELS[member.gender];
          const isExpanded = expandedMembers.has(member.id);
          const memberName = member.name || 'Unnamed member';
          const childrenNames = childrenMap[member.id] || [];

          return (
            <div key={member.id} className={`member-card ${isExpanded ? 'expanded' : 'collapsed'}`}>
              <button
                type="button"
                className="member-summary"
                onClick={() => toggleMember(member.id)}
                aria-expanded={isExpanded}
              >
                <div className="member-summary-text">
                  <div className="member-summary-name">{memberName}</div>
                  <div className="member-summary-relation">
                    {member.relationship || 'Not set'}
                  </div>
                </div>
                <span className="member-summary-toggle">{isExpanded ? '-' : '+'}</span>
              </button>

              {isExpanded && (
                <div className="member-details">
                  <div className="member-photo-section">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={memberName}
                        className="member-photo"
                      />
                    ) : (
                      <div className="member-photo-placeholder">
                        {memberName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {isAdmin && (
                      <label className="photo-upload-btn">
                        {uploadingPhoto === member.id ? (
                          <span>Uploading...</span>
                        ) : (
                          <>
                            {member.photoURL ? 'Change Photo' : 'Add Photo'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(member.id, e.target.files[0])}
                              style={{ display: 'none' }}
                            />
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  <div className="member-info">
                    <h3>{memberName}</h3>
                    <div className="member-detail">
                      <span className="detail-label">Relationship:</span>
                      <span className="detail-value">{member.relationship || 'Not set'}</span>
                    </div>
                    <div className="member-detail">
                      <span className="detail-label">Birthday:</span>
                      <span className="detail-value">
                        {formatBirthDate(member.birthDate)}
                        {age !== null && ` (Age ${age})`}
                      </span>
                    </div>
                    {member.location && (
                      <div className="member-detail">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{member.location}</span>
                      </div>
                    )}
                    {genderLabel && (
                      <div className="member-detail">
                        <span className="detail-label">Gender:</span>
                        <span className="detail-value">{genderLabel}</span>
                      </div>
                    )}
                    {parentNames.length > 0 && (
                      <div className="member-detail">
                        <span className="detail-label">Parents:</span>
                        <span className="detail-value">{parentNames.join(', ')}</span>
                      </div>
                    )}
                    {childrenNames.length > 0 && (
                      <div className="member-detail">
                        <span className="detail-label">Children:</span>
                        <span className="detail-value">{childrenNames.join(', ')}</span>
                      </div>
                    )}
                    {spouseNames.length > 0 && (
                      <div className="member-detail">
                        <span className="detail-label">Spouse:</span>
                        <span className="detail-value">{spouseNames.join(', ')}</span>
                      </div>
                    )}
                    {member.notes && (
                      <div className="member-notes">
                        <div className="notes-label">Notes</div>
                        <div className="notes-text">{member.notes}</div>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="member-actions">
                      <button
                        className="btn-edit"
                        onClick={() => setEditingMember(member)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(member.id, memberName)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          members={members}
          onClose={() => setEditingMember(null)}
        />
      )}
    </>
  );
}

export default MemberList;
