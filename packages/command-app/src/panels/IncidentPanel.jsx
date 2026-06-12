import { useState } from 'react';

const SEV_COLORS = { 1:'#6b7280', 2:'#f59e0b', 3:'#f97316', 4:'#ef4444' };
const SEV_LABELS = { 1:'Low', 2:'Medium', 3:'High', 4:'Emergency' };
const STATUS_COLORS = { new:'#6b7280', under_review:'#f59e0b', in_progress:'#3b82f6', auto_escalated:'#ef4444', resolved:'#10b981', closed:'#334155' };

function timeAgo(ts) {
  const m = Math.floor((Date.now()-new Date(ts))/60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : `${Math.floor(m/60)}h ago`;
}

function IncidentCard({ incident, onUpdate }) {
  const [expanded,    setExpanded]    = useState(false);
  const [teamInput,   setTeamInput]   = useState(incident.assigned_team || '');
  const [saving,      setSaving]      = useState(false);

  async function assign() {
    if (!teamInput.trim()) return;
    setSaving(true);
    await onUpdate(incident.id, { assigned_team: teamInput.trim(), status: 'in_progress' });
    setSaving(false);
  }
  async function resolve() {
    setSaving(true);
    await onUpdate(incident.id, { status: 'resolved' });
    setSaving(false);
  }

  const isUrgent = incident.severity >= 3 || incident.status === 'auto_escalated';

  return (
    <div style={{
      background:'#12121a',
      border:`1px solid ${isUrgent ? SEV_COLORS[incident.severity]+'44' : '#1e1e2e'}`,
      borderLeft:`3px solid ${SEV_COLORS[incident.severity] || '#6b7280'}`,
      borderRadius:10, marginBottom:10, overflow:'hidden',
    }}>
      {/* Header row */}
      <div onClick={() => setExpanded(!expanded)} style={{ padding:'14px 16px', cursor:'pointer', display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:5, flexWrap:'wrap' }}>
            <span style={{ background: SEV_COLORS[incident.severity]+'22', color: SEV_COLORS[incident.severity], border:`1px solid ${SEV_COLORS[incident.severity]}44`, borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:700, letterSpacing:0.5 }}>
              {SEV_LABELS[incident.severity]}
            </span>
            <span style={{ background: STATUS_COLORS[incident.status]+'22', color: STATUS_COLORS[incident.status], borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
              {incident.status?.replace('_',' ').toUpperCase()}
            </span>
            {incident.confidence === 'high' && (
              <span style={{ background:'#7c3aed22', color:'#a78bfa', borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
                {incident.report_count} REPORTS
              </span>
            )}
            {incident.status === 'auto_escalated' && (
              <span style={{ background:'#ef444422', color:'#ef4444', borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:700 }}>
                ⚡ AUTO-ESCALATED
              </span>
            )}
          </div>
          <div style={{ fontSize:14, fontWeight:600, color:'#e2e8f0' }}>{incident.title}</div>
          <div style={{ fontSize:12, color:'#475569', marginTop:3 }}>
            {incident.zone_name || 'Unknown Zone'} · {timeAgo(incident.created_at)}
            {incident.assigned_team && ` · Assigned: ${incident.assigned_team}`}
          </div>
        </div>
        <div style={{ color:'#334155', fontSize:16, flexShrink:0 }}>{expanded ? '▲' : '▼'}</div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop:'1px solid #1e1e2e', padding:'14px 16px', background:'#0d0d14' }}>
          {incident.notes && (
            <div style={{ fontSize:13, color:'#94a3b8', marginBottom:14, lineHeight:1.6 }}>{incident.notes}</div>
          )}
          {!['resolved','closed'].includes(incident.status) && (
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <input
                value={teamInput}
                onChange={e => setTeamInput(e.target.value)}
                placeholder="Assign team (e.g. Security-4)"
                style={{ flex:1, minWidth:160, background:'#12121a', border:'1px solid #2d2d3d', borderRadius:7, padding:'9px 12px', fontSize:13, color:'#e2e8f0', outline:'none' }}
              />
              <button onClick={assign} disabled={saving||!teamInput.trim()}
                style={{ background:'#3b82f622', border:'1px solid #3b82f6', borderRadius:7, padding:'9px 14px', color:'#60a5fa', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                {saving ? '...' : 'Assign'}
              </button>
              <button onClick={resolve} disabled={saving}
                style={{ background:'#10b98122', border:'1px solid #10b981', borderRadius:7, padding:'9px 14px', color:'#34d399', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                {saving ? '...' : '✓ Resolve'}
              </button>
            </div>
          )}
          {['resolved','closed'].includes(incident.status) && (
            <div style={{ color:'#10b981', fontSize:13, fontWeight:600 }}>
              ✓ Resolved {incident.resolved_at ? timeAgo(incident.resolved_at) : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function IncidentPanel({ incidents, zones, onUpdate }) {
  const [filter, setFilter] = useState('active');

  const filtered = incidents.filter(i => {
    if (filter === 'active')   return !['resolved','closed'].includes(i.status);
    if (filter === 'critical') return i.severity >= 3 && !['resolved','closed'].includes(i.status);
    if (filter === 'resolved') return ['resolved','closed'].includes(i.status);
    return true;
  }).sort((a,b) => b.severity - a.severity || new Date(b.created_at) - new Date(a.created_at));

  const filterBtns = [
    { id:'active',   label:'Active',   count: incidents.filter(i=>!['resolved','closed'].includes(i.status)).length },
    { id:'critical', label:'Critical', count: incidents.filter(i=>i.severity>=3&&!['resolved','closed'].includes(i.status)).length },
    { id:'resolved', label:'Resolved', count: incidents.filter(i=>['resolved','closed'].includes(i.status)).length },
    { id:'all',      label:'All',      count: incidents.length },
  ];

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Filter bar */}
      <div style={{ padding:'12px 20px', borderBottom:'1px solid #1e1e2e', display:'flex', gap:8, flexShrink:0 }}>
        {filterBtns.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ background: filter===f.id ? '#7c3aed22':'transparent', border:`1px solid ${filter===f.id?'#7c3aed':'#1e1e2e'}`, borderRadius:7, padding:'6px 14px', cursor:'pointer', color: filter===f.id?'#a78bfa':'#6b7280', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
            {f.label}
            {f.count > 0 && <span style={{ background: filter===f.id?'#7c3aed':'#2d2d3d', borderRadius:10, padding:'0px 6px', fontSize:10, color:'white', fontWeight:700 }}>{f.count}</span>}
          </button>
        ))}
      </div>

      {/* Incident list */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'#334155' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>✓</div>
            <div style={{ fontSize:14 }}>{filter === 'active' ? 'No active incidents' : 'Nothing here'}</div>
          </div>
        ) : (
          filtered.map(inc => (
            <IncidentCard key={inc.id} incident={inc} onUpdate={onUpdate} />
          ))
        )}
      </div>
    </div>
  );
}
