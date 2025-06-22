import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import ProjectorListingPage from './pages/ProjectorListingPage';
import RoomListingPage from './pages/RoomListingPage';
import HallListingPage from './pages/HallListingPage';
import AuditoriumRequest from './pages/AuditoriumRequest';
import LoginPage from './pages/LoginPage';
import Requestspage from './pages/Admin/Requestspage';
import Messages from './pages/Messages';
import Historypage from './pages/Admin/Historypage';
import Dashboard from './pages/Admin/Dashboard';
import FacultyBooking from './pages/FacultyBookingPage';
import EnrollmentPage from  './pages/Admin/EnrollmentPage';
import TimeTable from './pages/Admin/TimeTable';
import Facilities from './pages/Admin/Facilities';
import Register from './pages/Admin/Register';
function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }
);

  const handleLogin = (userData) => {
    setUser(userData);
    // localStorage.setItem('user', JSON.stringify(userData)); 
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<LoginPage onLogin={handleLogin} />}
        />
        <Route
          path="/*"
          element={
            user  ? (
              <Routes>
                <Route path="/home" element={<HomePage User={user} />} />
                <Route path="/booking" element={<BookingPage User={user} />} />
                <Route path="/projectorlisting" element={<ProjectorListingPage User={user}/>} />
                <Route path="/rooms" element={<RoomListingPage User={user} />} />
                <Route path="/halls" element={<HallListingPage User={user} />} />
                <Route path="/auditorium" element={<AuditoriumRequest User={user} />} />
                <Route path="/requests" element={<Requestspage User={user} />} />
                <Route path="/messages" element={<Messages User={user} />} />
                <Route path="/history" element={<Historypage User={user} />} />
                <Route path="dashboard" element={<Dashboard User={user} />} />
                <Route path="/facultyBooking" element={<FacultyBooking User={user} />} />
                <Route path="/enrollment" element={<EnrollmentPage User={user} />} />
                <Route path='/timetable' element={<TimeTable User={user} />} />
                <Route path='/facilities' element={<Facilities User={user} />} />
                <Route path='/register' element={<Register User={user} />} />
              </Routes>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;