import { useState, useRef } from 'react';
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

  const [deleteForm, setDeleteForm] = useState({
    userId: ''
  });

  const [message, setMessage] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [mode, setMode] = useState('single');
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDeleteChange = (e) => {
    setDeleteForm({ ...deleteForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('User registered successfully!');
        setForm({ userId: '', password: '', role: 'student_rep', email: '' });
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (err) {
      setMessage('Server error');
    }
  };

  const handleBulkSubmit = async (e, endpoint) => {
    e.preventDefault();
    setMessage('');

    if (!bulkFile) {
      return setMessage('Please select an Excel file');
    }

    if (bulkFile.size > 2 * 1024 * 1024) {
      return setMessage('File size must be under 2MB');
    }

    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const res = await fetch(`http://localhost:5000/api/admin/${endpoint}`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`${data.affectedCount || data.deletedCount || data.insertedCount} users processed successfully.`);
        setBulkFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setMessage(data.message || 'Operation failed');
      }
    } catch (err) {
      setMessage('Server error');
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!deleteForm.userId) {
      return setMessage('Please enter User ID to delete.');
    }

    try {
      const res = await fetch('http://localhost:5000/api/admin/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deleteForm)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'User deleted successfully');
        setDeleteForm({ userId: '', email: '' });
      } else {
        setMessage(data.message || 'Deletion failed');
      }
    } catch (err) {
      setMessage('Server error');
    }
  };

  return (
    <>
      <div style={{
        minHeight: '10vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f5f5dc 0%, #e3d9c6 100%)',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        overflow: 'hidden'
      }}>
        <Sidebar />
        <div style={{ marginLeft: SIDEBAR_WIDTH }}>
          <Banner />
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: `calc(100vh - ${BANNER_HEIGHT}px - 10vh)`,
        padding: '2rem',
        backgroundColor: '#f0f0f0'
      }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button onClick={() => { setMode('single'); setBulkFile(null); }} disabled={mode === 'single'}>Register One by One</button>
            <button onClick={() => { setMode('bulk'); setForm({ userId: '', password: '', role: 'student_rep', email: '' }); }} disabled={mode === 'bulk'}>Bulk Register</button>
            <button onClick={() => { setMode('deleteSingle'); setMessage(''); }} disabled={mode === 'deleteSingle'}>Delete One</button>
            <button onClick={() => { setMode('deleteBulk'); setMessage(''); }} disabled={mode === 'deleteBulk'}>Bulk Delete</button>
          </div>

          {mode === 'single' && (
            <form onSubmit={handleSubmit} className="register-form">
              <input type="text" name="userId" placeholder="User ID" value={form.userId} onChange={handleChange} required />
              <input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required />
              <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
              <select name="role" value={form.role} onChange={handleChange} required>
                <option value="student_rep">Student Rep</option>
                <option value="faculty">Faculty</option>
                <option value="csea_member">CSEA Member</option>
              </select>
              <button type="submit">Register</button>
            </form>
          )}

          {mode === 'bulk' && (
            <form onSubmit={(e) => handleBulkSubmit(e, 'register/bulk')} className="register-form">
              <input type="file" accept=".xlsx" onChange={(e) => setBulkFile(e.target.files[0])} ref={fileInputRef} required />
              <button type="submit">Upload Excel File</button>
            </form>
          )}

          {mode === 'deleteSingle' && (
            <form onSubmit={handleDeleteSubmit} className="register-form">
              <input type="text" name="userId" placeholder="User ID" value={deleteForm.userId} onChange={handleDeleteChange} required/>
              <button type="submit">Delete User</button>
            </form>
          )}

          {mode === 'deleteBulk' && (
            <form onSubmit={(e) => handleBulkSubmit(e, 'delete/bulk')} className="register-form">
              <input type="file" accept=".xlsx" onChange={(e) => setBulkFile(e.target.files[0])} ref={fileInputRef} required />
              <button type="submit">Bulk Delete via Excel</button>
            </form>
          )}

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
