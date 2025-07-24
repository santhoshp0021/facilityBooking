import { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

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

function getNextWorkingDays(n = 20) {
  const days = [];
  const today = new Date();
  const dateCopy = new Date(today);
  while (days.length < n) {
    const day = dateCopy.getDay();
    if (day !== 0 && day !== 6) {
      const yyyy = dateCopy.getFullYear();
      const mm = String(dateCopy.getMonth() + 1).padStart(2, '0');
      const dd = String(dateCopy.getDate()).padStart(2, '0');
      days.push(`${yyyy}-${mm}-${dd}`);
    }
    dateCopy.setDate(dateCopy.getDate() + 1);
  }
  return days;
}

function isFutureOrToday(dateStr, slotStartTime) {
  const dateStrObj = new Date(`${dateStr}T${slotStartTime}:00`);
  return dateStrObj >= new Date();
}

export default function HallListingPage() {
  const [halls, setHalls] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [hallBookings, setHallBookings] = useState({});
  const [selectedSlots, setSelectedSlots] = useState({});
  const [eventNames, setEventNames] = useState({});
  const [pdfFiles, setPdfFiles] = useState({});
  const slots = generateTimeSlots();
  const dates = getNextWorkingDays();
  const userId = JSON.parse(localStorage.getItem('user'))?.userId || 'demoUser';

  useEffect(() => {
    setSelectedDate(dates[0] || '');
  }, []);

  useEffect(() => {
    const fetchHalls = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/allFacilities');
        const allowed = ['hall'];
        setHalls(res.data.filter(f => allowed.includes(f.type)));
      } catch {
        setHalls([]);
      }
    };
    fetchHalls();
  }, []);

  useEffect(() => {
    halls.forEach(hall => {
      fetchBookings(hall.name, selectedDate);
    });
  }, [selectedDate, halls]);

  const fetchBookings = async (hallName, date) => {
    try {
      const res = await fetch(`http://localhost:5000/api/hall-requests/slots?hallName=${encodeURIComponent(hallName)}&date=${date}`);
      const data = await res.json();
      setHallBookings(prev => ({ ...prev, [hallName]: { ...prev[hallName], [date]: data } }));
    } catch {
      setHallBookings(prev => ({ ...prev, [hallName]: { ...prev[hallName], [date]: [] } }));
    }
  };

  const handleFileChange = (hallName, file) => {
    setPdfFiles(prev => ({ ...prev, [hallName]: file }));
  };

  const isSlotBooked = (hallName, date, slot) => {
    const bookings = hallBookings[hallName]?.[date] || [];
    return bookings.find(b =>
      (b.startTime <= slot.start && b.endTime >= slot.start) ||
      (b.startTime >= slot.start && b.endTime <= slot.end)
    );
  };

  const handleSlotToggle = (hallName, slot) => {
    const key = hallName;
    const current = selectedSlots[key] || [];
    const index = current.findIndex(s => s.start === slot.start && s.end === slot.end);
    const updated = index > -1
      ? [...current.slice(0, index), ...current.slice(index + 1)]
      : [...current, slot].sort((a, b) => a.start.localeCompare(b.start));
    setSelectedSlots(prev => ({ ...prev, [key]: updated }));
  };

  const areSlotsContinuous = (slots) => {
    for (let i = 0; i < slots.length - 1; i++) {
      if (slots[i].end !== slots[i + 1].start) return false;
    }
    return true;
  };

  const handleConfirmBooking = async (hallName) => {
    const slots = selectedSlots[hallName];
    const eventName = eventNames[hallName];
    const pdfFile = pdfFiles[hallName];

    if (!slots || slots.length === 0 || !eventName?.trim() || !areSlotsContinuous(slots) || !pdfFile) {
      alert('Select continuous slots, provide event name, and upload a PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('hallName', hallName);
    formData.append('date', selectedDate);
    formData.append('startTime', slots[0].start);
    formData.append('endTime', slots[slots.length - 1].end);
    formData.append('eventName', eventName);
    formData.append('pdf', pdfFile);

    try {
      const res = await fetch('http://localhost:5000/api/hall-request', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Booking failed');
      } else {
        alert(`${hallName} request sent for ${selectedDate} ${slots[0].start} - ${slots[slots.length - 1].end}`);
        fetchBookings(hallName, selectedDate);
        setSelectedSlots(prev => ({ ...prev, [hallName]: [] }));
        setEventNames(prev => ({ ...prev, [hallName]: '' }));
        setPdfFiles(prev => ({ ...prev, [hallName]: null }));
      }
    } catch {
      alert('Error connecting to server');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'auto', background: '#f5f5dc' }}>
      <Banner />
      <Sidebar />
      <div style={{ paddingTop: 100, paddingLeft: 120, paddingRight: 20 }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: 10, marginBottom: 20 }}>
          {dates.map(date => (
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

        {halls.map(hall => (
          <div key={hall.name} style={{ marginBottom: 30 }}>
            <h3 style={{ color: '#7a5c1c' }}>{hall.name}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {slots.map(slot => {
                const booked = isSlotBooked(hall.name, selectedDate, slot);
                const isSelected = (selectedSlots[hall.name] || []).some(s => s.start === slot.start && s.end === slot.end);
                return (
                  <div
                    key={slot.start + '-' + slot.end}
                    onClick={() => !booked && isFutureOrToday(selectedDate, slot.start) && handleSlotToggle(hall.name, slot)}
                    style={{
                      background: booked ? 'rgb(212, 89, 51)' : isSelected ? '#a7dba7' : '#fff',
                      color: booked ? 'white' : 'black',
                      border: '1px solid #bba988',
                      fontSize: 12,
                      padding: '4px 8px',
                      borderRadius: 4,
                      cursor: booked ? 'not-allowed' : 'pointer',
                      minWidth: 100,
                      textAlign: 'center'
                    }}>
                    {slot.start}<br />
                    {booked ? `${booked.userId}:${booked.eventName}` : 'Free'}
                  </div>
                );
              })}
            </div>

            {(selectedSlots[hall.name] && selectedSlots[hall.name].length > 0) && (
              <div style={{ marginTop: 10 }}>
                <input
                  type="text"
                  placeholder="Event Name"
                  value={eventNames[hall.name] || ''}
                  onChange={e => setEventNames(prev => ({ ...prev, [hall.name]: e.target.value }))}
                  style={{ padding: '6px 10px', fontSize: '1rem', width: '40%' }}
                />
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => handleFileChange(hall.name, e.target.files[0])}
                  style={{ marginLeft: 12 }}
                />
                <button
                  onClick={() => handleConfirmBooking(hall.name)}
                  disabled={
                    !areSlotsContinuous(selectedSlots[hall.name]) ||
                    !(eventNames[hall.name] || '').trim() ||
                    !pdfFiles[hall.name]
                  }
                  style={{
                    marginLeft: 12,
                    background: '#388e3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    opacity: areSlotsContinuous(selectedSlots[hall.name]) && (eventNames[hall.name] || '').trim() && pdfFiles[hall.name] ? 1 : 0.5
                  }}
                >
                  Confirm Booking
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
