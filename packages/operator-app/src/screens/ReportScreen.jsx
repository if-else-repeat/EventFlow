import { useState } from 'react';
import { enqueue } from '../offline/queue';

const CATEGORIES = [
  { id:'congestion',     label:'Congestion',     icon:'🚧' },
  { id:'medical',        label:'Medical',         icon:'🏥' },
  { id:'security',       label:'Security',        icon:'🔒' },
  { id:'resource',       label:'Resource',        icon:'📦' },
  { id:'infrastructure', label:'Infrastructure',  icon:'⚡' },
  { id:'other',          label:'Other',           icon:'📋' },
];
const SEVERITIES = [
  { level:1, label:'Low',       color:'#6b7280' },
  { level:2, label:'Medium',    color:'#f59e0b' },
  { level:3, label:'High',      color:'#f97316' },
  { level:4, label:'Emergency', color:'#ef4444' },
];

export default function ReportScreen({ operator, token, connected, onDone, onCancel }) {
  const [category, setCategory] = useState(null);
  const [severity, setSeverity] = useState(null);
  const [notes,    setNotes]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function submit() {
    if (!category || !severity) return;
    const cat  = CATEGORIES.find(c => c.id === category);
    const sev  = SEVERITIES.find(s => s.level === severity);
    const payload = {
      zone_id:  operator.zone_id,
      category,
      severity,
      title:    `${cat.label} — ${operator.zone_name || operator.zone_label}`,
      notes:    notes.trim() || null,
    };

    setLoading(true);
    try {
      if (!connected) {
        enqueue(payload);
        onDone({ offline: true });
        return;
      }
      const res  = await fetch('/api/incidents', {
        method:  'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      onDone({ incident_id: data.incident_id, merged: data.merged });
    } catch {
      // Server unreachable — queue offline
      enqueue(payload);
      onDone({ offline: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding:16, paddingBottom:32 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <button onClick={onCancel} style={{ background:'transparent', border:'1px solid #2d2d3d', borderRadius:8, padding:'8px 14px', color:'#94a3b8', fontSize:14, cursor:'pointer' }}>
          ← Back
        </button>
        <div style={{ fontSize:16, fontWeight:800, color:'#e2e8f0' }}>Report Incident</div>
      </div>

      {/* Category */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1, marginBottom:12 }}>WHAT IS HAPPENING?</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                background: category===c.id ? '#7c3aed22' : '#12121a',
                border:`1px solid ${category===c.id ? '#7c3aed' : '#1e1e2e'}`,
                borderRadius:10, padding:'16px 12px', cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', gap:6,
              }}
            >
              <span style={{ fontSize:24 }}>{c.icon}</span>
              <span style={{ fontSize:13, fontWeight:700, color: category===c.id ? '#a78bfa' : '#94a3b8' }}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1, marginBottom:12 }}>HOW SERIOUS?</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {SEVERITIES.map(s => (
            <button
              key={s.level}
              onClick={() => setSeverity(s.level)}
              style={{
                background: severity===s.level ? s.color+'22' : '#12121a',
                border:`1px solid ${severity===s.level ? s.color : '#1e1e2e'}`,
                borderRadius:10, padding:'14px 12px', cursor:'pointer',
                fontSize:14, fontWeight:700,
                color: severity===s.level ? s.color : '#6b7280',
                minHeight:52,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes (optional) */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1, marginBottom:8 }}>
          NOTES <span style={{ color:'#334155', fontWeight:400 }}>(optional)</span>
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any details that help. Not required."
          rows={3}
          style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2d2d3d', borderRadius:8, padding:'12px 14px', fontSize:14, color:'#e2e8f0', resize:'none', outline:'none', lineHeight:1.5 }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={submit}
        disabled={!category || !severity || loading}
        style={{
          width:'100%', height:60, borderRadius:12, border:'none',
          background: (!category||!severity||loading) ? '#1e1e2e' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
          color: (!category||!severity) ? '#475569' : 'white',
          fontSize:16, fontWeight:800, cursor: (!category||!severity) ? 'not-allowed' : 'pointer',
          transition:'all 0.15s',
        }}
      >
        {loading ? 'Sending...' : !connected ? '📶 SAVE OFFLINE' : 'SUBMIT REPORT'}
      </button>

      {!connected && (
        <p style={{ textAlign:'center', fontSize:12, color:'#f59e0b', marginTop:12 }}>
          You're offline. Report will sync when connected.
        </p>
      )}
    </div>
  );
}
