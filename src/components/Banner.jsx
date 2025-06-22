import logo from '../assets/logo.png';

export default function Banner() {
  return (
    <div
      style={{
        width: '100%',
        background: '#f5f5dc', // beige
        color: '#7a5c1c',
        padding: '1.5rem 2rem 1.5rem 70px', // left padding for sidebar/hamburger
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 12px rgba(210,180,140,0.08)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1100
      }}
    >
      <img src={logo} alt="Anna University Logo" style={{ height: 56, marginRight: 32 }} />
      <div>
        <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: 1 }}>Anna University</h1>
        <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
          Sardar Patel Road, Chennai - 600 025, Tamil Nadu
        </div>
      </div>
    </div>
  );
}