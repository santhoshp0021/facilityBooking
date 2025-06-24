import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Banner from '../components/Banner';

const storedUser = localStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : null;

const typeColors = {
  room: '#e8f0fe',
  lab: '#f3e5f5',
  projector: '#fff7e6'
};
const borderColors = {
  room: '#4285f4',
  lab: '#8e24aa',
  projector: '#fbbc04'
};

const periods = [
  { start: '08:30', end: '09:20' },
  { start: '09:25', end: '10:15' },
  { start: '10:30', end: '11:20' },
  { start: '11:25', end: '12:15' },
  { start: '13:10', end: '14:00' },
  { start: '14:05', end: '14:55' },
  { start: '15:00', end: '15:50' },
  { start: '15:55', end: '16:45' }
];

const defaultFacilities = [
  { name: 'KP-107', type: 'room' }, { name: 'KP-102', type: 'room' },
  { name: 'KP-210', type: 'room' }, { name: 'KP-303', type: 'room' },
  { name: 'KP-307', type: 'room' }, { name: 'KP-106', type: 'room' },
  { name: 'KP-206', type: 'room' }, { name: 'KP-407', type: 'room' },
  { name: 'KP-406', type: 'room' }, { name: 'R-1', type: 'room' },
  { name: 'R-2', type: 'room' }, { name: 'R-3', type: 'room' },
  { name: 'Ground Floor Lab', type: 'lab' },
  { name: 'First Floor Lab', type: 'lab' },
  { name: 'Second Floor Lab', type: 'lab' },
  { name: 'Temenos Floor Lab', type: 'lab' },
  { name: 'Projector1', type: 'projector' },
  { name: 'Projector2', type: 'projector' },
  { name: 'Projector3', type: 'projector' }
];

// ✅ Utility to check if a date is today or in the future
function isFutureOrToday(dateStr,slotStartTime) {
  dateStr = `${dateStr}T${slotStartTime}:00`;
  const dateStrObj = new Date(dateStr);
  const now = new Date();
  return dateStrObj >= now;
}

const FacilityWiseBooking = () => {
  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [facilityUsage, setFacilityUsage] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await axios.get('/api/admin/available-week-dates');
        setDateList(res.data);
        if (res.data.length > 0) {
          const todayStr = new Date().toISOString().split("T")[0];
          const todayAvailable = res.data.includes(todayStr);
          setSelectedDate(todayAvailable ? todayStr : res.data[0]);
        }
      } catch {
        setDateList([]);
      }
    };
    fetchDates();
  }, []);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!selectedDate) return;
      setLoading(true);
      try {
        const res = await axios.get('/api/admin/usage-status', { params: { date: selectedDate } });
        setFacilityUsage(res.data);
      } catch {
        setFacilityUsage({});
      }
      setLoading(false);
    };
    fetchUsage();
  }, [selectedDate]);

  const handleBook = async (facilityName, type, idx) => {
    console.log('Booking:', selectedDate, idx, facilityName, type, user.userId);
    const payload = {
      date: selectedDate,
      slot: idx,
      facility: facilityName,
      type: type,
      userId: user.userId,
    };

    try {
      const response = await fetch("/api/faculty/facilities/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || "Booking failed");
      }
      await response.json();
      alert(` ${facilityName} successfully booked for ${selectedDate} - Period ${idx + 1}`);
      window.location.reload();
    } catch (err) {
      console.error("Booking error:", err);
      alert("Booking failed. Try again.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: '#f5f5dc', width: '100vw' }}>
      <Banner />
      <Sidebar />
      <h2 style={{ paddingTop: 96, marginBottom: 20, color: '#1a237e', textAlign: 'center' }}>
        Facility-wise Booking
      </h2>
      <div style={{ display: 'flex', overflowX: 'auto', gap: 10, padding: '8px 16px', whiteSpace: 'nowrap', marginBottom: 30 }}>
        {dateList.map(date => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid #7a5c1c',
              background: date === selectedDate ? '#7a5c1c' : '#fff',
              color: date === selectedDate ? '#fff' : '#7a5c1c',
              cursor: 'pointer',
              minWidth: 100
            }}
          >
            {date}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {defaultFacilities.map((fac, index) => {
          const { name, type } = fac;
          const bgColor = typeColors[type] || '#f9f9f9';
          const borderColor = borderColors[type] || '#ccc';
          const usage = facilityUsage[name]?.usage || [];

          return (
            <div key={index} style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 12, padding: 20, width: '70%' }}>
              <h3 style={{ color: borderColor, textAlign: 'Center' }}>{name}</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {periods.map((p, idx) => {
                  const match = usage.find(u => u.periodNo === idx + 1);
                  return (
                    <div key={idx} style={{ padding: '6px 10px', background: match ? '#f8d7da' : '#e0f2f1', borderRadius: 6, minWidth: 120 }}>
                      Period {idx + 1}<br />
                      {p.start} - {p.end}<br />
                      {match ? match.bookedBy : 'Free'}<br />
                      {/* ✅ Only allow booking if not booked and date is today or future */}
                      {!match && isFutureOrToday(selectedDate,p.start) && (
                        <button onClick={() => handleBook(name, type, idx)} style={{ marginTop: 4, padding: '2px 6px', fontSize: 12 }}>
                          Book
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FacilityWiseBooking;
