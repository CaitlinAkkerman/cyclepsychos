import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import '../styles/Dashboard.css';


function Dashboard({ household, profiles, onAddLog, onEditLog, onProfileClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfile) {
      setSelectedProfile(profiles[0]);
    }
  }, [profiles, selectedProfile]);

  const getInsights = () => {
    const insights = [];
  
    // Check if cycles are synced
    const activePeriods = profiles.filter(p => p.lastLogged);
    if (activePeriods.length > 1) {
      const dates = activePeriods.map(p => new Date(p.lastLogged));
      const maxDate = Math.max(...dates);
      const minDate = Math.min(...dates);
      const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
      if (daysDiff <= 3) {
        insights.push({
          title: "🔄 Synced Cycles",
          content: `All family members are on their period within ${daysDiff} days of each other!`
        });
      } else if (daysDiff <= 7) {
        insights.push({
          title: "📊 Somewhat Synced",
          content: `Periods are within the same week. Close but not perfectly synced.`
        });
      } else {
        insights.push({
          title: "📅 Staggered Cycles",
          content: `Periods are spread throughout the month. Less household drama!`
        });
      }
    }
  
    // Check for upcoming periods
    const upcomingPeriods = profiles.map(p => {
      if (!p.lastLogged) return null;
      const lastPeriod = new Date(p.lastLogged);
      const cycleLength = p.cycleLength || 28;
      const nextPeriod = new Date(lastPeriod);
      nextPeriod.setDate(nextPeriod.getDate() + cycleLength);
      const daysUntil = Math.ceil((nextPeriod - new Date()) / (1000 * 60 * 60 * 24));
      return { name: p.name, daysUntil, nextPeriod };
    }).filter(Boolean);
  
    if (upcomingPeriods.length > 0) {
      const soonest = upcomingPeriods.sort((a, b) => a.daysUntil - b.daysUntil)[0];
      if (soonest.daysUntil > 0 && soonest.daysUntil <= 7) {
        insights.push({
          title: "⏰ Period Coming Soon",
          content: `${soonest.name}'s next period is in ${soonest.daysUntil} days.`
        });
      }
    }
  
    // Supply check
    insights.push({
      title: "📦 Supply Check",
      content: `You're tracking ${profiles.length} person/people. Stock up accordingly!`
    });
  
    return insights;
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const profileColors = {
    'Ayden Erhart': '#ff006e',
    'Caitlin Akkerman': '#08f7fe',
  };

  const getProfileColor = (name) => {
    return profileColors[name] || '#7209b7';
  };

  const getPeriodDaysForMonth = () => {
    const periodDays = {};
    
    profiles?.forEach(profile => {
      if (profile.lastLogged) {
        const [startYear, startMonth, startDay] = profile.lastLogged.split('-').map(Number);
        const startDate = new Date(startYear, startMonth - 1, startDay);
        
        let endDate = startDate;
        if (profile.endDate && profile.endDate.length === 10) {
          const [endYear, endMonth, endDay] = profile.endDate.split('-').map(Number);
          endDate = new Date(endYear, endMonth - 1, endDay);
        }
        
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        if (startDate <= monthEnd && endDate >= monthStart) {
          const current = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          while (current.getMonth() === currentDate.getMonth()) {
            if (current >= startDate && current <= endDate) {
              const day = current.getDate();
              if (!periodDays[day]) {
                periodDays[day] = [];
              }
              periodDays[day].push({
                name: profile.name,
                color: getProfileColor(profile.name)
              });
            }
            current.setDate(current.getDate() + 1);
          }
        }
      }
    });
    
    return periodDays;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const periodDays = getPeriodDaysForMonth();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const hasPeriod = periodDays[day];
      
      let backgroundColor = 'transparent';
      if (hasPeriod && hasPeriod.length > 0) {
        backgroundColor = hasPeriod[0].color;
      }
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday && !hasPeriod ? 'today' : ''} ${hasPeriod ? 'period-day' : ''}`}
          title={hasPeriod ? `Period: ${hasPeriod.map(p => p.name).join(', ')}` : ''}
          style={{
            backgroundColor: backgroundColor,
            opacity: hasPeriod ? 0.85 : 1,
            color: hasPeriod ? '#1a1f3a' : 'var(--text-secondary)',
            textShadow: hasPeriod ? '0 1px 3px rgba(255,255,255,0.3)' : 'none'
          }}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  const getWittyMessage = (profile) => {
    if (!profile) return '';
    
    const messages = [
      "Your uterus is currently behaving responsibly.",
      "Plot twist: everything's fine.",
      "No drama this week. Surprise!",
      "Your body: the monthly cliffhanger nobody asked for.",
      "Cycle status: less chaotic than usual.",
      "This is fine. (It's actually fine.)",
      "The good news: you're not dying.",
      "Currently: experiencing life normally.",
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Cycle Dashboard</h2>
        <p>Your household's monthly chaos, visualized</p>
      </div>

      <div className="dashboard-container">
        <div className="profiles-section">
          <div className="section-header">
            <h3>Family Members</h3>
            <button className="btn btn-primary btn-small" onClick={onAddLog}>
              <Plus size={16} />
              Log Event
            </button>
          </div>

          <div className="profiles-overview">
            {profiles && profiles.map((profile) => (
              <div 
                key={profile.id}
                className={`profile-overview-card ${selectedProfile?.id === profile.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedProfile(profile);
                  onProfileClick(profile);
                }}
              >
                <div className="overview-name">{profile.name}</div>
                <div className="overview-status">
                  {profile.cycleStatus || 'Normal'}
                </div>
                <div className="overview-meta">
                  {profile.lastLogged ? (
                    profile.endDate ? (
                      <>Period: {profile.lastLogged} to {profile.endDate}</>
                    ) : (
                      <>Started: {profile.lastLogged}</>
                    )
                  ) : (
                    <>Never logged</>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-section">
          <div className="calendar-header">
            <button onClick={previousMonth} className="calendar-nav">
              <ChevronLeft size={20} />
            </button>
            <h3>
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="calendar-nav">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="weekday-header">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="calendar-grid">
            {renderCalendar()}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-color menstruating"></div>
              <span>Menstruating</span>
            </div>
          </div>
        </div>
      </div>

      {/* INSIGHTS SECTION */}
      <div className="insights-section">
        <h3>Family Insights</h3>
        <div className="insights-grid">
          {getInsights().map((insight, idx) => (
            <div key={idx} className="insight-card">
              <div className="insight-title">{insight.title}</div>
              <div className="insight-content">{insight.content}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pending-periods-section">
        <h3>Pending Period Entries</h3>
        <div className="pending-list">
          {profiles && profiles.length > 0 ? (
            profiles
              .filter(profile => profile.lastLogged && !profile.endDate)
              .map(profile => (
                <div key={profile.id} className="pending-item">
                  <div className="pending-info">
                    <div className="pending-name">{profile.name}</div>
                    <div className="pending-date">
                      Started: {profile.lastLogged}
                    </div>
                    <div className="pending-status">⏳ Waiting for end date</div>
                  </div>
                  <button 
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      onEditLog({
                        profileId: profile.id,
                        date: profile.lastLogged,
                        startDate: profile.lastLogged,
                        endDate: null,
                        symptoms: [],
                        notes: ''
                      });
                    }}
                  >
                    Edit
                  </button>
                </div>
              ))
          ) : (
            <p className="empty-state">No pending periods</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;