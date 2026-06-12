import { useState, useEffect, useCallback } from 'react';
import { useAuth }   from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { flushQueue, getQueueLength } from './offline/queue';
import LoginScreen   from './screens/LoginScreen';
import HomeScreen    from './screens/HomeScreen';
import ReportScreen  from './screens/ReportScreen';

export default function App() {
  const { token, operator, event, loading, error, login, logout, isLoggedIn } = useAuth();
  const [screen, setScreen]       = useState('home');
  const [broadcasts, setBroadcasts] = useState([]);
  const [pendingCount, setPending]  = useState(0);
  const [toast, setToast]           = useState(null);

  const showToast = useCallback((msg, type='info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // WebSocket event handler
  const handleWsEvent = useCallback((event, data) => {
    if (event === 'broadcast:sent') {
      const b = data.broadcast;
      if (b.audience === 'all' || b.audience === 'operators' || b.audience === `zone:${operator?.zone_id}`) {
        setBroadcasts(prev => [b, ...prev].slice(0, 20));
        showToast(`📢 ${b.message.substring(0, 60)}`, 'broadcast');
      }
    }
    if (event === 'incident:created' && data.merged) {
      showToast('Your report merged with an existing incident.', 'info');
    }
  }, [operator]);

  const { connected } = useSocket(token, handleWsEvent);

  // Sync offline queue when connectivity returns
  useEffect(() => {
    if (!connected || !token) return;
    flushQueue(token).then(({ synced }) => {
      if (synced > 0) showToast(`${synced} offline report(s) synced`, 'success');
      setPending(getQueueLength());
    });
  }, [connected, token]);

  // Initial broadcasts load
  useEffect(() => {
    if (!token) return;
    fetch('/api/broadcasts?limit=10', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => d.broadcasts && setBroadcasts(d.broadcasts))
      .catch(() => {});
  }, [token]);

  if (!isLoggedIn) {
    return <LoginScreen loading={loading} error={error} onLogin={login} />;
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', color:'#e2e8f0', display:'flex', flexDirection:'column' }}>
      {/* Status bar */}
      <div style={{ background:'#12121a', borderBottom:'1px solid #1e1e2e', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:800, color:'#a78bfa', letterSpacing:1 }}>EVENTFLOW</div>
          <div style={{ fontSize:11, color:'#475569' }}>{operator?.zone_name || 'No Zone'}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {pendingCount > 0 && (
            <div style={{ background:'#f59e0b22', border:'1px solid #f59e0b', borderRadius:4, padding:'2px 7px', fontSize:10, color:'#f59e0b', fontWeight:700 }}>
              {pendingCount} PENDING
            </div>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: connected ? '#10b981' : '#ef4444' }} />
            <span style={{ fontSize:10, color: connected ? '#10b981' : '#ef4444', fontWeight:700 }}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Screen content */}
      <div style={{ flex:1, overflow:'auto' }}>
        {screen === 'home' && (
          <HomeScreen
            operator={operator}
            event={event}
            broadcasts={broadcasts}
            onReport={() => setScreen('report')}
            onLogout={logout}
          />
        )}
        {screen === 'report' && (
          <ReportScreen
            operator={operator}
            token={token}
            connected={connected}
            onDone={(result) => {
              if (result?.offline) showToast('Saved offline — will sync when connected', 'warning');
              else if (result?.merged) showToast('Report received (merged with existing incident)', 'success');
              else showToast('Report received ✓', 'success');
              setPending(getQueueLength());
              setScreen('home');
            }}
            onCancel={() => setScreen('home')}
          />
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:'fixed', bottom:24, left:16, right:16, zIndex:100,
          background: toast.type==='broadcast' ? '#7c3aed' : toast.type==='success' ? '#059669' : toast.type==='warning' ? '#d97706' : '#1e1e2e',
          border:`1px solid ${toast.type==='broadcast'?'#a78bfa':toast.type==='success'?'#34d399':toast.type==='warning'?'#f59e0b':'#2d2d3d'}`,
          borderRadius:10, padding:'14px 18px', color:'white', fontSize:14, fontWeight:500,
          boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
