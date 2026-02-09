import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import './EditMemberModal.css';

const RELATIONSHIP_OPTIONS = [
  'Great Grandfather',
  'Great Grandmother',
  'Grandfather',
  'Grandmother',
  'Father',
  'Mother',
  "Anseli's Mother",
  'Great Uncle',
  'Great Aunt',
  'Uncle',
  'Aunt',
  'You (Admin)',
  'You',
  'Self',
  'Spouse',
  'Partner',
  'Brother',
  'Sister',
  'Sibling',
  'Cousin',
  'First Cousin',
  'Son',
  'Daughter',
  'Child',
  'Nephew',
  'Niece',
  'Grandson',
  'Granddaughter',
  'Grandchild',
  'Great Grandson',
  'Great Granddaughter',
  'Great Grandchild'
];

function EditMemberModal({ member, onClose }) {
  const [formData, setFormData] = useState({
    name: member.name || '',
    relationship: member.relationship || '',
    birthDate: member.birthDate || '',
    location: member.location || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateDoc(doc(db, 'members', member.id), {
        ...formData,
        updatedAt: new Date()
      });

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
          <button className="close-btn" onClick={onClose}>✕</button>
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
            <label>Relationship *</label>
            <select
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              required
            >
              <option value="">Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Birthday *</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              required
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

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMemberModal;
