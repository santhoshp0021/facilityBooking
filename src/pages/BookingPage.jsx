import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import Sidebar from '../components/Sidebar';
import Banner from '../components/Banner';

function getTodayDayNumber() {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 1 : jsDay > 5 ? 5 : jsDay;
}

export default function BookingPage({User}) {

  const user = JSON.parse(localStorage.getItem('user'));
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectorBookings, setProjectorBookings] = useState([]);
  const navigate = useNavigate();

  const today = new Date();
  const todayStr = today.toLocaleDateString();
  const todayDay = getTodayDayNumber();

  useEffect(() => {
    if (!user) return;
    async function fetchPeriods() {
      setLoading(true);
      try {
        // Always fetch periods from the weektable for the CURRENT logged-in userId
        const res = await fetch(
          `http://localhost:5000/api/weekperiod-details?userId=${user.userId}`
        );
        let data = await res.json();
        if (!Array.isArray(data)) data = [];
        // Use only this user's weektable for period details
        const todayPeriods = [];
        for (let i = 1; i <= 8; i++) {
          const found = data.find(
            p => p.day === todayDay && p.periodNo === i
          );
          if (found) {
            todayPeriods.push(found);
          } else {
            todayPeriods.push({
              periodNo: i,
              day: todayDay,
              periodId: `${todayDay}-${i}`,
              free: true,
              staffName: '',
              courseCode: '',
              roomNo: '',
              projector: false
            });
          }
        }
        setPeriods(todayPeriods);
      } catch {
        setPeriods(Array.from({ length: 8 }, (_, i) => ({
          periodNo: i + 1,
          day: todayDay,
          periodId: `${todayDay}-${i + 1}`,
          free: true,
          staffName: '',
          courseCode: '',
          roomNo: '',
          projector: false
        })));
      }
      setLoading(false);
    }
    fetchPeriods();
  }, [user?.userId, todayDay]);

  useEffect(() => {
    if (!user) return;
    async function fetchProjectorBookings() {
      try {
        const res = await fetch(
          `http://localhost:5000/api/projector-bookings?userId=${user.userId}`
        );
        if (res.ok) {
          const data = await res.json();
          // Now data is periods where projector is not empty string
          setProjectorBookings(data.map(b => b.periodId));
        } else {
          setProjectorBookings([]);
        }
      } catch {
        setProjectorBookings([]);
      }
    }
    fetchProjectorBookings();
  }, [user?.userId, todayDay]);

  const handleFree = async (period) => {
    setLoading(true);
    try {
      await fetch(`http://localhost:5000/api/free-period/${period.periodId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.userId })
      });
      const res = await fetch(
        `http://localhost:5000/api/weekperiod-details?userId=${user?.userId}`
      );
      const data = await res.json();
      setPeriods(data.filter(p => p.day === todayDay).sort((a, b) => a.periodNo - b.periodNo));
    } catch {
      setPeriods([]);
    }
    setLoading(false);
  };

  const handleBookProjector = (period) => {
    navigate('/projectorlisting', { state: { period } });
  };

  const handleBookPeriod = (period) => {
    // Pass both period and user in navigation state
    navigate('/rooms', { state: { period, user } });
  };

  function hasBookedProjector(periodId) {
    return projectorBookings.includes(periodId);
  }

  return (
    <div style={{
      paddingTop: 96,
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
        {todayStr}
      </h2>
      <h3 style={{
        color: '#7a5c1c',
        fontSize: '1.3rem',
        marginBottom: 24
      }}>
        Your Periods for Today
      </h3>
      
      {loading ? (
        <LoadingSpinner message="Loading your periods..." />
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          width: '100%',
          maxWidth: 900
        }}>
          {/* Chunk periods into rows of 4 */}
          {Array.from({ length: 2 }).map((_, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex', flexWrap: 'nowrap', gap: 18 }}>
              {periods.slice(rowIdx * 4, rowIdx * 4 + 4).map(period => (
                <div
                  key={period.periodNo}
                  style={{
                    flex: '1 0 21%',
                    background: period.free ? '#d4edda' : '#f8d7da',
                    border: period.free ? '2px solid #a5d6a7' : '2px solid #ef9a9a',
                    borderRadius: 12,
                    padding: '1.2rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    marginBottom: 6,
                    boxShadow: '0 2px 8px rgba(182,137,74,0.08)'
                  }}
                >
                  <div style={{
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    color: '#7a5c1c',
                    marginBottom: 6
                  }}>
                    Period {period.periodNo}
                  </div>
                  {period.free ? (
                    <div style={{ color: '#388e3c', marginBottom: 8, fontWeight: 500 }}>
                      Free
                    </div>
                  ) : (
                    <div style={{ color: '#b71c1c', marginBottom: 8, fontWeight: 500 }}>
                      Occupied
                    </div>
                  )}
                  {!period.free && (
                    <div style={{ marginBottom: 8 }}>
                      <div><b>Staff Name:</b> {period.staffName || '-'}</div>
                      <div><b>Course Code:</b> {period.courseCode || '-'}</div>
<div>
  <b>
    {period.roomNo
      ? 'Room No:'
      : period.lab
      ? 'Lab:'
      : 'Room No:'}
  </b>{' '}
  {period.roomNo || period.lab || '-'}
</div>                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {period.free ? (
                      <button
                        onClick={() => handleBookPeriod(period)}
                        style={{
                          background: '#7a5c1c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.5rem 1.2rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '1rem',
                          transition: 'background 0.15s'
                        }}
                      >
                        Book
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleFree(period)}
                          style={{
                            background: '#b6894a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            padding: '0.5rem 1.2rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '1rem',
                            transition: 'background 0.15s'
                          }}
                        >
                          Free
                        </button>
                        {!hasBookedProjector(period.periodId) && (
                          <button
                            onClick={() => handleBookProjector(period)}
                            style={{
                              background: '#388e3c',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '0.5rem 1.2rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '1rem',
                              transition: 'background 0.15s'
                            }}
                          >
                            Book Projector
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}