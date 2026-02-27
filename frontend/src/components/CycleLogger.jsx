import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import '../styles/Logger.css';

function CycleLogger({ profiles, onClose, onLogCreated, editingLog }) {
  const [selectedProfile, setSelectedProfile] = useState(profiles[0]?.id || '');
  const [logType, setLogType] = useState('period');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingLog) {
      setSelectedProfile(editingLog.profileId);
      setStartDate(editingLog.date || '');
      setEndDate(editingLog.flow || '');
      setSymptoms(editingLog.symptoms || []);
      setNotes(editingLog.notes || '');
    }
  }, [editingLog]);

  const symptomOptions = [
    'Cramps',
    'Headache',
    'Back pain',
    'Bloating',
    'Mood swings',
    'Irritability',
    'Fatigue',
    'Nausea',
    'Breast tenderness',
    'Insomnia',
    'Cravings',
    'Acne',
  ];

  const toggleSymptom = (symptom) => {
    setSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      profileId: selectedProfile,
      startDate: logType === 'period' ? startDate : null,
      endDate: logType === 'period' ? endDate : null,
      type: logType,
      symptoms,
      notes
    };

    try {
      const method = editingLog ? 'PUT' : 'POST';
      const url = editingLog ? `/api/logs/${editingLog.id}` : '/api/logs';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to log');
        return;
      }

      onLogCreated();
      onClose();
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays + 1;
    }
    return 0;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content logger-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Log Your Period</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="logger-form">
          <div className="form-group">
            <label>Who are we logging for?</label>
            <select 
              value={selectedProfile} 
              onChange={(e) => setSelectedProfile(e.target.value)}
              required
            >
              <option value="">Select a profile</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>What are we logging?</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="logType"
                  value="period"
                  checked={logType === 'period'}
                  onChange={(e) => setLogType(e.target.value)}
                />
                <span>Period 🩸</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="logType"
                  value="symptom"
                  checked={logType === 'symptom'}
                  onChange={(e) => setLogType(e.target.value)}
                />
                <span>Just Symptoms 😩</span>
              </label>
            </div>
          </div>

          {logType === 'period' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Period Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Period End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {calculateDays() > 0 && (
                <div className="period-duration">
                  <span className="duration-badge">
                    {calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}
                  </span>
                </div>
              )}
            </>
          )}

          {logType === 'symptom' && (
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Symptoms (select all that apply)</label>
            <div className="symptoms-grid">
              {symptomOptions.map(symptom => (
                <button
                  key={symptom}
                  type="button"
                  className={`symptom-btn ${symptoms.includes(symptom) ? 'selected' : ''}`}
                  onClick={() => toggleSymptom(symptom)}
                >
                  {symptoms.includes(symptom) && <Check size={16} />}
                  {symptom}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              placeholder="Anything else? Mood spirals? Weird food cravings? We don't judge..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            onClick={(e) => {
              console.log('Button clicked!');
            }}
          >
            {loading ? 'Logging...' : editingLog ? 'Update Period' : 'Log Period'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CycleLogger;