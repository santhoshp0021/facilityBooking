import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Banner from '../components/Banner';
import Sidebar from '../components/Sidebar';

export default function RoomListingPage({User}) {
  const [rooms, setRooms] = useState([]);
  const [labs, setLabs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [bookingType, setBookingType] = useState(null); // 'room' or 'lab'
  const [bookingTarget, setBookingTarget] = useState(null); // room or lab object
  const navigate = useNavigate();
  const location = useLocation();
  // Get user and period from navigation state (preferred) or fallback to localStorage for user
  const period = location.state?.period;
  const user = location.state?.user || JSON.parse(localStorage.getItem('user'));

  // Fetch all room facilities from backend for this period
  const fetchRooms = () => {
    if (!period || !period.periodId) {
      setRooms([]);
      setLabs([]);
      return;
    }
    fetch(`http://localhost:5000/api/rooms?periodId=${period.periodId}`)
      .then(res => res.json())
      .then(data => {
        setRooms(data);
      });
    fetch(`http://localhost:5000/api/labs?periodId=${period.periodId}`)
      .then(res => res.json())
      .then(data => {
        setLabs(data);
      });
  };

  // Fetch enrolled courses for dropdown
  useEffect(() => {
    if (user && user.userId) {
      fetch(`http://localhost:5000/api/enrollment/courses?userId=${user.userId}`)
        .then(res => res.json())
        .then(data => setCourses(data || []));
    }
  }, [user]);

  useEffect(() => {
    fetchRooms();
  }, []);

  // Booking logic for rooms (now opens course selection modal)
  const handleBookRoom = (room) => {
    setBookingType('room');
    setBookingTarget(room);
  };

  // Booking logic for labs (now opens course selection modal)
  const handleBookLab = (lab) => {
    setBookingType('lab');
    setBookingTarget(lab);
  };

  // Confirm booking after course selection
  const handleConfirmBooking = async () => {
    if (!selectedCourse || !user || !user.userId || !period || !period.periodId) {
      alert('Please select a course.');
      return;
    }
    try {
      let url, body;
      if (bookingType === 'room') {
        url = 'http://localhost:5000/api/book-room';
        body = {
          userId: user.userId,
          periodId: period.periodId,
          roomName: bookingTarget.name,
          staffName: selectedCourse.staffName,
          courseCode: selectedCourse.courseCode
        };
      } else if (bookingType === 'lab') {
        url = 'http://localhost:5000/api/book-lab';
        body = {
          userId: user.userId,
          periodId: period.periodId,
          labName: bookingTarget.name,
          staffName: selectedCourse.staffName,
          courseCode: selectedCourse.courseCode
        };
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Booking failed');
      } else {
        alert(bookingType === 'room' ? 'Room booked!' : 'Lab booked!');
        setBookingType(null);
        setBookingTarget(null);
        setSelectedCourse(null);
        setTimeout(() => navigate('/booking'), 100);
      }
    } catch (err) {
      alert('Could not connect to backend.');
    }
  };

  // Freeing logic for rooms and labs
  const handleFree = async (room) => {
    if (room.free) {
      alert('Room is already free.');
      return;
    }
    // If room has no roomNo, treat as lab freeing
    if (!room.roomNo) {
      // Find the lab booked by this user for this period
      try {
        // Fetch weektable record to get lab name
        const res = await fetch(`http://localhost:5000/api/weektable/lab-booking?userId=${user.userId}&periodId=${period.periodId}`);
        if (!res.ok) {
          alert('Could not find lab booking for this user and period.');
          return;
        }
        const data = await res.json();
        const labName = data.lab;
        if (!labName) {
          alert('No lab booking found for this user and period.');
          return;
        }
        // Free the lab using labName and periodId
        const freeRes = await fetch(`http://localhost:5000/api/labs/free-by-name`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            labName,
            periodId: period.periodId,
            userId: user.userId
          })
        });
        if (!freeRes.ok) {
          alert('Failed to free the lab.');
          return;
        }
        alert('Lab freed!');
        fetchRooms();
      } catch (err) {
        alert('Error freeing lab.');
      }
      return;
    }
    // Normal room freeing
    await fetch(`http://localhost:5000/api/facilities/${room._id}/free`, { method: 'POST' });
    fetchRooms();
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
        Room & Lab Listing
      </h2>
      {/* Course selection modal */}
      {bookingType && bookingTarget && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.25)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: 12,
            minWidth: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <h3 style={{ marginBottom: 16 }}>
              Select Course for Booking
            </h3>
            <select
              style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', marginBottom: 16 }}
              value={selectedCourse ? selectedCourse.courseCode : ''}
              onChange={e => {
                const course = courses.find(c => c.courseCode === e.target.value);
                setSelectedCourse(course || null);
              }}
            >
              <option value="">-- Select Course --</option>
              {courses.map(course => (
                <option key={course.courseCode} value={course.courseCode}>
                  {course.courseCode} - {course.courseName} ({course.staffName})
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleConfirmBooking}
                style={{
                  background: '#7a5c1c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.7rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
                disabled={!selectedCourse}
              >
                Confirm Booking
              </button>
              <button
                onClick={() => {
                  setBookingType(null);
                  setBookingTarget(null);
                  setSelectedCourse(null);
                }}
                style={{
                  background: '#bdbdbd',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.7rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{
        display: 'flex',
        gap: 32,
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 1200
      }}>
        {/* Rooms */}
        {rooms.map(room => (
          <div
            key={'room-' + room.name}
            style={{
              padding: '2rem 2.5rem',
              background: room.free ? '#d4edda' : '#f8d7da',
              borderRadius: 16,
              minWidth: 200,
              minHeight: 160,
              textAlign: 'center',
              marginBottom: 24,
              boxShadow: '0 4px 16px rgba(182,137,74,0.12)',
              border: '2px solid #e3d9c6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'transform 0.15s, box-shadow 0.15s',
              cursor: 'pointer'
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
              {room.name}
            </div>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: 18,
              color: room.free ? '#388e3c' : '#b71c1c',
              fontWeight: 500
            }}>
              Status: {room.free ? 'Free' : 'Occupied'}
            </div>
            {room.free ? (
              <button
                onClick={() => handleBookRoom(room)}
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
                Book Room
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
        {/* Labs */}
        {labs.map(lab => (
          <div
            key={'lab-' + lab.name}
            style={{
              padding: '2rem 2.5rem',
              background: lab.free ? '#d4edda' : '#f8d7da',
              borderRadius: 16,
              minWidth: 200,
              minHeight: 160,
              textAlign: 'center',
              marginBottom: 24,
              boxShadow: '0 4px 16px rgba(182,137,74,0.12)',
              border: '2px solid #e3d9c6',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'transform 0.15s, box-shadow 0.15s',
              cursor: 'pointer'
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
              color: '#1c5c7a',
              marginBottom: 10
            }}>
              {lab.name}
            </div>
            <div style={{
              fontSize: '1.1rem',
              marginBottom: 18,
              color: lab.free ? '#388e3c' : '#b71c1c',
              fontWeight: 500
            }}>
              Status: {lab.free ? 'Free' : 'Occupied'}
            </div>
            {lab.free ? (
              <button
                onClick={() => handleBookLab(lab)}
                style={{
                  background: '#1c5c7a',
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
                Book Lab
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