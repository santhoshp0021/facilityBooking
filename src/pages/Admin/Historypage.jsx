import React, { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';

const getPeriodInfo = (periodId) => {
  // periodId format: "dayNo-periodNo" (e.g., "3-5")
  if (!periodId) return { periodNo: '', periodDay: '' };
  const [no,day] = periodId.split('-');
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return {
    periodNo: no || '',
    periodDay: days[parseInt(day, 10)] || ''
  };
};

const Historypage = ({User}) => {
  const [history, setHistory] = useState([]);
  const [hallRequests, setHallRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hallReqLoading, setHallReqLoading] = useState(true);
  const [hallReqError, setHallReqError] = useState('');

  // New: filter state
  const [hallNameFilter, setHallNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  // New: booking history filters
  const [facilityNameFilter, setFacilityNameFilter] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');

  // Fetch booking history with filters
  useEffect(() => {
    setLoading(true);
    setError('');
    // Build query string
    const params = [];
    if (facilityNameFilter) params.push(`facilityName=${encodeURIComponent(facilityNameFilter)}`);
    if (bookingDateFilter) params.push(`date=${encodeURIComponent(bookingDateFilter)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    fetch(`http://localhost:5000/api/booking-history${query}`)
      .then(async res => {
        if (!res.ok) {
          setError('Failed to fetch booking history');
          setHistory([]);
          setLoading(false);
          return;
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setHistory(Array.isArray(data) ? data : []);
        } catch {
          setError('Invalid response from server');
          setHistory([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not connect to backend');
        setHistory([]);
        setLoading(false);
      });
  }, [facilityNameFilter, bookingDateFilter]);

  // Fetch hall requests with filters
  useEffect(() => {
    setHallReqLoading(true);
    setHallReqError('');
    // Build query string
    const params = [];
    if (hallNameFilter) params.push(`hallName=${encodeURIComponent(hallNameFilter)}`);
    if (dateFilter) params.push(`date=${encodeURIComponent(dateFilter)}`);
    const query = params.length ? `?${params.join('&')}` : '';
    fetch(`http://localhost:5000/api/hall-requests/filter${query}`)
      .then(async res => {
        if (!res.ok) {
          setHallReqError('Failed to fetch hall requests');
          setHallRequests([]);
          setHallReqLoading(false);
          return;
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setHallRequests(Array.isArray(data) ? data : []);
        } catch {
          setHallReqError('Invalid response from server');
          setHallRequests([]);
        }
        setHallReqLoading(false);
      })
      .catch(() => {
        setHallReqError('Could not connect to backend');
        setHallRequests([]);
        setHallReqLoading(false);
      });
  }, [hallNameFilter, dateFilter]);

  // Download booking history as CSV
  const handleDownload = () => {
    const header = ['User', 'Period ID', 'Period Day', 'Period No', 'Facility Name', 'Facility Type', 'Booked/Free', 'Date'];
    const rows = history.map(rec => {
      const { periodNo, periodDay } = getPeriodInfo(rec.periodId);
      return [
        rec.userId?.userId || rec.userId || '',
        rec.periodId,
        periodDay,
        periodNo,
        rec.facility?.name || '',
        rec.facility?.type || '',
        rec.facility?.free === false ? 'Booked' : 'Freed',
        rec.date ? new Date(rec.date).toLocaleString() : ''
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'booking_history.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download hall requests as CSV
  const handleDownloadHallRequests = () => {
    const header = ['User', 'Hall Name', 'Date', 'Start Time', 'End Time', 'Status', 'Booked At'];
    const rows = hallRequests.map(req => [
      req.userId,
      req.hallName,
      req.date,
      req.startTime,
      req.endTime,
      req.status,
      req.bookedAt ? new Date(req.bookedAt).toLocaleString() : ''
    ].join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hall_requests.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      paddingTop:96,
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
        Booking History
      </h2>
      {/* Booking History Filter UI */}
      <div style={{ marginBottom: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Filter by Facility Name"
          value={facilityNameFilter}
          onChange={e => setFacilityNameFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: 6,
            border: '1px solid #e3d9c6',
            fontSize: '1rem'
          }}
        />
        <input
          type="date"
          value={bookingDateFilter}
          onChange={e => setBookingDateFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: 6,
            border: '1px solid #e3d9c6',
            fontSize: '1rem'
          }}
        />
        <button
          style={{
            background: '#b6894a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5rem 1.2rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer'
          }}
          onClick={() => { setFacilityNameFilter(''); setBookingDateFilter(''); }}
        >
          Clear Filters
        </button>
      </div>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(182,137,74,0.10)',
        padding: 24,
        width: '100%',
        maxWidth: 1100,
        marginBottom: 40
      }}>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {loading && <div>Loading...</div>}
        {!loading && !error && history.length === 0 && <div>No booking history found.</div>}
        {!loading && !error && history.length > 0 && (
          <>
            <button
              style={{
                background: '#388e3c',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.6rem 1.4rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1rem',
                marginBottom: 18
              }}
              onClick={handleDownload}
            >
              Download Table
            </button>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '1rem'
            }}>
              <thead>
                <tr style={{ background: '#e3d9c6' }}>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>User</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Period ID</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Period Day</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Period No</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Facility Name</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Facility Type</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Booked/Free</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((rec, idx) => {
                  const { periodNo, periodDay } = getPeriodInfo(rec.periodId);
                  return (
                    <tr key={rec._id || idx} style={{ background: '#fffbe6' }}>
                      <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{rec.userId?.userId || rec.userId || ''}</td>
                      <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{rec.periodId}</td>
                      <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{periodDay}</td>
                      <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{periodNo}</td>
                      <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{rec.facility?.name || ''}</td>
                      <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{rec.facility?.type || ''}</td>
                      <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{rec.facility?.free === false ? 'Booked' : 'Freed'}</td>
                      <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{rec.date ? new Date(rec.date).toLocaleString() : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
      <h2 style={{
        color: '#7a5c1c',
        fontSize: '2rem',
        margin: '2rem 0 1.5rem 0',
        letterSpacing: 1
      }}>
        Hall Requests
      </h2>
      {/* Filter UI */}
      <div style={{ marginBottom: 18, display: 'flex', gap: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Filter by Hall Name"
          value={hallNameFilter}
          onChange={e => setHallNameFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: 6,
            border: '1px solid #e3d9c6',
            fontSize: '1rem'
          }}
        />
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={{
            padding: '0.5rem',
            borderRadius: 6,
            border: '1px solid #e3d9c6',
            fontSize: '1rem'
          }}
        />
        <button
          style={{
            background: '#b6894a',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.5rem 1.2rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer'
          }}
          onClick={() => { setHallNameFilter(''); setDateFilter(''); }}
        >
          Clear Filters
        </button>
      </div>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(182,137,74,0.10)',
        padding: 24,
        width: '100%',
        maxWidth: 1100
      }}>
        {hallReqError && <div style={{ color: 'red', marginBottom: 16 }}>{hallReqError}</div>}
        {hallReqLoading && <div>Loading...</div>}
        {!hallReqLoading && !hallReqError && hallRequests.length === 0 && <div>No hall requests found.</div>}
        {!hallReqLoading && !hallReqError && hallRequests.length > 0 && (
          <>
            <button
              style={{
                background: '#388e3c',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.6rem 1.4rem',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1rem',
                marginBottom: 18
              }}
              onClick={handleDownloadHallRequests}
            >
              Download Table
            </button>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '1rem'
            }}>
              <thead>
                <tr style={{ background: '#e3d9c6' }}>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>User</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Hall Name</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Date</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Start Time</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>End Time</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Status</th>
                  <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Booked At</th>
                </tr>
              </thead>
              <tbody>
                {hallRequests.map((req, idx) => (
                  <tr key={req._id || idx} style={{ background: '#fffbe6' }}>
                    <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.userId}</td>
                    <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.hallName}</td>
                    <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.date}</td>
                    <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.startTime}</td>
                    <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.endTime}</td>
                    <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.status}</td>
                    <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.bookedAt ? new Date(req.bookedAt).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default Historypage;
