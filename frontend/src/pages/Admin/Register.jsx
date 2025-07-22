import { useState } from 'react';
import Banner from '../../components/Banner';
import Sidebar from '../../components/Sidebar';

const SIDEBAR_WIDTH = 220;
const BANNER_HEIGHT = 96;

export default function Register() {
  const [form, setForm] = useState({
    userId: '',
    password: '',
    role: 'student_rep',
    email: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('User registered successfully!');
        setForm({ userId: '',  password: '', role: 'student', email:'' });
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (err) {
      setMessage('Server error');
    }
  };

  return (
    <>
      <div
        style={{
          minHeight: '10vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #f5f5dc 0%, #e3d9c6 100%)',
          fontFamily: 'Segoe UI, Arial, sans-serif',
          overflow: 'hidden'
        }}
      >
        <Sidebar  />
        <div style={{ marginLeft: SIDEBAR_WIDTH }}>
          <Banner />
        </div>
      </div>

      {/* Centering Container */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: `calc(100vh - ${BANNER_HEIGHT}px - 10vh)`,
        padding: '2rem',
        backgroundColor: '#f0f0f0'
      }}>
        <div>
          <h2 style={{ textAlign: 'center' }}>Register New User</h2>
          <form onSubmit={handleSubmit} className="register-form">
            <input type="text" name="userId" placeholder="User ID" value={form.userId} onChange={handleChange} required />
            <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <select name="role" value={form.role} onChange={handleChange} required>
              {/* <option value="student">Student</option> */}
              <option value="student_rep">Student Rep</option>
              <option value="faculty">Faculty</option>
              <option value="csea_member">CSEA Member</option>
            </select>
            <button type="submit">Register</button>
          </form>
          {message && <p className="message">{message}</p>}
        </div>

        <style>
          {`
            .register-form {
              max-width: 400px;
              display: flex;
              flex-direction: column;
              gap: 1rem;
              background: #f5f5f5;
              padding: 1.5rem;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              animation: fadeIn 0.5s ease-out;
            }

            .register-form input,
            .register-form select {
              padding: 0.6rem;
              border: 1px solid #ccc;
              border-radius: 4px;
              font-size: 1rem;
            }

            .register-form button {
              padding: 0.6rem;
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-weight: bold;
            }

            .register-form button:hover {
              background-color: #0056b3;
            }

            .message {
              margin-top: 1rem;
              font-weight: bold;
              color: green;
              text-align: center;
            }

            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(40px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </div>
    </>
  );
}
