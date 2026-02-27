import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit2 } from 'lucide-react';
import '../styles/ProfileDetail.css';

function ProfileDetailPage({ profile, onBack, onEditLog }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    age: '',
    cycleLength: '28',
    periodLength: '5'
  });

  // Safety check
  if (!profile) {
    return (
      <div className="profile-detail-page">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
          Back to Dashboard
        </button>
        <p style={{ color: 'var(--text-secondary)', marginTop: '2rem' }}>
          No profile selected. Please go back to the dashboard and click a profile.
        </p>
      </div>
    );
  }

  useEffect(() => {
    setEditForm({
      age: profile.age || '',
      cycleLength: profile.cycleLength || '28',
      periodLength: profile.periodLength || '5'
    });
    fetchLogs();
  }, [profile?.id]);

  const fetchLogs = async () => {
    if (!profile?.id) return;
    
    try {
      const response = await fetch(`/api/logs/profile/${profile.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    console.log('Save button clicked!');
    console.log('Profile ID:', profile.id);
    console.log('Edit form:', editForm);
  
    try {
      console.log('Sending PUT request...');
      const response = await fetch(`/api/profiles/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          age: parseInt(editForm.age),
          cycleLength: parseInt(editForm.cycleLength),
          periodLength: parseInt(editForm.periodLength)
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('Failed to update profile');
        return;
      }

      console.log('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const periodLogs = logs.filter(log => log.type === 'period');
  const symptomLogs = logs.filter(log => log.type === 'symptom');

  return (
    <div className="profile-detail-page">
      <div className="profile-page-header">
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={24} />
          Back to Dashboard
        </button>
        <h1>{profile.name}</h1>
        <div className="profile-badge">{profile.role}</div>
      </div>

      <div className="profile-page-content">
        <div className="profile-info-card">
          <div className="card-header">
            <h2>Profile Information</h2>
            {!isEditing && (
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="edit-form">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Typical Cycle Length (days)</label>
                <input
                  type="number"
                  value={editForm.cycleLength}
                  onChange={(e) => setEditForm({...editForm, cycleLength: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Typical Period Length (days)</label>
                <input
                  type="number"
                  value={editForm.periodLength}
                  onChange={(e) => setEditForm({...editForm, periodLength: e.target.value})}
                />
              </div>

              <div className="form-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleEditProfile}
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Age</span>
                <span className="value">{profile.age} years</span>
              </div>
              <div className="info-item">
                <span className="label">Typical Cycle Length</span>
                <span className="value">{profile.cycleLength || 28} days</span>
              </div>
              <div className="info-item">
                <span className="label">Typical Period Length</span>
                <span className="value">{profile.periodLength || 5} days</span>
              </div>
            </div>
          )}
        </div>

        <div className="period-history-card">
          <h2>Period History</h2>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : periodLogs.length > 0 ? (
            <div className="period-list">
              {periodLogs.map((log) => (
                <div key={log.id} className="period-entry">
                  <div className="period-dates">
                    <span className="start-date">{log.date}</span>
                    {log.flow && <span className="separator">→</span>}
                    {log.flow && <span className="end-date">{log.flow}</span>}
                  </div>
                  <div className="period-notes">
                    {log.notes && <p>{log.notes}</p>}
                  </div>
                  <button 
                    className="edit-btn"
                    onClick={() => {
                      onEditLog(log);
                    }}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No period logs yet</p>
          )}
        </div>

        {symptomLogs.length > 0 && (
          <div className="symptom-history-card">
            <h2>Symptom Logs</h2>
            <div className="symptom-list">
              {symptomLogs.map((log) => (
                <div key={log.id} className="symptom-entry">
                  <span className="symptom-date">{log.date}</span>
                  <div className="symptom-tags">
                    {log.symptoms?.map((symptom, idx) => (
                      <span key={idx} className="symptom-tag">{symptom}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileDetailPage;