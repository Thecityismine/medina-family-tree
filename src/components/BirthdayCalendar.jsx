import React, { useState, useEffect } from 'react';
import './BirthdayCalendar.css';

function BirthdayCalendar({ members }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [stats, setStats] = useState({
    thisMonth: 0,
    next30Days: 0,
    total: 0,
    averageAge: 0
  });
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [monthBirthdays, setMonthBirthdays] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    calculateStats();
    getUpcomingBirthdays();
    getMonthBirthdays(selectedMonth);
  }, [members, selectedMonth]);

  const calculateStats = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    let thisMonth = 0;
    let next30 = 0;
    let totalAge = 0;
    let validAges = 0;

    members.forEach(member => {
      if (!member.birthDate) return;

      const birthDate = new Date(member.birthDate);
      const birthMonth = birthDate.getMonth();

      // This month count
      if (birthMonth === currentMonth) {
        thisMonth++;
      }

      // Next 30 days count
      const nextBirthday = getNextBirthday(birthDate);
      if (nextBirthday <= next30Days) {
        next30++;
      }

      // Calculate age
      const age = calculateAge(member.birthDate);
      if (age !== null) {
        totalAge += age;
        validAges++;
      }
    });

    setStats({
      thisMonth,
      next30Days: next30,
      total: members.filter(m => m.birthDate).length,
      averageAge: validAges > 0 ? Math.round(totalAge / validAges) : 0
    });
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();
    
    const upcoming = members
      .filter(m => m.birthDate)
      .map(member => {
        const birthDate = new Date(member.birthDate);
        const nextBirthday = getNextBirthday(birthDate);
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        const age = calculateAge(member.birthDate);
        
        return {
          ...member,
          nextBirthday,
          daysUntil,
          turningAge: age !== null ? age + 1 : null
        };
      })
      .sort((a, b) => a.nextBirthday - b.nextBirthday)
      .slice(0, 3);

    setUpcomingBirthdays(upcoming);
  };

  const getMonthBirthdays = (month) => {
    const birthdays = members
      .filter(m => {
        if (!m.birthDate) return false;
        const birthDate = new Date(m.birthDate);
        return birthDate.getMonth() === month;
      })
      .map(member => {
        const birthDate = new Date(member.birthDate);
        const age = calculateAge(member.birthDate);
        const today = new Date();
        const thisYear = new Date(today.getFullYear(), month, birthDate.getDate());
        const daysUntil = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));
        
        return {
          ...member,
          day: birthDate.getDate(),
          daysUntil: daysUntil >= 0 ? daysUntil : daysUntil + 365,
          turningAge: age !== null ? age + 1 : null
        };
      })
      .sort((a, b) => a.day - b.day);

    setMonthBirthdays(birthdays);
  };

  const getNextBirthday = (birthDate) => {
    const today = new Date();
    const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    
    if (thisYear < today) {
      return new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
    }
    return thisYear;
  };

  const calculateAge = (birthDateString) => {
    if (!birthDateString) return null;
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (birthDate) => {
    if (!birthDate) return '';
    const date = new Date(birthDate);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const getDaysBadge = (daysUntil) => {
    if (daysUntil === 0) return { text: 'TODAY!', class: 'today' };
    if (daysUntil === 1) return { text: 'Tomorrow', class: 'soon' };
    if (daysUntil <= 7) return { text: `${daysUntil} days`, class: 'soon' };
    if (daysUntil <= 30) return { text: `${daysUntil} days`, class: 'upcoming' };
    return { text: `${daysUntil} days`, class: '' };
  };

  const getMonthCount = (month) => {
    return members.filter(m => {
      if (!m.birthDate) return false;
      const birthDate = new Date(m.birthDate);
      return birthDate.getMonth() === month;
    }).length;
  };

  return (
    <div className="birthday-calendar">
      <div className="calendar-header">
        <h2>🎂 Family Birthdays</h2>
        <p className="calendar-subtitle">Never miss a celebration</p>
      </div>

      {/* Stats Dashboard */}
      <div className="birthday-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.thisMonth}</div>
          <div className="stat-label">This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.next30Days}</div>
          <div className="stat-label">Next 30 Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Birthdays</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.averageAge}</div>
          <div className="stat-label">Average Age</div>
        </div>
      </div>

      {/* Coming Up Soon */}
      {upcomingBirthdays.length > 0 && (
        <div className="upcoming-section">
          <h3>🎉 Coming Up Soon</h3>
          <div className="birthday-grid">
            {upcomingBirthdays.map(member => {
              const badge = getDaysBadge(member.daysUntil);
              return (
                <div key={member.id} className={`birthday-card ${badge.class}`}>
                  <div className="birthday-avatar">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.name} />
                    ) : (
                      member.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="birthday-info">
                    <div className="birthday-name">{member.name}</div>
                    <div className="birthday-date">
                      {formatDate(member.birthDate)}
                      {member.turningAge && ` • Turning ${member.turningAge}`}
                    </div>
                  </div>
                  <div className={`days-badge ${badge.class}`}>{badge.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Month Selector */}
      <div className="month-section">
        <h3>Browse All Months</h3>
        <div className="month-selector">
          {months.map((month, index) => {
            const count = getMonthCount(index);
            return (
              <button
                key={month}
                className={`month-btn ${selectedMonth === index ? 'active' : ''}`}
                onClick={() => setSelectedMonth(index)}
              >
                {month}
                {count > 0 && <span className="count">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Detail View */}
      <div className="month-detail">
        <h3>{months[selectedMonth]} {new Date().getFullYear()}</h3>
        {monthBirthdays.length > 0 ? (
          <div className="birthday-grid">
            {monthBirthdays.map(member => {
              const badge = getDaysBadge(member.daysUntil);
              return (
                <div key={member.id} className={`birthday-card ${badge.class}`}>
                  <div className="birthday-avatar">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.name} />
                    ) : (
                      member.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="birthday-info">
                    <div className="birthday-name">{member.name}</div>
                    <div className="birthday-date">
                      {months[selectedMonth]} {member.day}
                      {member.turningAge && ` • Turning ${member.turningAge}`}
                    </div>
                  </div>
                  {member.daysUntil <= 30 && (
                    <div className={`days-badge ${badge.class}`}>{badge.text}</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-month">
            <div className="empty-icon">🎈</div>
            <p>No birthdays in {months[selectedMonth]}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BirthdayCalendar;
