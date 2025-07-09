import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';

export default function ProjectorListingPage() {
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

      const [allFacilitiesRes, bookingStatusRes] = await Promise.all([
        fetch('/api/facilities/projectors'),
        fetch(`/api/projectors?periodId=${periodId}`)
      ]);

      const allProjectors = await allFacilitiesRes.json();
      const projectorsBooked = await bookingStatusRes.json();

      const statusMap = new Map();
      projectorsBooked.forEach(p => statusMap.set(p.name.trim().toLowerCase(), true));

      const projectorStatus = allProjectors.map(proj => ({
        name: proj.name,
        type: proj.type,
        free: !statusMap.get(proj.name.trim().toLowerCase())
      }));

      setProjectors(projectorStatus);
    } catch (err) {
      console.error(err);
      setError('Could not fetch projectors');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!period) {
      alert('No period selected');
      navigate('/booking');
      return;
    }
    
    fetchProjectors();
    // eslint-disable-next-line
  }, [period?.periodId, user?.userId]);

  const handleBook = async (projector) => {
    if (!projector.free || !projector.name?.trim()) {
      alert('This projector is already booked or invalid name.');
      setLoading(true);
      await fetchProjectors();
      return;
    }

    try {
      const res = await fetch('/api/book-projector', {
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
        await fetchProjectors();
        return;
      }

      alert('The projector is booked');
      await fetchProjectors();
      navigate('/booking');
    } catch {
      alert('Booking failed');
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
      paddingTop: 96,
      minHeight: '100vh',
      minWidth: '100vw',
      background: 'linear-gradient(135deg, #f5f5dc 0%, #e3d9c6 100%)',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Banner />
      <Sidebar />
      <h2 style={{
        paddingTop: 96,
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
              background: projector.free === false ? '#f8d7da' : '#d4edda',
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
            <button
              onClick={() => handleBook(projector)}
              disabled={!projector.free}
              style={{
                background: projector.free ? '#7a5c1c' : '#bdbdbd',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.7rem 1.5rem',
                fontWeight: 600,
                fontSize: '1rem',
                marginTop: 8,
                cursor: projector.free ? 'pointer' : 'not-allowed'
              }}
            >
              {projector.free ? 'Book' : 'Occupied'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
