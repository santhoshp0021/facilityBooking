import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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
import EnrollmentPage from './pages/Admin/EnrollmentPage';
import TimeTable from './pages/Admin/TimeTable';
import Facilities from './pages/Admin/Facilities';
import Register from './pages/Admin/Register';
import FacilitywiseBooking from './pages/FacilitywiseBooking';

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    // localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage onLogin={handleLogin} />} />

        <Route
          path="/*"
          element={
            !user ? (
              <Navigate to="/" replace />
            ) : user.role === 'admin' ? (
              <Routes>
                <Route path="/home" element={<HomePage User={user} />} />
                <Route path="/history" element={<Historypage User={user} />} />
                <Route path="/dashboard" element={<Dashboard User={user} />} />
                <Route path="/requests" element={<Requestspage User={user} />} />
                <Route path="/facilities" element={<Facilities User={user} />} />
                <Route path="/register" element={<Register User={user} />} />
                <Route path="/timetable" element={<TimeTable User={user} />} />
              </Routes>
            ) : user.role === 'student_rep' ? (
              <Routes>
                <Route path="/home" element={<HomePage User={user} />} />
                <Route path="/booking" element={<BookingPage User={user} />} />
                <Route path="/projectorlisting" element={<ProjectorListingPage User={user} />} />
                <Route path="/rooms" element={<RoomListingPage User={user} />} />
              </Routes>
            ) : user.role === 'faculty' ? (
              <Routes>
                <Route path="/home" element={<HomePage User={user} />} />
                <Route path="/facilitywiseBooking" element={<FacilitywiseBooking User={user} />} />
                <Route path="/halls" element={<HallListingPage User={user} />} />
                <Route path="/messages" element={<Messages User={user} />} />
              </Routes>
            ) : user.role === 'csea_member' ? (
              <Routes>
                <Route path="/home" element={<HomePage User={user} />} />
                <Route path="/facilitywiseBooking" element={<FacilitywiseBooking User={user} />} />
                <Route path="/halls" element={<HallListingPage User={user} />} />
                <Route path="/auditorium" element={<AuditoriumRequest User={user} />} />
                <Route path="/messages" element={<Messages User={user} />} />
              </Routes>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
