import React, { useMemo, useState } from 'react';
import { db, storage } from '../firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import EditMemberModal from './EditMemberModal';
import './MemberList.css';

const GENDER_LABELS = {
  female: 'Female',
  male: 'Male',
  'non-binary': 'Non-binary',
  unspecified: 'Prefer not to say'
};

function MemberList({ members, isAdmin }) {
  const [editingMember, setEditingMember] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(null);

  const memberNameMap = useMemo(() => {
    return members.reduce((acc, member) => {
      acc[member.id] = member.name || 'Unnamed member';
      return acc;
    }, {});
  }, [members]);

  const resolveNames = (ids) => {
    if (!Array.isArray(ids)) return [];
    return ids.map((id) => memberNameMap[id]).filter(Boolean);
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (members.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">dY`</div>
        <h3>No Family Members Yet</h3>
        <p>Start by adding your first family member!</p>
      </div>
    );
  }

  return (
    <>
      <div className="member-grid">
        {members.map((member) => {
          const age = calculateAge(member.birthDate);
          const parentNames = resolveNames(member.parentIds);
          const spouseNames = resolveNames(member.spouseIds);
          const genderLabel = GENDER_LABELS[member.gender];

          return (
            <div key={member.id} className="member-card">
              <div className="member-photo-section">
                {member.photoURL ? (
                  <img
                    src={member.photoURL}
                    alt={member.name}
                    className="member-photo"
                  />
                ) : (
                  <div className="member-photo-placeholder">
                    {member.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                {isAdmin && (
                  <label className="photo-upload-btn">
                    {uploadingPhoto === member.id ? (
                      <span>Uploading...</span>
                    ) : (
                      <>
                        dY"ú {member.photoURL ? 'Change' : 'Add'} Photo
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
                <h3>{member.name}</h3>
                <div className="member-detail">
                  <span className="detail-label">Relationship:</span>
                  <span className="detail-value">{member.relationship || 'Not set'}</span>
                </div>
                <div className="member-detail">
                  <span className="detail-label">Birthday:</span>
                  <span className="detail-value">
                    {formatDate(member.birthDate)}
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
                {spouseNames.length > 0 && (
                  <div className="member-detail">
                    <span className="detail-label">Spouse:</span>
                    <span className="detail-value">{spouseNames.join(', ')}</span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="member-actions">
                  <button
                    className="btn-edit"
                    onClick={() => setEditingMember(member)}
                  >
                    ƒo?‹,? Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(member.id, member.name)}
                  >
                    dY-`‹,? Delete
                  </button>
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
