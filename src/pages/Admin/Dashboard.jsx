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
  { start: '08:30', end: '09:25' },
  { start: '09:30', end: '10:15' },
  { start: '10:30', end: '11:25' },
  { start: '11:30', end: '12:15' },
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
  { name: 'Projector3', type: 'projector' },
  { name: 'RUSA Gallery', type: 'hall' },
  { name: 'Conference Hall', type: 'hall' },
  { name: 'Turing Hall', type: 'hall' }
];

const Dashboard = () => {
  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [facilityUsage, setFacilityUsage] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await axios.get('/api/admin/available-week-dates');
        setDateList(res.data);
        if (res.data.length > 0) setSelectedDate(res.data[0]);
      } catch {
        setDateList([]);
      }
    };
    fetchDates();
  }, []);
  useEffect(() => {
    console.log('Updated hallBookings:', facilityUsage);
    //console.log(hallBookings[hallName].date);
  }, [facilityUsage]);
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

  if (loading) return <div>Loading...</div>;

  const hallSlots = generateTimeSlots();

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: '#f5f5dc', width: '100vw', boxSizing: 'border-box' }}>
      <Banner />
      <Sidebar />
      <h2 style={{ paddingTop: 96, marginBottom: 20, color: '#1a237e', letterSpacing: 1, fontWeight: 700, textAlign: 'center' }}>
        Admin Dashboard - Facility Usage
      </h2>
      <div style={{ display: 'flex', overflowX: 'auto', gap: 10, padding: '8px 16px',whiteSpace: 'nowrap', marginBottom: 30 }}>
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
        {defaultFacilities.map(facility => {
          const { name, type } = facility;
          const usageData = facilityUsage[name] || { name, type, usage: [] };
          const { usage } = usageData;
          console.log(usage);
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
                boxShadow: '0 4px 16pxrgb(224, 224, 224)'
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
                    <div key={i} style={{ padding: '4px 6px', fontSize: 12, background: match ? '#f8d7da' : 'rgb(146, 237, 123)', borderRadius: 4, minWidth: 100, textAlign: 'center' }}>
                      {slot.start} - {slot.end} <br/> {match ? (type === 'hall' ? `${match.bookedBy}:${match.eventName}` : match.bookedBy) : 'Free'}
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