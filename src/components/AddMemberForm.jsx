import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import './AddMemberForm.css';

const MAX_PARENTS = 2;

function AddMemberForm({ members = [], onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    birthDate: '',
    passedAwayDate: '',
    location: '',
    gender: '',
    notes: '',
    parentIds: [],
    spouseId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const memberOptions = [...members].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '')
  );

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
      const spouseIds = formData.spouseId ? [formData.spouseId] : [];
      const memberRef = await addDoc(collection(db, 'members'), {
        name: formData.name.trim(),
        relationship: formData.relationship,
        birthDate: formData.birthDate,
        passedAwayDate: formData.passedAwayDate,
        location: formData.location,
        gender: formData.gender,
        notes: formData.notes,
        parentIds: formData.parentIds,
        spouseIds,
        createdAt: new Date(),
        photoURL: null
      });

      if (formData.spouseId) {
        await updateDoc(doc(db, 'members', formData.spouseId), {
          spouseIds: arrayUnion(memberRef.id)
        });
      }

      alert('Family member added successfully!');

      // Reset form
      setFormData({
        name: '',
        relationship: '',
        birthDate: '',
        passedAwayDate: '',
        location: '',
        gender: '',
        notes: '',
        parentIds: [],
        spouseId: ''
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
              <option value="Great Grandfather">Great Grandfather</option>
              <option value="Great Grandmother">Great Grandmother</option>
              <option value="Grandson">Grandson</option>
              <option value="Granddaughter">Granddaughter</option>
              <option value="Uncle">Uncle</option>
              <option value="Aunt">Aunt</option>
              <option value="Great Uncle">Great Uncle</option>
              <option value="Great Aunt">Great Aunt</option>
              <option value="Nephew">Nephew</option>
              <option value="Niece">Niece</option>
              <option value="Cousin">Cousin</option>
              <option value="First Cousin">First Cousin</option>
              <option value="Spouse">Spouse</option>
              <option value="Partner">Partner</option>
              <option value="Self">Self</option>
              <option value="You">You</option>
              <option value="You (Admin)">You (Admin)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
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
            <label>Passed Away (optional)</label>
            <input
              type="date"
              name="passedAwayDate"
              value={formData.passedAwayDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
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
        </div>

        <div className="form-row single">
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
                {memberOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name || 'Unnamed member'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Parents (optional, up to 2)</label>
          {memberOptions.length === 0 ? (
            <div className="helper-text">Add a parent after you have members in the list.</div>
          ) : (
            <div className="checkbox-list">
              {memberOptions.map((member) => (
                <label key={member.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.parentIds.includes(member.id)}
                    onChange={() => handleParentToggle(member.id)}
                  />
                  <span>{member.name || 'Unnamed member'}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add family history, memories, or details..."
            rows="4"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Family Member'}
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
