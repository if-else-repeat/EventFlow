import { useState } from 'react';

const PRIORITY_COLORS = { emergency:'#ef4444', operational:'#f97316', informational:'#3b82f6' };

function timeAgo(ts) {
  const mins = Math.floor((Date.now() - new Date(ts)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins/60)}h ago`;
}

export default function HomeScreen({ operator, event, broadcasts, onReport, onLogout }) {
  const [showBroadcasts, setShowBroadcasts] = useState(false);

  return (
    <div style={{ padding:16, paddingBottom:32 }}>
      {/* Event header */}
      <div style={{ background:'#12121a', border:'1px solid #1e1e2e', borderRadius:12, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:1, marginBottom:4 }}>ACTIVE EVENT</div>
        <div style={{ fontSize:16, fontWeight:700, color:'#e2e8f0' }}>{event?.name || 'Loading...'}</div>
        <div style={{ fontSize:13, color:'#475569', marginTop:2 }}>
          {operator?.name} · {operator?.role?.charAt(0).toUpperCase() + operator?.role?.slice(1)}
        </div>
      </div>

      {/* REPORT INCIDENT — primary action */}
      <button
        onClick={onReport}
        style={{
          width:'100%', minHeight:80, borderRadius:14, border:'none',
          background:'linear-gradient(135deg,#dc2626,#b91c1c)',
          color:'white', fontSize:20, fontWeight:900, cursor:'pointer',
          marginBottom:16, letterSpacing:0.5,
          boxShadow:'0 4px 20px rgba(220,38,38,0.35)',
        }}
      >
        🚨 REPORT INCIDENT
      </button>

      {/* Latest broadcasts */}
      {broadcasts.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div
            onClick={() => setShowBroadcasts(!showBroadcasts)}
            style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, cursor:'pointer' }}
          >
            <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1 }}>
              INSTRUCTIONS & UPDATES
            </div>
            <div style={{ fontSize:11, color:'#475569' }}>{showBroadcasts ? '▲' : '▼'}</div>
          </div>

          {/* Always show the latest one */}
          {[broadcasts[0], ...(showBroadcasts ? broadcasts.slice(1, 5) : [])].map((b, i) => (
            <div key={b.id || i} style={{
              background:'#12121a',
              border:`1px solid ${PRIORITY_COLORS[b.priority] || '#1e1e2e'}33`,
              borderLeft:`3px solid ${PRIORITY_COLORS[b.priority] || '#1e1e2e'}`,
              borderRadius:10, padding:'12px 14px', marginBottom:8,
            }}>
              <div style={{ fontSize:14, color:'#e2e8f0', lineHeight:1.5 }}>{b.message}</div>
              <div style={{ fontSize:11, color:'#475569', marginTop:6 }}>{timeAgo(b.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {/* No broadcasts yet */}
      {broadcasts.length === 0 && (
        <div style={{ background:'#12121a', border:'1px solid #1e1e2e', borderRadius:10, padding:20, textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:13, color:'#475569' }}>No instructions yet. Stand by.</div>
        </div>
      )}

      {/* Operator info & logout */}
      <div style={{ marginTop:24, borderTop:'1px solid #1e1e2e', paddingTop:20 }}>
        <div style={{ fontSize:11, color:'#334155', marginBottom:12 }}>
          SMS fallback: <span style={{ color:'#6b7280', fontFamily:'monospace' }}>EF {operator?.zone_label || 'ZONE'} CONGESTION HIGH</span>
        </div>
        <button onClick={onLogout} style={{ background:'transparent', border:'1px solid #2d2d3d', borderRadius:8, padding:'10px 16px', color:'#475569', fontSize:13, cursor:'pointer' }}>
          Leave Event
        </button>
      </div>
    </div>
  );
}
