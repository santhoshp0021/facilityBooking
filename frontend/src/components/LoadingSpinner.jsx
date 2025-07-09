import React from 'react';

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 100
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: '4px solid #e3d9c6',
        borderTop: '4px solid #7a5c1c',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: 12
      }} />
      <div style={{ color: '#7a5c1c', fontWeight: 600 }}>{message}</div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </div>
  );
}