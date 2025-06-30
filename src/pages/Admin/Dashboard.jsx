import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Banner from '../../components/Banner';

const typeColors = {
  room: '#e8f0fe',
  lab: '#f3e5f5',
  projector: '#fff7e6',
  hall: '#e0f7fa'
};
const borderColors = {
  room: '#4285f4',
  lab: '#8e24aa',
  projector: '#fbbc04',
  hall: '#00acc1'
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

function generateTimeSlots(start = "08:00", end = "17:00", interval = 15) {
  const slots = [];
  let [hour, minute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  while (hour < endHour || (hour === endHour && minute < endMinute)) {
    const startStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    minute += interval;
    if (minute >= 60) {
      hour += 1;
      minute -= 60;
    }
    const endStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push({ start: startStr, end: endStr });
  }
  return slots;
}

const Dashboard = () => {
  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [facilityUsage, setFacilityUsage] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await axios.get('/api/admin/available-week-dates');
        setDateList(res.data);
        if (res.data.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          const todayExists = res.data.includes(todayStr);
          setSelectedDate(todayExists ? todayStr : res.data[0]);
        }
      } catch {
        setDateList([]);
      }
    };
    fetchDates();
  }, []);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const res = await axios.get('/api/allFacilities');
        setFacilities(res.data);
      } catch {
        setFacilities([]);
      }
    };
    fetchFacilities();
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

  const handleFreePeriod = async (facilityName, type, periodNo, userId) => {
    try {
      const res = await axios.post('/api/admin/free-slot-period', {
        facilityName,
        type,
        date: selectedDate,
        periodNo,
        userId
      });
      alert(res.data.message || 'Slot freed successfully');
      const usageRes = await axios.get('/api/admin/usage-status', { params: { date: selectedDate } });
      setFacilityUsage(usageRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to free the slot');
    }
  };

  const handleFreeHall = async (hallName, startTime, endTime, userId) => {
    try {
      const res = await axios.post('/api/admin/free-slot-hall', {
        hallName,
        date: selectedDate,
        startTime,
        endTime,
        userId
      });
      alert(res.data.message || 'Slot freed successfully');
      const usageRes = await axios.get('/api/admin/usage-status', { params: { date: selectedDate } });
      setFacilityUsage(usageRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to free the slot');
    }
  };

  if (loading) return <div>Loading...</div>;

  const hallSlots = generateTimeSlots();

  function isFutureOrToday(dateStr, slotStartTime) {
    dateStr = `${dateStr}T${slotStartTime}:00`;
    const dateStrObj = new Date(dateStr);
    const now = new Date();
    return dateStrObj >= now;
  }

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: '#f5f5dc', width: '100vw', boxSizing: 'border-box' }}>
      <Banner />
      <Sidebar />
      <h2 style={{ paddingTop: 96, marginBottom: 20, color: '#1a237e', letterSpacing: 1, fontWeight: 700, textAlign: 'center' }}>
        Admin Dashboard - Facility Usage
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%' }}>
        {facilities.map(facility => {
          const { name, type } = facility;
          const usageData = facilityUsage[name] || { name, type, usage: [] };
          const { usage } = usageData;
          const bgColor = typeColors[type] || '#f9f9f9';
          const borderColor = borderColors[type] || '#ccc';
          const timeSlots = type === 'hall' ? hallSlots : periods;

          return (
            <div
              key={name}
              style={{
                background: bgColor,
                border: `2.5px solid ${borderColor}`,
                borderRadius: 18,
                padding: 20,
                width: '100%',
                boxShadow: '0 4px 16px rgb(224, 224, 224)'
              }}
            >
              <h3 style={{ color: borderColor, fontWeight: 600 }}>{name}</h3>
              <div style={{ marginBottom: 8 }}>
                <span style={{ background: borderColor, color: '#fff', borderRadius: 8, padding: '4px 14px', fontSize: '1em', fontWeight: 500 }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              </div>
              <div style={{ fontWeight: 500, color: '#444', marginBottom: 6 }}>
                Usage:
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {timeSlots.map((slot, i) => {
                  const match = (usage || []).find(u => u.startTime <= slot.start && u.endTime >= slot.end);
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '15px 6px',
                        fontSize: 12,
                        background: match ? '#f8d7da' : 'rgb(146, 237, 123)',
                        borderRadius: 4,
                        minWidth: 100,
                        textAlign: 'center',
                        position: 'relative'
                      }}
                    >
                      {slot.start} - {slot.end} <br />
                      {match ? (type === 'hall' ? `${match.bookedBy}:${match.eventName}` : match.bookedBy) : 'Free'}

                      {match && isFutureOrToday(selectedDate, slot.start) && (
                        <button
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 10,
                            padding: '2px 6px',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            if (type === 'hall') {
                              handleFreeHall(name, slot.start, slot.end, match.bookedBy);
                            } else {
                              handleFreePeriod(name, type, match.periodNo, match.bookedBy);
                            }
                          }}
                        >
                          Free
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

export default Dashboard;
