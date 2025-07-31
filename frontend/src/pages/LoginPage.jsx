import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError('Please enter both User ID and Password.');
      return;
    }
    setError('');
    try {
        const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed. Please try again.');
        return;
      }
      onLogin( data ); 
      localStorage.setItem('user', JSON.stringify({ 
        userId: data.userId, 
        role: data.role 
      }));
      
      navigate('/home');
    } catch (err) {
      setError('Unable to connect to server.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      minWidth: '100vw',
      background: 'linear-gradient(135deg, #f5f5dc 0%, #e3d9c6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff8e1',
          padding: '2.5rem 2rem',
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(182,137,74,0.12)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 320
        }}
      >
        <h2 style={{
          color: '#7a5c1c',
          marginBottom: '1.5rem',
          textAlign: 'center',
          letterSpacing: 1
        }}>
          Login
        </h2>
        <label style={{ marginBottom: 8, color: '#7a5c1c', fontWeight: 500 }}>
          User ID
        </label>
        <input
          type="text"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          style={{
            padding: '0.6rem',
            borderRadius: 6,
            border: '1px solid #e3d9c6',
            marginBottom: 16,
            fontSize: '1rem'
          }}
        />
        <label style={{ marginBottom: 8, color: '#7a5c1c', fontWeight: 500 }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            padding: '0.6rem',
            borderRadius: 6,
            border: '1px solid #e3d9c6',
            marginBottom: 20,
            fontSize: '1rem'
          }}
        />
        {error && (
          <div style={{ color: '#b71c1c', marginBottom: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          style={{
            background: '#7a5c1c',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0.7rem 1.5rem',
            fontWeight: 600,
            fontSize: '1.1rem',
            cursor: 'pointer',
            marginTop: 8
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}