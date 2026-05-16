import React, { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success' }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 2700);

    return () => clearTimeout(timer);
  }, []);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)',
          icon: '✓',
          accentColor: '#34d399'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)',
          icon: '✕',
          accentColor: '#ef4444'
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%)',
          icon: 'ℹ',
          accentColor: '#22d3ee'
        };
      default:
        return {
          background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.9) 0%, rgba(71, 85, 105, 0.9) 100%)',
          icon: '•',
          accentColor: '#94a3b8'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      style={{
        background: styles.background,
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${styles.accentColor}40`,
        animation: isExiting ? 'slideOutRight 0.3s ease-in-out' : 'slideInRight 0.3s ease-in-out',
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        fontSize: '14px',
        fontWeight: '500',
        minWidth: '280px'
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>

      <span style={{
        fontSize: '18px',
        fontWeight: '600',
        minWidth: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {styles.icon}
      </span>

      <span style={{ flex: 1 }}>
        {message}
      </span>

      <div style={{
        width: '4px',
        height: '4px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.5)',
      }} />
    </div>
  );
}
