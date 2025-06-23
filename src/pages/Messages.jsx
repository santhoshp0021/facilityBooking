import React, { useEffect, useState, useRef } from 'react';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import { jsPDF } from 'jspdf';
const Messages = ({User}) => {
  const [hallAccepted, setHallAccepted] = useState([]);
  const [hallRejected, setHallRejected] = useState([]);
  const [audiAccepted, setAudiAccepted] = useState([]);
  const [audiRejected, setAudiRejected] = useState([]);
  const [hallLoading, setHallLoading] = useState(true);
  const [audiLoading, setAudiLoading] = useState(true);
  const [error, setError] = useState('');
  const receiptRefs = useRef({});

  // Get current userId from localStorage
  const userId = JSON.parse(localStorage.getItem('user'))?.userId;
  const userRole = JSON.parse(localStorage.getItem('user'))?.role;

  // Fetch all accepted and rejected hall requests for this user
  useEffect(() => {
    if (!userId) {
      setError('User not logged in');
      setHallLoading(false);
      return;
    }
    setHallLoading(true);
    setError('');
    Promise.all([
      fetch(`http://localhost:5000/api/hall-requests?status=accepted&userId=${encodeURIComponent(userId)}`)
        .then(async res => {
          if (!res.ok) return [];
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        }),
      fetch(`http://localhost:5000/api/hall-requests?status=rejected&userId=${encodeURIComponent(userId)}`)
        .then(async res => {
          if (!res.ok) return [];
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        })
    ])
      .then(([hallAcceptedData, hallRejectedData]) => {
        setHallAccepted(hallAcceptedData);
        setHallRejected(hallRejectedData);
        setHallLoading(false);
      })
      .catch(() => {
        setError('Could not connect to backend');
        setHallAccepted([]);
        setHallRejected([]);
        setHallLoading(false);
      });
      Promise.all([
        fetch(`http://localhost:5000/api/audi-requests?status=accepted&userId=${encodeURIComponent(userId)}`)
          .then(async res => {
            if (!res.ok) return [];
            const text = await res.text();
            try {
              const data = JSON.parse(text);
              return Array.isArray(data) ? data : [];
            } catch {
              return [];
            }
          }),
        fetch(`http://localhost:5000/api/audi-requests?status=rejected&userId=${encodeURIComponent(userId)}`)
          .then(async res => {
            if (!res.ok) return [];
            const text = await res.text();
            try {
              const data = JSON.parse(text);
              return Array.isArray(data) ? data : [];
            } catch {
              return [];
            }
          })
      ])
        .then(([audiAcceptedData, audiRejectedData]) => {
          setAudiAccepted(audiAcceptedData);
          setAudiRejected(audiRejectedData);
          setAudiLoading(false);
        })
        .catch(() => {
          setError('Could not connect to backend');
          setAudiAccepted([]);
          setAudiRejected([]);
          setAudiLoading(false);
        });
  }, [userId]);

  // Download receipt as text file
  const handleHallDownload = (req) => {
    const content = `
      Hall Booking Receipt
      Hall: ${req.hallName}
      User: ${req.userId}
      Date: ${req.date}
      Time: ${req.startTime} - ${req.endTime}
      Status: ${req.status}
      Booked At: ${new Date(req.bookedAt).toLocaleString()}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HallReceipt_${req.hallName}_${req.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const handleAudiDownload = (req) => {
    const doc = new jsPDF();

  doc.setFontSize(12);
  doc.text("To,", 10, 20);
  doc.text("The Office Administration,", 10, 27);
  doc.text("College of Engineering Guindy", 10, 34);

  doc.text("Subject: Request for Auditorium Booking", 10, 50);
  doc.text("Respected Sir/Madam,", 10, 60);

  const body = `I, ${req.userId}, request your approval to use the ${req.venue} on ${req.date} 
from ${req.startTime} to ${req.endTime} for the event "${req.eventName}".`;

  doc.text(doc.splitTextToSize(body, 180), 10, 70);

  if (req.additionalInfo) {
    doc.text("Additional Information:", 10, 95);
    doc.text(doc.splitTextToSize(req.additionalInfo, 180), 10, 102);
  }

  doc.text("Thank you for your consideration.", 10, 125);
  doc.text(`Sincerely,\n${req.userId}`, 10, 135);

  doc.text(`\n\nStatus: ${req.status}`, 10, 160);
  doc.text(`Booked At: ${new Date(req.bookedAt).toLocaleString()}`, 10, 170);

  const fileName = `AuditoriumBooking_${req.venue}_${req.date}.pdf`;
  doc.save(fileName);
};

  return (
    <div style={{
      
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
        color: '#388e3c',
        fontSize: '2rem',
        margin: '2rem 0 1.5rem 0',
        letterSpacing: 1
      }}>
        Accepted Hall Bookings
      </h2>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(56,142,60,0.10)',
        padding: 24,
        width: '100%',
        maxWidth: 900,
        marginBottom: 40
      }}>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {hallLoading && audiLoading&&<div>Loading...</div>}
        {!hallLoading && !error && hallAccepted.length === 0 && (
          <div style={{ color: '#388e3c', fontWeight: 500 }}>No accepted hall bookings found.</div>
        )}
        {!hallLoading && !error && hallAccepted.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
            {hallAccepted.map(req => (
              <div
                key={req._id}
                ref={el => receiptRefs.current[req._id] = el}
                style={{
                  background: '#e8f5e9',
                  border: '2px solid #388e3c',
                  borderRadius: 14,
                  minWidth: 280,
                  maxWidth: 340,
                  padding: '1rem',
                  marginBottom: 24,
                  boxShadow: '0 4px 16px rgba(56,142,60,0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: '#388e3c',
                  marginBottom: 10,
                  textAlign: 'center'
                }}>
                  Booking Confirmed!
                </div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  <span style={{ color: '#2e7d32' }}>Hall:</span> {req.hallName}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Date:</span> {req.date}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Event:</span> {req.eventName}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Time:</span> {req.startTime} - {req.endTime}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Booked By:</span> {req.userId}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Status:</span> <span style={{ color: '#388e3c', fontWeight: 600 }}>{req.status}</span>
                </div>
                <div style={{ marginBottom: 8, fontSize: '0.95rem', color: '#555' }}>
                  <span>Booked At:</span> {new Date(req.bookedAt).toLocaleString()}
                </div>
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
                    marginTop: 10
                  }}
                  onClick={() => handleHallDownload(req)}
                >
                  Download Receipt
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <h2 style={{
        color: '#b71c1c',
        fontSize: '2rem',
        margin: '1rem 0 1.5rem 0',
        letterSpacing: 1
      }}>
        Rejected Hall Bookings
      </h2>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(183,28,28,0.10)',
        padding: 24,
        width: '100%',
        maxWidth: 900
      }}>
        {!hallLoading && !error && hallRejected.length === 0 && (
          <div style={{ color: '#b71c1c', fontWeight: 500 }}>No rejected hall bookings found.</div>
        )}
        {!hallLoading && !error && hallRejected.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
            {hallRejected.map(req => (
              <div
                key={req._id}
                style={{
                  background: '#ffebee',
                  border: '2px solid #b71c1c',
                  borderRadius: 14,
                  minWidth: 280,
                  maxWidth: 340,
                  padding: '1rem',
                  marginBottom: 24,
                  boxShadow: '0 4px 16px rgba(183,28,28,0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: '#b71c1c',
                  marginBottom: 10,
                  textAlign: 'center'
                }}>
                  Booking Rejected
                </div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  <span style={{ color: '#b71c1c' }}>Hall:</span> {req.hallName}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#b71c1c' }}>Date:</span> {req.date}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#b71c1c' }}>Time:</span> {req.startTime} - {req.endTime}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#b71c1c' }}>Booked By:</span> {req.userId}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#b71c1c' }}>Status:</span> <span style={{ color: '#b71c1c', fontWeight: 600 }}>{req.status}</span>
                </div>
                <div style={{ marginBottom: 8, fontSize: '0.95rem', color: '#555' }}>
                  <span>Booked At:</span> {new Date(req.bookedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {userRole==='secretary'&&(<div>
        <h2 style={{
          paddingTop:96,
          color: '#388e3c',
          fontSize: '2rem',
          margin: '2rem 0 1.5rem 0',
          letterSpacing: 1
        }}>
          Accepted Audi Bookings
        </h2>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(56,142,60,0.10)',
          padding: 24,
          width: '100%',
          maxWidth: 900,
          marginBottom: 40
        }}>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        
        {!audiLoading && !error && audiAccepted.length === 0 && (
          <div style={{ color: '#388e3c', fontWeight: 500 }}>No accepted audi bookings found.</div>
        )}
        {!audiLoading && !error && audiAccepted.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
            {audiAccepted.map(req => (
              <div
                key={req._id}
                ref={el => receiptRefs.current[req._id] = el}
                style={{
                  background: '#e8f5e9',
                  border: '2px solid #388e3c',
                  borderRadius: 14,
                  minWidth: 280,
                  maxWidth: 340,
                  padding: '1rem',
                  marginBottom: 24,
                  boxShadow: '0 4px 16px rgba(56,142,60,0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: '#388e3c',
                  marginBottom: 10,
                  textAlign: 'center'
                }}>
                  Booking Confirmed!
                </div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  <span style={{ color: '#2e7d32' }}>Venue:</span> {req.venue}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Date:</span> {req.date}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Time:</span> {req.startTime} - {req.endTime}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Event:</span> {req.eventName}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Booked By:</span> {req.userId}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#2e7d32' }}>Status:</span> <span style={{ color: '#388e3c', fontWeight: 600 }}>{req.status}</span>
                </div>
                <div style={{ marginBottom: 8, fontSize: '0.95rem', color: '#555' }}>
                  <span>Booked At:</span> {new Date(req.bookedAt).toLocaleString()}
                </div>
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
                    marginTop: 10
                  }}
                  onClick={() => handleAudiDownload(req)}
                >
                  Download Letter
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <h2 style={{
        color: '#b71c1c',
        fontSize: '2rem',
        margin: '1rem 0 1.5rem 0',
        letterSpacing: 1
      }}>
        Rejected Audi Bookings
      </h2>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(183,28,28,0.10)',
        padding: 24,
        width: '100%',
        maxWidth: 900
      }}>
     
        {!audiLoading && !error && audiRejected.length === 0 && (
          <div style={{ color: '#b71c1c', fontWeight: 500 }}>No rejected audi bookings found.</div>
        )}
        {!audiLoading && !error && audiRejected.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center' }}>
            {audiRejected.map(req => (
              <div
                key={req._id}
                style={{
                  background: '#ffebee',
                  border: '2px solid #b71c1c',
                  borderRadius: 14,
                  minWidth: 280,
                  maxWidth: 340,
                  padding: '1rem',
                  marginBottom: 24,
                  boxShadow: '0 4px 16px rgba(183,28,28,0.10)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: '#b71c1c',
                  marginBottom: 10,
                  textAlign: 'center'
                }}>
                  Booking Rejected
                </div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>
                  <span style={{ color: '#b71c1c' }}>Venue</span> {req.venue}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#b71c1c' }}>Date:</span> {req.date}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#b71c1c' }}>Time:</span> {req.startTime} - {req.endTime}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#b71c1c' }}>Event:</span> {req.eventName}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#b71c1c' }}>Booked By:</span> {req.userId}
                </div>
                
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#b71c1c' }}>Status:</span> <span style={{ color: '#b71c1c', fontWeight: 600 }}>{req.status}</span>
                </div>
                <div style={{ marginBottom: 8, fontSize: '0.95rem', color: '#555' }}>
                  <span>Booked At:</span> {new Date(req.bookedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>)}
    </div>
  );
};

export default Messages;
