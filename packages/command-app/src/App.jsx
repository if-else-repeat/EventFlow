import { useState } from 'react';
import { useCommandData } from './hooks/useCommandData';
import IncidentPanel  from './panels/IncidentPanel';
import ZonePanel      from './panels/ZonePanel';
import BroadcastPanel from './panels/BroadcastPanel';
import TimelinePanel  from './panels/TimelinePanel';
import LoginView      from './panels/LoginView';

const HEALTH_COLORS = { green:'#10b981', yellow:'#f59e0b', orange:'#f97316', red:'#ef4444' };
const HEALTH_BG     = { green:'#10b98122', yellow:'#f59e0b22', orange:'#f9731622', red:'#ef444422' };

function useLocalAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('ef_cmd_token'));
  function saveToken(t) { localStorage.setItem('ef_cmd_token', t); setToken(t); }
  function clearToken() { localStorage.removeItem('ef_cmd_token'); setToken(null); }
  return { token, saveToken, clearToken };
}

export default function App() {
  const { token, saveToken, clearToken } = useLocalAuth();
  const [activeTab, setActiveTab] = useState('incidents');

  const {
    incidents, zones, timeline, broadcasts, health, event,
    connected, loading, updateIncident, sendBroadcast, updateZoneStatus,
  } = useCommandData(token);

  if (!token) return <LoginView onLogin={saveToken} />;

  const activeIncidents = incidents.filter(i => !['resolved','closed'].includes(i.status));
  const critical = activeIncidents.filter(i => i.severity >= 3).length;

  const tabs = [
    { id:'incidents', label:'Incidents', badge: activeIncidents.length },
    { id:'zones',     label:'Zones',     badge: null },
    { id:'broadcast', label:'Broadcast', badge: null },
    { id:'timeline',  label:'Timeline',  badge: null },
  ];

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#0a0a0f' }}>
      {/* Top bar */}
      <div style={{ background:'#12121a', borderBottom:'1px solid #1e1e2e', padding:'0 24px', display:'flex', alignItems:'center', gap:20, height:56, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:8 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'linear-gradient(135deg,#7c3aed,#0891b2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'white' }}>EF</div>
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:'#a78bfa', letterSpacing:1 }}>EVENTFLOW COMMAND</div>
            <div style={{ fontSize:10, color:'#334155' }}>{event?.name || 'Loading...'}</div>
          </div>
        </div>

        {/* Health badge */}
        <div style={{ background: HEALTH_BG[health.health], border:`1px solid ${HEALTH_COLORS[health.health]}44`, borderRadius:6, padding:'4px 12px', display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background: HEALTH_COLORS[health.health] }} />
          <span style={{ fontSize:11, fontWeight:800, color: HEALTH_COLORS[health.health], letterSpacing:1 }}>
            {health.health?.toUpperCase()}
          </span>
          <span style={{ fontSize:10, color:'#475569' }}>({Math.round(health.score || 0)})</span>
        </div>

        {critical > 0 && (
          <div style={{ background:'#ef444422', border:'1px solid #ef444444', borderRadius:6, padding:'4px 12px', fontSize:11, fontWeight:800, color:'#ef4444', letterSpacing:1, animation:'pulse 2s infinite' }}>
            ⚠ {critical} CRITICAL
          </div>
        )}

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: connected ? '#10b981':'#ef4444' }} />
            <span style={{ fontSize:10, color: connected?'#10b981':'#ef4444', fontWeight:700 }}>
              {connected ? 'LIVE' : 'RECONNECTING'}
            </span>
          </div>
          <button onClick={clearToken} style={{ background:'transparent', border:'1px solid #2d2d3d', borderRadius:6, padding:'5px 10px', color:'#475569', fontSize:11, cursor:'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:'#0d0d14', borderBottom:'1px solid #1e1e2e', display:'flex', gap:4, padding:'0 24px', flexShrink:0 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background:'transparent', border:'none',
              borderBottom:`2px solid ${activeTab===tab.id ? '#7c3aed':'transparent'}`,
              padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:7,
              color: activeTab===tab.id ? '#a78bfa':'#6b7280', fontSize:13, fontWeight:600,
            }}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span style={{ background:'#7c3aed', borderRadius:10, padding:'1px 7px', fontSize:10, color:'white', fontWeight:700 }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflow:'hidden', display:'flex' }}>
        {activeTab === 'incidents' && (
          <IncidentPanel incidents={incidents} zones={zones} onUpdate={updateIncident} />
        )}
        {activeTab === 'zones' && (
          <ZonePanel zones={zones} incidents={incidents} onUpdateStatus={updateZoneStatus} />
        )}
        {activeTab === 'broadcast' && (
          <BroadcastPanel broadcasts={broadcasts} zones={zones} onSend={sendBroadcast} />
        )}
        {activeTab === 'timeline' && (
          <TimelinePanel entries={timeline} />
        )}
      </div>
    </div>
  );
}
