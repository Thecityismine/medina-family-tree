import React, { useState, useEffect } from 'react';
import {
  calculateAge,
  formatBirthDate,
  getNextBirthdayDate,
  parseBirthDate
} from '../utils/birthdays';
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
    let totalBirthdays = 0;

    members.forEach(member => {
      const birthDate = parseBirthDate(member.birthDate);
      if (!birthDate) return;

      totalBirthdays++;

      if (birthDate.getMonth() === currentMonth) {
        thisMonth++;
      }

      const nextBirthday = getNextBirthdayDate(member.birthDate, today);
      if (nextBirthday && nextBirthday <= next30Days) {
        next30++;
      }

      const age = calculateAge(member.birthDate);
      if (age !== null) {
        totalAge += age;
        validAges++;
      }
    });

    setStats({
      thisMonth,
      next30Days: next30,
      total: totalBirthdays,
      averageAge: validAges > 0 ? Math.round(totalAge / validAges) : 0
    });
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();

    const upcoming = members
      .map(member => {
        const nextBirthday = getNextBirthdayDate(member.birthDate, today);
        if (!nextBirthday) return null;

        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        const age = calculateAge(member.birthDate);

        return {
          ...member,
          nextBirthday,
          daysUntil,
          turningAge: age !== null ? age + 1 : null
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.nextBirthday - b.nextBirthday)
      .slice(0, 3);

    setUpcomingBirthdays(upcoming);
  };

  const getMonthBirthdays = (month) => {
    const today = new Date();

    const birthdays = members
      .map(member => {
        const birthDate = parseBirthDate(member.birthDate);
        if (!birthDate || birthDate.getMonth() !== month) return null;

        const age = calculateAge(member.birthDate);
        const thisYear = new Date(today.getFullYear(), month, birthDate.getDate());
        let daysUntil = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));
        if (daysUntil < 0) {
          daysUntil += 365;
        }

        return {
          ...member,
          day: birthDate.getDate(),
          daysUntil,
          turningAge: age !== null ? age + 1 : null
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.day - b.day);

    setMonthBirthdays(birthdays);
  };

  const getDaysBadge = (daysUntil) => {
    if (daysUntil === 0) return { text: 'TODAY!', class: 'today' };
    if (daysUntil === 1) return { text: 'Tomorrow', class: 'soon' };
    if (daysUntil <= 7) return { text: `${daysUntil} days`, class: 'soon' };
    if (daysUntil <= 30) return { text: `${daysUntil} days`, class: 'upcoming' };
    return { text: `${daysUntil} days`, class: '' };
  };

  const getMonthCount = (month) => {
    return members.filter(member => {
      const birthDate = parseBirthDate(member.birthDate);
      return birthDate ? birthDate.getMonth() === month : false;
    }).length;
  };

  return (
    <div className="birthday-calendar">
      <div className="calendar-header">
        <h2>Family Birthdays</h2>
        <p className="calendar-subtitle">Never miss a celebration</p>
      </div>

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

      {upcomingBirthdays.length > 0 && (
        <div className="upcoming-section">
          <h3>Coming Up Soon</h3>
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
                      {formatBirthDate(member.birthDate)}
                      {member.turningAge && ` - Turning ${member.turningAge}`}
                    </div>
                  </div>
                  <div className={`days-badge ${badge.class}`}>{badge.text}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                      {member.turningAge && ` - Turning ${member.turningAge}`}
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
            <div className="empty-icon">0</div>
            <p>No birthdays in {months[selectedMonth]}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BirthdayCalendar;
