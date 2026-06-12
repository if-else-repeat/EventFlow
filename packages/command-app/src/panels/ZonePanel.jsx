const STATUS_META = {
  normal:   { color:'#10b981', label:'Normal',   bg:'#10b98122' },
  busy:     { color:'#f59e0b', label:'Busy',      bg:'#f59e0b22' },
  critical: { color:'#ef4444', label:'Critical',  bg:'#ef444422' },
  closed:   { color:'#6b7280', label:'Closed',    bg:'#6b728022' },
};

export default function ZonePanel({ zones, incidents, onUpdateStatus }) {
  function activeInZone(zoneId) {
    return incidents.filter(i => i.zone_id===zoneId && !['resolved','closed'].includes(i.status));
  }

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
        {zones.map(zone => {
          const meta   = STATUS_META[zone.status] || STATUS_META.normal;
          const active = activeInZone(zone.id);
          const maxSev = active.length ? Math.max(...active.map(i=>i.severity)) : 0;

          return (
            <div key={zone.id} style={{ background:'#12121a', border:`1px solid ${meta.color}44`, borderRadius:12, overflow:'hidden' }}>
              {/* Zone header */}
              <div style={{ background: meta.bg, borderBottom:`1px solid ${meta.color}33`, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:800, color: meta.color, letterSpacing:1 }}>{zone.label}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#e2e8f0', marginTop:2 }}>{zone.name}</div>
                </div>
                <div style={{ background: meta.bg, border:`1px solid ${meta.color}`, borderRadius:6, padding:'4px 10px', fontSize:11, fontWeight:800, color: meta.color }}>
                  {meta.label}
                </div>
              </div>

              {/* Zone body */}
              <div style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:22, fontWeight:900, color: active.length ? '#ef4444':'#10b981' }}>{active.length}</div>
                    <div style={{ fontSize:11, color:'#475569' }}>Active incidents</div>
                  </div>
                  {zone.capacity && (
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:15, fontWeight:700, color:'#94a3b8' }}>{zone.capacity.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:'#475569' }}>Capacity</div>
                    </div>
                  )}
                </div>

                {/* Active incident titles */}
                {active.slice(0,3).map(inc => (
                  <div key={inc.id} style={{ fontSize:12, color:'#94a3b8', padding:'5px 0', borderTop:'1px solid #1e1e2e', display:'flex', gap:8, alignItems:'center' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:['#6b7280','#f59e0b','#f97316','#ef4444'][inc.severity-1], flexShrink:0 }} />
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inc.title}</span>
                  </div>
                ))}

                {/* Status override buttons */}
                <div style={{ display:'flex', gap:6, marginTop:14, flexWrap:'wrap' }}>
                  {['normal','busy','critical','closed'].map(s => (
                    <button key={s} onClick={() => onUpdateStatus(zone.id, s)}
                      disabled={zone.status===s}
                      style={{ background: zone.status===s ? STATUS_META[s].bg:'transparent', border:`1px solid ${zone.status===s?STATUS_META[s].color:'#2d2d3d'}`, borderRadius:5, padding:'4px 9px', fontSize:10, fontWeight:700, color: zone.status===s ? STATUS_META[s].color:'#475569', cursor: zone.status===s?'default':'pointer', textTransform:'uppercase', letterSpacing:0.5 }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {zones.length === 0 && (
        <div style={{ textAlign:'center', padding:60, color:'#334155', fontSize:14 }}>No zones configured</div>
      )}
    </div>
  );
}
