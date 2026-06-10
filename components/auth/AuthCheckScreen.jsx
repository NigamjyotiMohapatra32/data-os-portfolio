/** Shared loading screen for auth resolution (login + protected routes). */
export default function AuthCheckScreen({ message = 'Verifying session…' }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#0a0e27',
      color: '#22d3ee',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 20,
          height: 20,
          border: '2px solid rgba(34,211,238,0.3)',
          borderTopColor: '#22d3ee',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
        }} />
        <span>{message}</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
