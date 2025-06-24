import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger Icon */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed',
          top: 24,
          left: 24,
          zIndex: 1101,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0
        }}
        aria-label="Toggle Sidebar"
      >
        <div style={{
          width: 32,
          height: 4,
          background: '#b6894a',
          margin: '6px 0',
          borderRadius: 2,
          transition: '0.3s'
        }} />
        <div style={{
          width: 32,
          height: 4,
          background: '#b6894a',
          margin: '6px 0',
          borderRadius: 2,
          transition: '0.3s'
        }} />
        <div style={{
          width: 32,
          height: 4,
          background: '#b6894a',
          margin: '6px 0',
          borderRadius: 2,
          transition: '0.3s'
        }} />
      </button>

      {/* Sidebar */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: open ? 0 : -240,
          width: 220,
          height: '100vh',
          background: '#f5f5dc', // beige
          padding: '2rem 1rem',
          boxShadow: open ? '2px 0 16px rgba(182,137,74,0.15)' : 'none',
          transition: 'left 0.3s',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ fontWeight: 700, color: '#7a5c1c', fontSize: '1.3rem', marginBottom: '2rem', textAlign: 'center', letterSpacing: 1 }}>
          Menu
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}><li>
          <Link to="/home" onClick={() => setOpen(false)} style={linkStyle}>Home</Link>
          </li>
          {['secretary'].includes(user.role) && (
            <li>
              <Link to="/facilitywiseBooking" onClick={() => setOpen(false)} style={linkStyle}>Facilitywise Booking</Link>
              <Link to="/halls" onClick={() => setOpen(false)} style={linkStyle}>Halls</Link>
              <Link to="/auditorium" onClick={() => setOpen(false)} style={linkStyle}>Auditorium</Link>
              <Link to="/messages" onClick={() => setOpen(false)} style={linkStyle}>Messages</Link>
            </li>
          )}
          {['faculty'].includes(user.role) && (
            <li>
              <Link to="/periodwiseBooking" onClick={() => setOpen(false)} style={linkStyle}>PeriodwiseBooking</Link>
              <Link to="/facilitywiseBooking" onClick={() => setOpen(false)} style={linkStyle}>Facilitywise Booking</Link>
              <Link to="/halls" onClick={() => setOpen(false)} style={linkStyle}>Halls</Link>
              <Link to="/messages" onClick={() => setOpen(false)} style={linkStyle}>Messages</Link>
            </li>
          )}
          {user.role === 'student' && (
            <li>
              <Link to="/booking" onClick={() => setOpen(false)} style={linkStyle}>Bookings</Link>
            </li>
          )}

          {user.role === 'admin' && (
            <>
              <li>
                <Link to="/requests" onClick={() => setOpen(false)} style={linkStyle}>Requests</Link>
              </li>
              <li>
                <Link to="/history" onClick={() => setOpen(false)} style={linkStyle}>History</Link>
              </li>
              <li>
                <Link to="/dashboard" onClick={() => setOpen(false)} style={linkStyle}>Dashboard</Link>
              </li>
              <li>
                <Link to="/enrollment" onClick={() => setOpen(false)} style={linkStyle}>Enrollment</Link>
              </li>
                <li>
                <Link to="/timetable" onClick={() => setOpen(false)} style={linkStyle}>TimeTable</Link>
              </li>
              <li>
                <Link to="/register" onClick={() => setOpen(false)} style={linkStyle}>Register</Link>
              </li>
            </>
          )}
          <li>
            <Link to="/" onClick={() => {
              localStorage.removeItem('user');
              setOpen(false);
              }} style={linkStyle}>SignOut</Link>
          </li>
        </ul>
      </nav>
      {/* Overlay when sidebar is open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.15)',
            zIndex: 1099
          }}
        />
      )}
    </>
  );
}

const linkStyle = {
  display: 'block',
  padding: '0.75rem 1rem',
  color: '#7a5c1c',
  textDecoration: 'none',
  borderRadius: '8px',
  marginBottom: '0.5rem',
  fontWeight: 500,
  transition: 'background 0.2s, color 0.2s',
  fontSize: '1.08rem'
};