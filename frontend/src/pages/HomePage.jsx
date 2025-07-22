import { useState } from 'react';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';
import ContributorsList from '../components/Contributors';

const SIDEBAR_WIDTH = 220;
const BANNER_HEIGHT = 96;

export default function HomePage({ User }) {
  const userId = User?.userId || '';
  const [sidebarOpen, setSidebarOpen] = useState(false); // <-- Shared sidebar state

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f5f5dc 0%, #e3d9c6 100%)',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        overflow: 'hidden'
      }}
    >
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} /> {/* Pass props */}
      <Banner
        style={{
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1100
        }}
      />
      <div
        style={{
          paddingTop: BANNER_HEIGHT,
          minHeight: `calc(100vh - ${BANNER_HEIGHT}px)`,
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          transition: 'width 0.3s'
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '18px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
            padding: '2.5rem 2.5rem 2rem 2.5rem',
            textAlign: 'center',
            maxWidth: 600,
            width: '100%',
            margin: '2.5rem auto 0 auto',
            fontSize: '2.2rem',
            color: '#7a5c1c',
            fontWeight: 600,
            textShadow: '0 2px 8px #e3d9c6',
            animation: 'fadeIn 1.2s'
          }}
        >
          <h2 style={{ paddingTop: 96, margin: 0, fontSize: '2.5rem', color: '#7a5c1c' }}>
            Welcome to Anna University Facility Booking System
          </h2>
          <p style={{ color: '#4b3f2a', fontSize: '1.2rem', marginTop: '1.5rem' }}>
            Book and manage <span style={{ color: "#b6894a", fontWeight: 600 }}>Rooms</span>,{' '}
            <span style={{ color: "#b6894a", fontWeight: 600 }}>Labs</span>,{' '}
            <span style={{ color: "#b6894a", fontWeight: 600 }}>Halls</span>, and{' '}
            <span style={{ color: "#b6894a", fontWeight: 600 }}>Projectors</span> with ease.
          </p>
        </div>
     <div
  style={{
    overflowX: 'auto',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  }}
>

          <ContributorsList sidebarOpen={sidebarOpen} />
        </div>
      </div>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(40px);}
            to { opacity: 1; transform: translateY(0);}
          }
        `}
      </style>
    </div>
  );
}
