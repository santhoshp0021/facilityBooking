import logo from '../assets/logo.png';
import GuideMe from './GuideMe';

export default function Banner() {
  return (
    <div
      style={{
        width: '100%',
        background: '#f5f5dc',
        color: '#7a5c1c',
        padding: '1.5rem 2rem 1.5rem 70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(210,180,140,0.08)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1100,
        boxSizing: 'border-box'
      }}
    >
      {/* Left: Logo and Text */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={logo} alt="Anna University Logo" style={{ height: 56, marginRight: 32 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', letterSpacing: 1 }}>Anna University</h1>
          <div style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Sardar Patel Road, Chennai - 600 025, Tamil Nadu
          </div>
        </div>
      </div>

      {/* Right: GuideMe Button */}
      <div style={{ flexShrink: 0 }}>
        <GuideMe />
      </div>
    </div>
  );
}
