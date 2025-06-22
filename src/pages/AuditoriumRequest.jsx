import { useState } from 'react';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import { jsPDF } from 'jspdf';

const SIDEBAR_WIDTH = 220;

// Auditorium interfaces list
const auditoriumList = [
  { name: 'Vivekananda Auditorium', location: 'Block A', capacity: 500, features: ['AC', 'Projector', 'Sound System'] },
  { name: 'Tag Auditorium', location: 'Block B', capacity: 300, features: ['Projector', 'Sound System'] }
];

export default function AuditoriumRequest({ User }) {
  const userId = User?.userId || '';
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    eventName: '',
    venue: '',
    additionalInfo: '',
  });
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [selectedAuditorium, setSelectedAuditorium] = useState(null);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxDate = new Date(tomorrow);
  maxDate.setDate(maxDate.getDate() + 29);

  const formatDate = (date) => date.toISOString().split("T")[0];

  // When user clicks an auditorium interface
  const handleAuditoriumClick = (audi) => {
    setSelectedAuditorium(audi);
    setFormData(prev => ({
      ...prev,
      venue: audi.name
    }));
    setRequestSubmitted(false);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.endTime <= formData.startTime) {
      setError('End time must be after start time.');
      return;
    }

    try {
      setError('');
      // Example POST to your backend
      const res = await fetch('/api/audi-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userId }),
      });

      if (res.ok) {
        setRequestSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Submission failed');
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #f5f5dc 0%, #e3d9c6 100%)',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      overflow: 'hidden'
    }}>
      <Sidebar />
      <div style={{ marginLeft: SIDEBAR_WIDTH }}>
        <Banner style={{
          width: `calc(100vw - ${SIDEBAR_WIDTH}px)`,
          position: 'fixed',
          top: 0,
          left: SIDEBAR_WIDTH,
          zIndex: 1100
        }} />

        <div style={{ padding: '2rem', maxWidth: 700, margin: '0 auto', marginTop: 96 }}>
          <h2 style={{
            paddingTop: 96,
            color: '#7a5c1c',
            fontSize: '2rem',
            margin: '2rem 0 1.5rem 0',
            letterSpacing: 1
          }}>Auditorium Booking Request</h2>

          {/* Auditorium interfaces list */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ color: '#6d28d9', fontWeight: 600, marginBottom: 18 }}>Auditorium Interfaces</h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {auditoriumList.map(audi => (
                <div
                  key={audi.name}
                  style={{
                    background: selectedAuditorium?.name === audi.name ? '#ede9fe' : '#f3f4f6',
                    border: selectedAuditorium?.name === audi.name ? '2.5px solid #a78bfa' : '2px solid #ccc',
                    borderRadius: 14,
                    padding: 24,
                    minWidth: 260,
                    maxWidth: 320,
                    boxShadow: '0 2px 8px #e0e0e0',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                    marginBottom: 12
                  }}
                  onClick={() => handleAuditoriumClick(audi)}
                  title="Select this auditorium"
                >
                  <div style={{ fontWeight: 700, fontSize: '1.15em', color: '#5b21b6', marginBottom: 6 }}>{audi.name}</div>
                  <div style={{ color: '#444', marginBottom: 4 }}>
                    <b>Location:</b> {audi.location}
                  </div>
                  <div style={{ color: '#444', marginBottom: 4 }}>
                    <b>Capacity:</b> {audi.capacity}
                  </div>
                  <div style={{ color: '#444', marginBottom: 4 }}>
                    <b>Features:</b> {audi.features.join(', ')}
                  </div>
                  {selectedAuditorium?.name === audi.name && (
                    <div style={{ marginTop: 8, color: '#7c3aed', fontWeight: 500 }}>Selected</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Auditorium booking form */}
          {selectedAuditorium && !requestSubmitted ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#f8fafc', borderRadius: 10, padding: 24, boxShadow: '0 2px 8px #e0e0e0' }}>
              {error && <p style={{ color: 'red' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ flex: 1 }}>
                  Date:
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={formatDate(tomorrow)}
                    max={formatDate(maxDate)}
                    required
                    style={{ marginLeft: 8, padding: 5, borderRadius: 5, border: '1px solid #ccc' }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  Start Time:
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    style={{ marginLeft: 8, padding: 5, borderRadius: 5, border: '1px solid #ccc' }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  End Time:
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    style={{ marginLeft: 8, padding: 5, borderRadius: 5, border: '1px solid #ccc' }}
                  />
                </label>
              </div>

              <label>
                Event Name:
                <input
                  type="text"
                  name="eventName"
                  value={formData.eventName}
                  onChange={handleChange}
                  required
                  style={{ marginLeft: 8, padding: 5, borderRadius: 5, border: '1px solid #ccc', width: 220 }}
                  placeholder="Event Name"
                />
              </label>

              <label>
                Additional Information:
                <textarea
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleChange}
                  rows={3}
                  style={{ marginLeft: 8, padding: 5, borderRadius: 5, border: '1px solid #ccc', width: 220, minHeight: 40 }}
                  placeholder="Any extra details"
                />
              </label>

              <button style={{ color: 'white', background: '#6d28d9', fontWeight: 600, borderRadius: 6, padding: '8px 18px', border: 'none', marginTop: 8 }} type="submit">
                Submit Request
              </button>
            </form>
          ) : null}

          {requestSubmitted && (
            <div style={{ marginTop: '2rem', textAlign: 'center', backgroundColor: '#f0f0f0', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ color: 'green' }}>Booking Request Submitted!</h3>
              <p>Your request is awaiting <strong>HOD approval</strong>.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
