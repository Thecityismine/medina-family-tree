import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import './EditMemberModal.css';

const MAX_PARENTS = 2;

function EditMemberModal({ member, members = [], onClose }) {
  const [formData, setFormData] = useState({
    name: member.name || '',
    relationship: member.relationship || '',
    birthDate: member.birthDate || '',
    location: member.location || '',
    gender: member.gender || '',
    parentIds: member.parentIds || [],
    spouseId: (member.spouseIds && member.spouseIds[0]) || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const memberOptions = [...members]
    .filter((option) => option.id !== member.id)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleParentToggle = (parentId) => {
    setFormData((prev) => {
      const alreadySelected = prev.parentIds.includes(parentId);
      if (alreadySelected) {
        setError('');
        return {
          ...prev,
          parentIds: prev.parentIds.filter((id) => id !== parentId)
        };
      }

      if (prev.parentIds.length >= MAX_PARENTS) {
        setError('You can select up to two parents.');
        return prev;
      }

      setError('');
      return { ...prev, parentIds: [...prev.parentIds, parentId] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const previousSpouseId = (member.spouseIds && member.spouseIds[0]) || '';
      const nextSpouseId = formData.spouseId || '';
      const spouseIds = nextSpouseId ? [nextSpouseId] : [];

      await updateDoc(doc(db, 'members', member.id), {
        name: formData.name.trim(),
        relationship: formData.relationship,
        birthDate: formData.birthDate,
        location: formData.location,
        gender: formData.gender,
        parentIds: formData.parentIds,
        spouseIds,
        updatedAt: new Date()
      });

      const spouseUpdates = [];
      if (previousSpouseId && previousSpouseId !== nextSpouseId) {
        spouseUpdates.push(
          updateDoc(doc(db, 'members', previousSpouseId), {
            spouseIds: arrayRemove(member.id)
          })
        );
      }
      if (nextSpouseId && previousSpouseId !== nextSpouseId) {
        spouseUpdates.push(
          updateDoc(doc(db, 'members', nextSpouseId), {
            spouseIds: arrayUnion(member.id)
          })
        );
      }

      if (spouseUpdates.length) {
        await Promise.all(spouseUpdates);
      }

      alert('Family member updated successfully!');
      onClose();
    } catch (err) {
      console.error('Error updating member:', err);
      setError('Error updating family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Family Member</h3>
          <button className="close-btn" onClick={onClose}>バ</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Relationship (optional)</label>
            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
            >
              <option value="">Select relationship...</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Son">Son</option>
              <option value="Daughter">Daughter</option>
              <option value="Brother">Brother</option>
              <option value="Sister">Sister</option>
              <option value="Grandfather">Grandfather</option>
              <option value="Grandmother">Grandmother</option>
              <option value="Grandson">Grandson</option>
              <option value="Granddaughter">Granddaughter</option>
              <option value="Uncle">Uncle</option>
              <option value="Aunt">Aunt</option>
              <option value="Nephew">Nephew</option>
              <option value="Niece">Niece</option>
              <option value="Cousin">Cousin</option>
              <option value="Spouse">Spouse</option>
              <option value="Partner">Partner</option>
            </select>
          </div>

          <div className="form-group">
            <label>Birthday (optional)</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., California, USA"
            />
          </div>

          <div className="form-group">
            <label>Gender (optional)</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Select gender...</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="unspecified">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label>Spouse (optional)</label>
            {memberOptions.length === 0 ? (
              <div className="helper-text">Add someone first to link a spouse.</div>
            ) : (
              <select
                name="spouseId"
                value={formData.spouseId}
                onChange={handleChange}
              >
                <option value="">No spouse selected</option>
                {memberOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name || 'Unnamed member'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label>Parents (optional, up to 2)</label>
            {memberOptions.length === 0 ? (
              <div className="helper-text">Add a parent after you have members in the list.</div>
            ) : (
              <div className="checkbox-list">
                {memberOptions.map((option) => (
                  <label key={option.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.parentIds.includes(option.id)}
                      onChange={() => handleParentToggle(option.id)}
                    />
                    <span>{option.name || 'Unnamed member'}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'dY'_ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMemberModal;
