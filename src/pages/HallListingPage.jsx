import { useState } from 'react';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';

function TimeDropdown({ label, value, onChange, min }) {
  // Generate hour and minute options
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const pad = n => n.toString().padStart(2, '0');

  // Parse min time if provided
  let minHour = 0, minMinute = 0;
  if (min) {
    const [h, m] = min.split(':');
    minHour = parseInt(h, 10);
    minMinute = parseInt(m, 10);
  }

  // Get current hour and minute from value
  const currentHour = value !== '' && value !== undefined ? value.split(':')[0] : '';
  const currentMinute = value !== '' && value !== undefined ? value.split(':')[1] : '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <span>{label}</span>
      <select
        value={currentHour}
        onChange={e => {
          const hour = e.target.value;
          // If minute is empty, default to 00
          const minute = currentMinute !== '' && currentMinute !== undefined ? currentMinute : '00';
          onChange(`${pad(hour)}:${minute}`);
        }}
        style={{ fontSize: '1rem' }}
      >
        <option value="" disabled>HH</option>
        {hours.map(h => {
          if (min && label === "Start Time" && h < minHour) return null;
          return <option key={h} value={pad(h)}>{pad(h)}</option>;
        })}
      </select>
      <span>:</span>
      <select
        value={currentMinute}
        onChange={e => {
          const minute = e.target.value;
          const hour = currentHour !== '' && currentHour !== undefined ? currentHour : '00';
          onChange(`${hour}:${pad(minute)}`);
        }}
        style={{ fontSize: '1rem' }}
      >
        <option value="" disabled>MM</option>
        {minutes.map(m => {
          const hour = currentHour !== '' && currentHour !== undefined ? parseInt(currentHour, 10) : null;
          if (min && label === "Start Time" && hour === minHour && m < minMinute) return null;
          return <option key={m} value={pad(m)}>{pad(m)}</option>;
        })}
      </select>
    </div>
  );
}

export default function HallListingPage({User}) {
  console.log(User);
  const halls = [
    { name: 'RUSA Gallery' },
    { name: 'Turing Hall' }
  ];

  const [bookingHall, setBookingHall] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Add userId for demo; replace with actual user context if available
  const userId = JSON.parse(localStorage.getItem('user'))?.userId || 'demoUser';

  const handleBookClick = (hall) => {
    setBookingHall(hall);
    setSelectedDate('');
    setStartTime('');
    setEndTime('');
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setStartTime('');
    setEndTime('');
  };

  const handleStartTimeChange = (val) => {
    setStartTime(val);
  };

  const handleEndTimeChange = (val) => {
    setEndTime(val);
  };

  const handleConfirm = async () => {
    // Send booking info to backend
    try {
      const res = await fetch('http://localhost:5000/api/hall-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          hallName: bookingHall.name,
          date: selectedDate,
          startTime,
          endTime
        })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Booking request failed');
      } else {
        alert(
          `Booked ${bookingHall.name} on ${selectedDate} from ${startTime} to ${endTime}`
        );
      }
    } catch (e) {
      alert('Could not connect to backend');
    }
    setBookingHall(null);
    setSelectedDate('');
    setStartTime('');
    setEndTime('');
  };

  return (
    <div style={{
      
      minHeight: '100vh',
      minWidth: '100vw',
      background: 'linear-gradient(135deg, #f5f5dc 0%, #e3d9c6 100%)',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Banner/>
      <Sidebar />
      <h2 style={{
        paddingTop:96,
        color: '#7a5c1c',
        fontSize: '2rem',
        margin: '2rem 0 1.5rem 0',
        letterSpacing: 1
      }}>
        Hall Listing
      </h2>
      <div style={{
        display: 'flex',
        gap: 32,
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 1200
      }}>
        {halls.map(hall => (
          <div
            key={hall.name}
            style={{
              padding: '2rem 2.5rem',
              background: '#e3d9c6',
              borderRadius: 16,
              minWidth: 200,
              minHeight: 120,
              textAlign: 'center',
              marginBottom: 24,
              boxShadow: '0 4px 16px rgba(182,137,74,0.12)',
              border: '2px solid #e3d9c6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'transform 0.15s, box-shadow 0.15s',
              cursor: 'default'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(182,137,74,0.18)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(182,137,74,0.12)';
            }}
          >
            <div style={{
              fontWeight: 600,
              fontSize: '1.3rem',
              color: '#7a5c1c',
              marginBottom: 10
            }}>
              {hall.name}
            </div>
            <button
              style={{
                background: '#7a5c1c',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.7rem 1.5rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1rem',
                marginTop: 8,
                transition: 'background 0.15s'
              }}
              onClick={() => handleBookClick(hall)}
            >
              Book
            </button>
            {bookingHall && bookingHall.name === hall.name && (
              <div style={{ marginTop: 16 }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  style={{ marginBottom: 8, fontSize: '1rem' }}
                  min={new Date().toISOString().split('T')[0]} // Disable dates before today
                />
                {selectedDate && (
                  <>
                    <TimeDropdown
                      label="Start Time"
                      value={startTime}
                      onChange={handleStartTimeChange}
                    />
                    <TimeDropdown
                      label="End Time"
                      value={endTime}
                      onChange={handleEndTimeChange}
                      min={startTime}
                    />
                  </>
                )}
                {selectedDate && startTime && endTime && (
                  <div style={{ marginTop: 12 }}>
                    <div>
                      <strong>Selected:</strong> {selectedDate} from {startTime} to {endTime}
                    </div>
                    <button
                      style={{
                        background: '#388e3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '0.5rem 1.2rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '1rem',
                        marginTop: 8
                      }}
                      onClick={handleConfirm}
                    >
                      Confirm Booking
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}