import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Banner from '../components/Banner';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

// ✅ Format date in local timezone (yyyy-mm-dd)
function formatDateLocal(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ✅ Convert yyyy-mm-dd string to Date object
const parseDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// ✅ Check if selected date & slot time is in future
function isFutureOrToday(dateStr, slotStartTime) {
  const dateTime = new Date(`${dateStr}T${slotStartTime}:00`);
  const now = new Date();
  return dateTime >= now;
}

const FacilityWiseBooking = () => {
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
        const res = await axios.get('http://localhost:5000/api/admin/available-week-dates');
        setDateList(res.data);
        const todayStr = formatDateLocal(new Date());
        const todayAvailable = res.data.includes(todayStr);
        const initialDate = todayAvailable ? todayStr : res.data[0];
        setSelectedDate(parseDate(initialDate));
      } catch {
        setDateList([]);
      }
    };
    fetchDates();
  }, []);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/allFacilities');
        const allowed = ['room', 'lab', 'projector'];
        const validFacilities = res.data.filter(f => allowed.includes(f.type));
        setFacilities(validFacilities);
        setFilteredFacilities(validFacilities);
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
        const formattedDate = formatDateLocal(selectedDate);
        const res = await axios.get('http://localhost:5000/api/admin/usage-status', {
          params: { date: formattedDate }
        });
        setFacilityUsage(res.data);
      } catch {
        setFacilityUsage({});
      }
      setLoading(false);
    };
    fetchUsage();
  }, [selectedDate]);

  const handleBook = async (facilityName, type, idx) => {
    const formattedDate = formatDateLocal(selectedDate);
    const payload = {
      date: formattedDate,
      slot: idx,
      facility: facilityName,
      type,
      userId: user.userId,
    };

    try {
      const response = await fetch("http://localhost:5000/api/faculty/facilities/book", {
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
      alert(`${facilityName} successfully booked for ${formattedDate} - Period ${idx + 1}`);
      window.location.reload();
    } catch (err) {
      console.error("Booking error:", err);
      alert("Booking failed. Try again.");
    }
  };

  const handleTypeChange = (value) => {
    setSelectedType(value);
    let filtered = [];

    if (value === "kp") {
      filtered = facilities.filter(f => f.type === 'room' && f.name.startsWith('KP'));
    } else if (value === "dept") {
      filtered = facilities.filter(f => f.type === 'room' && !f.name.startsWith('KP'));
    } else if (value === "lab") {
      filtered = facilities.filter(f => f.type === 'lab');
    } else if (value === "projector") {
      filtered = facilities.filter(f => f.type === 'projector');
    } else {
      filtered = facilities;
    }

    setFilteredFacilities(filtered);
  };

  const formattedSelectedDate = selectedDate ? formatDateLocal(selectedDate) : '';

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: '#f5f5dc', width: '100vw' }}>
      <Banner />
      <Sidebar />
      <h2 style={{ paddingTop: 96, marginBottom: 20, color: '#1a237e', textAlign: 'center' }}>
        Facility-wise Booking
      </h2>

      <div style={{ display: 'flex', alignItems: 'start', gap: 40, marginBottom: 30, paddingLeft: 16 }}>
        <div>
          <label style={{ fontWeight: 'bold' }}>Select Date:</label><br />
          <ReactDatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            includeDates={dateList.map(parseDate)}
            inline
            calendarStartDay={1}
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold' }}>Facility Type:</label><br />
          <select value={selectedType} onChange={e => handleTypeChange(e.target.value)} style={{ padding: 6, width: 200, marginTop: 8 }}>
            <option value="">All</option>
            <option value="kp">KP Room</option>
            <option value="dept">Department Room</option>
            <option value="lab">Lab</option>
            <option value="projector">Projector</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredFacilities.map((fac, index) => {
            const { name, type } = fac;
            const bgColor = typeColors[type] || '#f9f9f9';
            const borderColor = borderColors[type] || '#ccc';
            const usage = facilityUsage[name]?.usage || [];

            const label = type === 'room'
              ? name.startsWith('KP') ? 'KP Room' : 'Department Room'
              : type.charAt(0).toUpperCase() + type.slice(1);

            return (
              <div key={index} style={{ background: bgColor, border: `2px solid ${borderColor}`, borderRadius: 12, padding: 20, width: '70%' }}>
                <h3 style={{ color: borderColor, textAlign: 'Center' }}>{label} - {name}</h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {periods.map((p, idx) => {
                    const match = usage.find(u => u.periodNo === idx + 1);
                    return (
                      <div key={idx} style={{ padding: '6px 10px', background: match ? '#f8d7da' : '#e0f2f1', borderRadius: 6, minWidth: 100 }}>
                        Period {idx + 1}<br />
                        {p.start} - {p.end}<br />
                        {match ? match.bookedBy : 'Free'}<br />
                        {!match && isFutureOrToday(formattedSelectedDate, p.start) && (
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
      )}
    </div>
  );
};

export default FacilityWiseBooking;
