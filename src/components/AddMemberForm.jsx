import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import './AddMemberForm.css';

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

function AddMemberForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    birthDate: '',
    location: ''
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
      await addDoc(collection(db, 'members'), {
        ...formData,
        createdAt: new Date(),
        photoURL: null
      });

      alert('Family member added successfully!');
      
      // Reset form
      setFormData({
        name: '',
        relationship: '',
        birthDate: '',
        location: ''
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Error adding family member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-member-form">
      <div className="form-intro">
        <h3>Add a New Family Member</h3>
        <p>Fill in the details below to add someone to the family tree.</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Jorge Medina"
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
        </div>

        <div className="form-row">
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
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Adding...' : '✅ Add Family Member'}
          </button>
        </div>
      </form>

      <div className="form-note">
        <p><strong>Note:</strong> After adding a member, you can upload their photo from the Family Members list.</p>
      </div>
    </div>
  );
}

export default AddMemberForm;
