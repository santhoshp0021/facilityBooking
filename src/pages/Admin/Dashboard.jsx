import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Banner from '../../components/Banner';

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
const statusStyle = status => ({
  color: status === 'booked' ? '#ea4335' : '#34a853',
  fontWeight: 'bold',
  fontSize: '1.1em'
});

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  let s = timeStr.trim();
  let match = s.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let [, hour, min] = match;
    return parseInt(hour, 10) * 60 + parseInt(min, 10);
  }
  return null;
}

const Dashboard = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);

  // Modal state for facility periods
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [facilityPeriods, setFacilityPeriods] = useState([]);

  useEffect(() => {
    const fetchCurrentStatus = async () => {
      setLoading(true);
      try {
        // 1. Get all periods for today
        const today = new Date();
        const dayNum = today.getDay(); // 0=Sunday, 1=Monday, ...
        const resPeriods = await axios.get('/api/periods-today'); // <-- You need to implement this endpoint if not present
        const periods = resPeriods.data;
        // 2. Find the period that overlaps with current time
        const nowMinutes = today.getHours() * 60 + today.getMinutes();
        let foundPeriod = null;
        for (const period of periods) {
          const startMin = parseTimeToMinutes(period.startTime);
          const endMin = parseTimeToMinutes(period.endTime);
          if (startMin !== null && endMin !== null && nowMinutes >= startMin && nowMinutes < endMin) {
            foundPeriod = period;
            break;
          }
        }
        setCurrentPeriod(foundPeriod);
        // 3. Fetch all facilities
        const facRes = await axios.get('/api/facilities');
        const allFacilities = facRes.data;
        // 4. If a period is found, fetch the booking for that periodId
        let booking = null;
        if (foundPeriod) {
          const bookingRes = await axios.get('/api/booking', { params: { periodId: foundPeriod.periodId } });
          booking = bookingRes.data;
        }
        setCurrentBooking(booking);
        // 5. Update facilities status
        let facStatus = allFacilities.map(fac => {
          let status = 'free', bookedBy = null, period = null;
          if (booking && booking.facilities) {
            const booked = booking.facilities.find(f => f.name === fac.name && f.type === fac.type && f.free === false);
            if (booked) {
              status = 'booked';
              bookedBy = booking.bookedBy || '-';
              period = foundPeriod ? { startTime: foundPeriod.startTime, endTime: foundPeriod.endTime } : null;
            }
          }
          return { ...fac, status, bookedBy, period };
        });
        setFacilities(facStatus);
      } catch (err) {
        setFacilities([]);
      }
      setLoading(false);
    };
    fetchCurrentStatus();
    const interval = setInterval(fetchCurrentStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handler for facility click: show today's periods for this facility
  const handleFacilityClick = async (fac) => {
    setSelectedFacility(fac);
    setShowModal(true);
    setFacilityPeriods([]); // reset
    try {
      const res = await axios.get('/api/facility-periods-today', {
        params: { facilityName: fac.name, type: fac.type }
      });
      setFacilityPeriods(res.data);
    } catch (err) {
      setFacilityPeriods([]);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFacility(null);
    setFacilityPeriods([]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: '#f5f5dc' }}>
      <Banner/>
      <Sidebar/>
      <h2 style={{ paddingTop:96,marginBottom: 32, color: '#1a237e', letterSpacing: 1, fontWeight: 700, textAlign: 'center' }}>
        Facility Booking Dashboard
      </h2>
      <div style={{ textAlign: 'center', marginBottom: 32, color: '#444', fontWeight: 500 }}>
        Showing current status of all facilities (auto-refreshes every minute)
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
        {facilities.map(fac => {
          const bgColor = typeColors[fac.type] || '#f9f9f9';
          const borderColor = borderColors[fac.type] || '#ccc';
          return (
            <div
              key={fac.name}
              style={{
                background: bgColor,
                border: `2.5px solid ${borderColor}`,
                borderRadius: 18,
                margin: 0,
                padding: 28,
                width: 270,
                minHeight: 160,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                boxShadow: '0 4px 16px #e0e0e0',
                transition: 'box-shadow 0.2s',
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => handleFacilityClick(fac)}
              title="Click to view today's periods"
            >
              <h3 style={{ margin: '0 0 12px 0', color: borderColor, fontWeight: 600, fontSize: '1.25em' }}>{fac.name}</h3>
              <div style={{ marginBottom: 10 }}>
                <span style={{ background: borderColor, color: '#fff', borderRadius: 8, padding: '4px 14px', fontSize: '1em', fontWeight: 500, letterSpacing: 0.5 }}>
                  {fac.type.charAt(0).toUpperCase() + fac.type.slice(1)}
                </span>
              </div>
              <div style={{ marginBottom: fac.status === 'booked' ? 10 : 0 }}>
                Status: <span style={statusStyle(fac.status)}>{fac.status}</span>
              </div>
              {fac.status === 'booked' && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: '#555', fontWeight: 500 }}>Time Period:</span>{' '}
                    <b>{fac.period ? `${fac.period.startTime} - ${fac.period.endTime}` : '-'}</b>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for facility periods */}
      {showModal && selectedFacility && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              minWidth: 360,
              maxWidth: 440,
              boxShadow: '0 8px 32px #888',
              position: 'relative',
              border: '1.5px solid #e0e0e0'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                background: 'transparent',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer',
                color: '#888'
              }}
              title="Close"
            >
              &times;
            </button>
            <h3 style={{ marginBottom: 18, color: '#22223b', fontWeight: 600 }}>
              {selectedFacility.name} - Today's Periods
            </h3>
            {facilityPeriods.length === 0 ? (
              <div style={{ color: '#888', fontStyle: 'italic' }}>
                No periods found for today.
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  background: '#f8fafc',
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px #e0e0e0'
                }}
              >
                <thead>
                  <tr style={{ background: '#e3e6f5' }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontWeight: 600,
                      color: '#333',
                      borderBottom: '2px solid #d1d5db'
                    }}>Period No</th>
                    <th style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      fontWeight: 600,
                      color: '#333',
                      borderBottom: '2px solid #d1d5db'
                    }}>Booked By</th>
                  </tr>
                </thead>
                <tbody>
                  {facilityPeriods.map((p, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 === 0 ? '#f9fafb' : '#f3f4f6',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 500,
                        color: '#22223b'
                      }}>{p.periodNo}</td>
                      <td style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid #e5e7eb',
                        color: p.bookedBy ? '#ea4335' : '#388e3c',
                        fontWeight: p.bookedBy ? 600 : 500
                      }}>
                        {p.bookedBy || <span style={{ color: '#388e3c', fontWeight: 500 }}>Free</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
                     