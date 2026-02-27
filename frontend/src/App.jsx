import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Settings, LogOut, Droplet } from 'lucide-react';
import './App.css';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import ProfileManager from './components/ProfileManager';
import ProfileDetailPage from './components/ProfileDetailPage';
import CycleLogger from './components/CycleLogger';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentHousehold, setCurrentHousehold] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [profiles, setProfiles] = useState([]);
  const [editingLog, setEditingLog] = useState(null);
  const [selectedProfileDetail, setSelectedProfileDetail] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
      loadHousehold();
    }
  }, []);

  const loadHousehold = async () => {
    try {
      const response = await fetch('/api/household', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setCurrentHousehold(data);
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Failed to load household:', error);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    loadHousehold();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setCurrentHousehold(null);
    setProfiles([]);
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-left">
          <div className="app-logo">
            <Droplet className="logo-icon" />
            <h1>CyclePsychos</h1>
          </div>
        </div>
        <div className="nav-right">
          <button 
            className="nav-btn"
            onClick={() => {
              setActiveView('dashboard');
              setEditingLog(null);
            }}
            data-active={activeView === 'dashboard'}
          >
            <Calendar size={20} />
            Dashboard
          </button>
          <button 
            className="nav-btn"
            onClick={() => setActiveView('profiles')}
            data-active={activeView === 'profiles'}
          >
            <Settings size={20} />
            Profiles
          </button>
          <button className="nav-btn logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="main-content">
        {activeView === 'dashboard' && (
          <Dashboard 
            household={currentHousehold} 
            profiles={profiles}
            onAddLog={() => {
              setEditingLog(null);
              setActiveView('log');
            }}
            onEditLog={(log) => {
              setEditingLog(log);
              setActiveView('log');
            }}
            onProfileClick={(profile) => {
              console.log('Profile clicked:', profile); // ADD THIS DEBUG LINE
              setSelectedProfileDetail(profile);
              setActiveView('profile-detail');
            }}
          />
        )}
        {activeView === 'profiles' && (
          <ProfileManager 
            household={currentHousehold}
            profiles={profiles}
            onProfilesUpdate={loadHousehold}
          />
        )}
        {activeView === 'profile-detail' && (
          <ProfileDetailPage 
            profile={selectedProfileDetail}
            onBack={() => setActiveView('dashboard')}
            onEditLog={(log) => {
              setEditingLog(log);
              setActiveView('log');
            }}
          />
        )}
        {activeView === 'log' && (
          <CycleLogger 
            profiles={profiles}
            editingLog={editingLog}
            onClose={() => {
              setActiveView('dashboard');
              setEditingLog(null);
            }}
            onLogCreated={loadHousehold}
          />
        )}
      </main>
    </div>
  );
}

export default App;