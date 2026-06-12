const ENTRY_COLORS = { incident:'#f97316', broadcast:'#3b82f6', system:'#6b7280', zone:'#10b981' };
const SEV_COLORS   = { 1:'#6b7280', 2:'#f59e0b', 3:'#f97316', 4:'#ef4444' };

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
}

export default function TimelinePanel({ entries }) {
  return (
    <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1, marginBottom:16 }}>
        LIVE EVENT TIMELINE · {entries.length} entries
      </div>

      <div style={{ position:'relative', paddingLeft:28 }}>
        {/* Vertical line */}
        <div style={{ position:'absolute', left:8, top:0, bottom:0, width:2, background:'#1e1e2e' }} />

        {entries.map((entry, i) => {
          const color = ENTRY_COLORS[entry.entry_type] || '#6b7280';
          return (
            <div key={entry.id || i} style={{ position:'relative', marginBottom:14 }}>
              {/* Dot */}
              <div style={{ position:'absolute', left:-24, top:14, width:12, height:12, borderRadius:'50%', background: entry.severity ? SEV_COLORS[entry.severity] : color, border:'2px solid #0a0a0f', flexShrink:0 }} />

              <div style={{ background:'#12121a', border:'1px solid #1e1e2e', borderRadius:9, padding:'11px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:4 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', lineHeight:1.4 }}>
                    {entry.action}
                  </div>
                  <div style={{ fontSize:11, color:'#334155', whiteSpace:'nowrap', flexShrink:0, fontFamily:'monospace' }}>
                    {formatTime(entry.created_at)}
                  </div>
                </div>
                {entry.detail && (
                  <div style={{ fontSize:12, color:'#475569', lineHeight:1.4, marginBottom:5 }}>{entry.detail}</div>
                )}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, color:'#334155' }}>{entry.actor_label || 'System'}</span>
                  {entry.zone_name && <span style={{ fontSize:10, color:'#334155' }}>· {entry.zone_name}</span>}
                  <span style={{ fontSize:10, color: color, fontWeight:700, textTransform:'uppercase', letterSpacing:0.5 }}>{entry.entry_type}</span>
                </div>
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div style={{ textAlign:'center', padding:60, color:'#334155', fontSize:14 }}>
            Timeline will populate when the event goes active
          </div>
        )}
      </div>
    </div>
  );
}
