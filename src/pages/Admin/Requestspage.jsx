import React, { useEffect, useState } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';

const Requestspage = ({User}) => {
  const [hallRequests, setHallRequests] = useState([]);
  const [audiRequests, setAudiRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all pending hall requests
  const fetchRequests = () => {
    setLoading(true);
    setError('');
    fetch('http://localhost:5000/api/hall-requests?status=pending')
      .then(async res => {
        if (!res.ok) {
          setError('Failed to fetch requests');
          setHallRequests([]);
          setLoading(false);
          return;
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setHallRequests(Array.isArray(data) ? data : []);
        } catch {
          setError('Invalid response from server');
          setHallRequests([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not connect to backend');
        setHallRequests([]);
        setLoading(false);
      });
      fetch('http://localhost:5000/api/audi-requests?status=pending')
      .then(async res => {
        if (!res.ok) {
          setError('Failed to fetch requests');
          setAudiRequests([]);
          setLoading(false);
          return;
        }
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setAudiRequests(Array.isArray(data) ? data : []);
        } catch {
          setError('Invalid response from server');
          setAudiRequests([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Could not connect to backend');
        setAudiRequests([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Update status handler
  const handleHallStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/hall-requests/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchRequests();
  };
  const handleAudiStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/audi-requests/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchRequests();
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
        Pending Hall Requests
      </h2>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(182,137,74,0.10)',
        padding: 24,
        width: '100%',
        maxWidth: 900
      }}>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {loading && <div>Loading...</div>}
        {!loading && !error && hallRequests.length === 0 &&  audiRequests.length === 0 &&<div>No pending requests.</div>}
        {!loading && !error && hallRequests.length > 0 && (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '1rem'
          }}>
            <thead>
              <tr style={{ background: '#e3d9c6' }}>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Hall</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>User</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Date</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Event</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Time</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Status</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {hallRequests.map(req => (
                <tr key={req._id} style={{ background: '#fffbe6' }}>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.hallName}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.userId}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.date}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.eventName}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.startTime} - {req.endTime}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.status}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                    <button
                      style={{
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 18,
                        width: 36,
                        height: 36,
                        cursor: 'pointer',
                        marginRight: 8
                      }}
                      title="Accept"
                      onClick={() => handleHallStatus(req._id, 'accepted')}
                    >✔</button>
                    <button
                      style={{
                        background: '#e53935',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 18,
                        width: 36,
                        height: 36,
                        cursor: 'pointer'
                      }}
                      title="Reject"
                      onClick={() => handleHallStatus(req._id, 'rejected')}
                    >✖</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !error && audiRequests.length > 0 && (
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '1rem'
          }}>
            <thead>
              <tr style={{ background: '#e3d9c6' }}>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Auditorium</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>User</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Date</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Time</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>EventName</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Status</th>
                <th style={{ padding: 10, border: '1px solid #d1c4a3' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {audiRequests.map(req => (
                <tr key={req._id} style={{ background: '#fffbe6' }}>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.venue}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.userId}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.date}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.startTime} - {req.endTime}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.eventName}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>{req.status}</td>
                  <td style={{ padding: 10, border: '1px solid #e3d9c6' }}>
                    <button
                      style={{
                        background: '#4caf50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 18,
                        width: 36,
                        height: 36,
                        cursor: 'pointer',
                        marginRight: 8
                      }}
                      title="Accept"
                      onClick={() => handleAudiStatus(req._id, 'accepted')}
                    >✔</button>
                    <button
                      style={{
                        background: '#e53935',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 18,
                        width: 36,
                        height: 36,
                        cursor: 'pointer'
                      }}
                      title="Reject"
                      onClick={() => handleAudiStatus(req._id, 'rejected')}
                    >✖</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  );
};

export default Requestspage;
