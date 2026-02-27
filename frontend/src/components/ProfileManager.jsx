import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import '../styles/ProfileManager.css';

function ProfileManager({ household, profiles, onProfilesUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    role: 'daughter',
    cycleLength: '28',
    periodLength: '5'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProfile = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to add profile');
        return;
      }

      setFormData({
        name: '',
        age: '',
        role: 'daughter',
        cycleLength: '28',
        periodLength: '5'
      });
      setShowAddForm(false);
      onProfilesUpdate();
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure? This will delete all cycle logs for this person.')) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        setError('Failed to delete profile');
        return;
      }

      onProfilesUpdate();
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="profile-manager">
      <div className="manager-header">
        <h2>Family Profiles</h2>
        <p>Manage who's in the household</p>
      </div>

      <div className="profiles-list">
        {profiles && profiles.length > 0 ? (
          profiles.map(profile => (
            <div key={profile.id} className="profile-list-item">
              <div className="profile-info-main">
                <div className="profile-name-section">
                  <h3>{profile.name}</h3>
                  <span className="profile-role-badge">{profile.role === 'mother' ? '👩 Mom' : '👧 Daughter'}</span>
                </div>
                <div className="profile-details">
                  <div className="detail">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{profile.age} years</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Cycle:</span>
                    <span className="detail-value">{profile.cycleLength} days</span>
                  </div>
                  <div className="detail">
                    <span className="detail-label">Period:</span>
                    <span className="detail-value">{profile.periodLength} days</span>
                  </div>
                </div>
              </div>
              <div className="profile-actions">
                <button 
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteProfile(profile.id)}
                  title="Delete profile"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No profiles yet. Add someone to get started!</p>
          </div>
        )}
      </div>

      {!showAddForm ? (
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
          style={{ marginTop: '2rem' }}
        >
          <Plus size={20} />
          Add Family Member
        </button>
      ) : (
        <div className="add-profile-form">
          <h3>Add a New Profile</h3>
          <form onSubmit={handleAddProfile}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                placeholder="Mom / Daughter / etc"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  placeholder="Years"
                  value={formData.age}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Relationship *</label>
                <select 
                  name="role" 
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="mother">Mother</option>
                  <option value="daughter">Daughter / Teen</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Typical Cycle Length (days)</label>
                <input
                  type="number"
                  name="cycleLength"
                  placeholder="28"
                  value={formData.cycleLength}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Typical Period Length (days)</label>
                <input
                  type="number"
                  name="periodLength"
                  placeholder="5"
                  value={formData.periodLength}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setError('');
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="profile-tips">
        <h3>💡 Tips</h3>
        <ul>
          <li>Each person in your household gets their own private cycle tracking</li>
          <li>You can log for anyone - mom can log for the kids or vice versa</li>
          <li>All data stays in your account (no account sharing needed)</li>
          <li>Perfect for helping teens understand their cycles</li>
        </ul>
      </div>
    </div>
  );
}

export default ProfileManager;