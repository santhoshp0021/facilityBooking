import { useState, useEffect } from 'react';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';

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

export default function HallListingPage() {
  const halls = [
    { name: 'RUSA Gallery' },
    { name: 'Turing Hall' }
  ];

  const userId = JSON.parse(localStorage.getItem('user'))?.userId || 'demoUser';
  const slots = generateTimeSlots();
  const dates = getNextWorkingDays();
  const today = dates[0] || '';

  const [selectedDate, setSelectedDate] = useState(today);
  const [hallBookings, setHallBookings] = useState({});
  const [selectedSlots, setSelectedSlots] = useState({});
  const [eventNames, setEventNames] = useState({});

  useEffect(() => {
    halls.forEach(hall => {
      fetchBookings(hall.name, selectedDate);
    });
  }, [selectedDate]);
 
  const fetchBookings = async (hallName, date) => {
    try {
      const res = await fetch(`http://localhost:5000/api/hall-requests/slots?hallName=${encodeURIComponent(hallName)}&date=${date}`);
      const data = await res.json();
      console.log(data);
      setHallBookings(prev => ({ ...prev, [hallName]: { ...prev[hallName], [date]: data } }));
    } catch {
      setHallBookings(prev => ({ ...prev, [hallName]: { ...prev[hallName], [date]: [] } }));
    }
  };

  const isSlotBooked = (hallName, date, slot) => {
    const bookings = hallBookings[hallName]?.[date] || [];
    return bookings.find(b =>  (b.startTime <= slot.start && b.endTime >= slot.start) || (b.startTime>=slot.start && b.endTime <= slot.end));
  };

  const handleSlotToggle = (hallName, slot) => {
    const key = hallName;
    const current = selectedSlots[key] || [];
    const index = current.findIndex(s => s.start === slot.start && s.end === slot.end);

    if (index > -1) {
      const updated = [...current.slice(0, index), ...current.slice(index + 1)];
      setSelectedSlots(prev => ({ ...prev, [key]: updated }));
    } else {
      const updated = [...current, slot].sort((a, b) => a.start.localeCompare(b.start));
      setSelectedSlots(prev => ({ ...prev, [key]: updated }));
    }
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
    if (!slots || slots.length === 0 || !eventName?.trim() || !areSlotsContinuous(slots)) {
      alert('Select continuous slots and provide event name.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/hall-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          hallName,
          date: selectedDate,
          startTime: slots[0].start,
          endTime: slots[slots.length - 1].end,
          eventName
        })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Booking failed');
      } else {
        alert(`${hallName} request sent for admin's approval ${selectedDate} ${slots[0].start} - ${slots[slots.length - 1].end}`);
        fetchBookings(hallName, selectedDate);
        setSelectedSlots(prev => ({ ...prev, [hallName]: [] }));
        setEventNames(prev => ({ ...prev, [hallName]: '' }));
      }
    } catch {
      alert('Error connecting to server');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'auto', background: '#f5f5dc', fontFamily: 'Segoe UI' }}>
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
                    onClick={() => { if (!booked) handleSlotToggle(hall.name, slot); }}
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
                <button
                  onClick={() => handleConfirmBooking(hall.name)}
                  disabled={!areSlotsContinuous(selectedSlots[hall.name]) || !(eventNames[hall.name] || '').trim()}
                  style={{
                    marginLeft: 12,
                    background: '#388e3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    cursor: 'pointer',
                    opacity: areSlotsContinuous(selectedSlots[hall.name]) && (eventNames[hall.name] || '').trim() ? 1 : 0.5
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
