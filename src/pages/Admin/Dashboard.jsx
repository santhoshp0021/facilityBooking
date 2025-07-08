import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Banner from '../../components/Banner';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

function formatDateLocal(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const Dashboard = () => {
  const [dateList, setDateList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [facilityUsage, setFacilityUsage] = useState({});
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await axios.get('/api/admin/available-week-dates');
        setDateList(res.data);
        const todayStr = formatDateLocal(new Date());
        const todayExists = res.data.includes(todayStr);
        const initialDate = todayExists ? todayStr : res.data[0];
        setSelectedDate(new Date(initialDate));
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
        setFilteredFacilities(res.data);
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
        const res = await axios.get('/api/admin/usage-status', {
          params: { date: formatDateLocal(selectedDate) }
        });
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
      await axios.post('/api/admin/free-slot-period', {
        facilityName, type, date: formatDateLocal(selectedDate), periodNo, userId
      });
      const usageRes = await axios.get('/api/admin/usage-status', {
        params: { date: formatDateLocal(selectedDate) }
      });
      setFacilityUsage(usageRes.data);
      alert('Slot freed successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to free the slot');
    }
  };

  const handleFreeHall = async (hallName, startTime, endTime, userId) => {
    try {
      await axios.post('/api/admin/free-slot-hall', {
        hallName, date: formatDateLocal(selectedDate), startTime, endTime, userId
      });
      const usageRes = await axios.get('/api/admin/usage-status', {
        params: { date: formatDateLocal(selectedDate) }
      });
      setFacilityUsage(usageRes.data);
      alert('Slot freed successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to free the slot');
    }
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    let filtered = [];

    if (value === 'kp') {
      filtered = facilities.filter(f => f.type === 'room' && f.name.startsWith('KP'));
    } else if (value === 'dept') {
      filtered = facilities.filter(f => f.type === 'room' && !f.name.startsWith('KP'));
    } else if (value === 'lab') {
      filtered = facilities.filter(f => f.type === 'lab');
    } else if (value === 'projector') {
      filtered = facilities.filter(f => f.type === 'projector');
    } else if (value === 'hall') {
      filtered = facilities.filter(f => f.type === 'hall');
    } else {
      filtered = facilities;
    }

    setFilteredFacilities(filtered);
  };

  if (loading || !selectedDate) return <div>Loading...</div>;

  const hallSlots = generateTimeSlots();
  const formattedDate = formatDateLocal(selectedDate);

  function isFutureOrToday(dateStr, slotStartTime) {
    const dateTime = new Date(`${dateStr}T${slotStartTime}:00`);
    const now = new Date();
    return dateTime >= now;
  }

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: '#f5f5dc', width: '100vw' }}>
      <Banner />
      <Sidebar />
      <h2 style={{ paddingTop: 96, marginBottom: 20, color: '#1a237e', fontWeight: 700, textAlign: 'center' }}>
        Admin Dashboard - Facility Usage
      </h2>

      {/* Calendar & Dropdown */}
      <div style={{ display: 'flex', alignItems: 'start', gap: 40, marginBottom: 30, paddingLeft: 16 }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Select Date:</label><br />
          <ReactDatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            includeDates={dateList.map(d => new Date(d))}
            inline
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold' }}>Facility Type:</label><br />
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value)}
            style={{ padding: 8, width: 200, marginTop: 8 }}
          >
            <option value="">All</option>
            <option value="kp">KP Room</option>
            <option value="dept">Department Room</option>
            <option value="lab">Lab</option>
            <option value="projector">Projector</option>
            <option value="hall">Hall</option>
          </select>
        </div>
      </div>

      {/* Facility Listing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {filteredFacilities.map(facility => {
          const { name, type } = facility;
          const usageData = facilityUsage[name] || { usage: [] };
          const usage = usageData.usage;
          const timeSlots = type === 'hall' ? hallSlots : periods;

          return (
            <div
              key={name}
              style={{
                background: typeColors[type],
                border: `2.5px solid ${borderColors[type]}`,
                borderRadius: 18,
                padding: 20,
                boxShadow: '0 4px 16px rgb(224, 224, 224)'
              }}
            >
              <h3 style={{ color: borderColors[type] }}>{name}</h3>
              <div style={{ fontWeight: 500, color: '#444', marginBottom: 6 }}>Usage:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {timeSlots.map((slot, i) => {
                  const match = usage.find(u => u.startTime <= slot.start && u.endTime >= slot.end);
                  return (
                    <div key={i} style={{
                      padding: '15px 6px',
                      fontSize: 12,
                      background: match ? '#f8d7da' : 'rgb(146, 237, 123)',
                      borderRadius: 4,
                      minWidth: 100,
                      textAlign: 'center',
                      position: 'relative'
                    }}>
                      {slot.start} - {slot.end}<br />
                      {match ? (type === 'hall' ? `${match.bookedBy}:${match.eventName}` : match.bookedBy) : 'Free'}

                      {match && isFutureOrToday(formattedDate, slot.start) && (
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
