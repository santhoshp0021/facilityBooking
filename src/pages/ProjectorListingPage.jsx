import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';

const PROJECTOR_NAMES = ["Projector 1", "Projector 2", "Projector 3"];

export default function ProjectorListingPage({User}) {
  const [projectors, setProjectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const period = location.state?.period;
  const user = JSON.parse(localStorage.getItem('user'));

  async function fetchProjectors() {
    setError('');
    setLoading(true);
    try {
      const periodId = period?.periodId;
      if (!periodId) {
        setError('No period selected');
        setLoading(false);
        return;
      }
      const res = await fetch(`http://localhost:5000/api/projectors?periodId=${periodId}`);
      let projectorsFromBooking = [];
      if (res.ok) {
        const data = await res.json();
        projectorsFromBooking = Array.isArray(data)
          ? data.filter(f => f.type === 'projector')
          : [];
      } else {
        setError('Failed to fetch projectors');
        setLoading(false);
        return;
      }
      // Match ignoring spaces and case
      const projectorStatus = PROJECTOR_NAMES.map(name => {
        const fac = projectorsFromBooking.find(
          f => f.name && f.name.replace(/\s+/g, '').toLowerCase() === name.replace(/\s+/g, '').toLowerCase()
        );
        return fac ? fac : { name, type: 'projector', free: true };
      });
      setProjectors(projectorStatus);
    } catch (err) {
      setError('Could not fetch projectors');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!period){
      alert('No period selected');
      navigate('/booking');
      return;
    }
    if(!user) {
      alert('User not logged in.');
      navigate('/login');
      return;
    }
    fetchProjectors();
    // eslint-disable-next-line
  }, [period?.periodId, user?.userId]);

  const handleBook = async (projector) => {
    if (!projector.free || !projector.name || typeof projector.name !== 'string' || !projector.name.trim()) {
      alert('This projector is already booked or invalid projector name.');
      setLoading(true);
      await fetchProjectors();
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/book-projector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.userId,
          periodId: period.periodId,
          projectorName: projector.name.trim()
        })
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Booking failed');
        setLoading(true);
        await fetchProjectors();
        return;
      }
      alert('The projector is booked');
      setLoading(true);
      await fetchProjectors();
    } catch (e) {
      alert('Booking failed');
      setLoading(true);
      await fetchProjectors();
    }
  };

  if (loading) {
    return (
      <div style={{
       
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'linear-gradient(135deg, #f5f5dc 0%, #e3d9c6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        
        <LoadingSpinner message="Loading projectors..." />
      </div>
    );
  }
  if (error) {
    return <div style={{ marginTop: 60, color: 'red', fontSize: 18 }}>{error}</div>;
  }
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
        Projector Listing
      </h2>
      <div style={{
        display: 'flex',
        gap: 32,
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 1200
      }}>
        {projectors.map((projector) => (
          <div
            key={projector.name}
            style={{
              padding: '2rem 2.5rem',
              background: projector.free === false ? '#f8d7da' : '#d4edda', // red if occupied, green if free
              borderRadius: 16,
              minWidth: 220,
              minHeight: 180,
              textAlign: 'center',
              marginBottom: 24,
              boxShadow: '0 4px 16px rgba(182,137,74,0.12)',
              border: projector.free === false ? '2px solid #ef9a9a' : '2px solid #a5d6a7',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'transform 0.15s, box-shadow 0.15s',
              cursor: projector.free ? 'pointer' : 'not-allowed'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(182,137,74,0.18)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(182,137,74,0.12)';
            }}
          >
            <div style={{
              fontWeight: 600,
              fontSize: '1.3rem',
              color: '#7a5c1c',
              marginBottom: 10
            }}>
              {projector.name}
            </div>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: 18,
              color: projector.free === false ? '#b71c1c' : '#388e3c',
              fontWeight: 500
            }}>
              Status: {projector.free === false ? 'Occupied' : 'Free'}
            </div>
            {projector.free ? (
              <button
                onClick={() => handleBook(projector)}
                style={{
                  background: '#7a5c1c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.7rem 1.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem',
                  marginTop: 8,
                  transition: 'background 0.15s'
                }}
              >
                Book
              </button>
            ) : (
              <button
                disabled
                style={{
                  background: '#bdbdbd',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.7rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  marginTop: 8,
                  cursor: 'not-allowed'
                }}
              >
                Occupied
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}