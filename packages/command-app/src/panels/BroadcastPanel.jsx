import { useState } from 'react';

const TEMPLATES = [
  { id:'gate_use',      label:'Use alternate gate',     text:'Use {GATE} for faster entry. {GATE} is currently open.',          vars:['GATE'],          audience:'attendees' },
  { id:'parking_full',  label:'Parking lot full',       text:'Parking {LOT} is full. Please use Parking {ALT_LOT}.',            vars:['LOT','ALT_LOT'], audience:'attendees' },
  { id:'exit_route',    label:'Exit route update',      text:'Exit via {ROUTE}. {ROUTE} is currently clear.',                   vars:['ROUTE'],         audience:'attendees' },
  { id:'water',         label:'Water station',          text:'Water station available at {LOCATION}.',                          vars:['LOCATION'],      audience:'attendees' },
  { id:'medical_clear', label:'Clear area for medical', text:'Medical team responding near {ZONE}. Please move to the sides.',  vars:['ZONE'],          audience:'attendees' },
  { id:'delay',         label:'Delay notice',           text:'{EVENT} is delayed by approximately {DURATION} minutes.',         vars:['EVENT','DURATION'], audience:'all' },
  { id:'all_clear',     label:'All clear',              text:'The situation at {LOCATION} has been resolved.',                  vars:['LOCATION'],      audience:'attendees' },
  { id:'staff_deploy',  label:'Deploy staff',           text:'All available staff: please report to {ZONE} immediately.',      vars:['ZONE'],          audience:'operators' },
  { id:'emergency',     label:'🚨 Emergency alert',     text:'IMPORTANT: {MESSAGE}. Follow staff instructions immediately.',    vars:['MESSAGE'],       audience:'all',   priority:'emergency' },
];

function timeAgo(ts) {
  const m=Math.floor((Date.now()-new Date(ts))/60000);
  return m<1?'just now':m<60?`${m}m ago`:`${Math.floor(m/60)}h ago`;
}

export default function BroadcastPanel({ broadcasts, zones, onSend }) {
  const [selected,   setSelected]   = useState(null);
  const [vars,       setVars]       = useState({});
  const [custom,     setCustom]     = useState('');
  const [audience,   setAudience]   = useState('attendees');
  const [channels,   setChannels]   = useState(['app']);
  const [priority,   setPriority]   = useState('informational');
  const [sending,    setSending]    = useState(false);
  const [sent,       setSent]       = useState(false);
  const [useCustom,  setUseCustom]  = useState(false);

  function selectTemplate(t) {
    setSelected(t);
    setUseCustom(false);
    setVars({});
    setAudience(t.audience || 'attendees');
    setPriority(t.priority || 'informational');
  }

  function buildMessage() {
    if (useCustom) return custom.trim();
    if (!selected) return '';
    let msg = selected.text;
    for (const [k,v] of Object.entries(vars)) {
      msg = msg.replaceAll(`{${k}}`, v || `[${k}]`);
    }
    return msg;
  }

  const message = buildMessage();
  const allVarsFilled = !selected || selected.vars.every(v => vars[v]?.trim());
  const canSend = message.length >= 5 && (useCustom || allVarsFilled) && !sending;

  async function handleSend() {
    if (!canSend) return;
    if (priority === 'emergency' && !window.confirm('Send EMERGENCY broadcast to everyone?')) return;
    setSending(true);
    try {
      await onSend({
        message,
        priority,
        audience,
        channels,
        template_id: selected?.id || null,
      });
      setSent(true);
      setTimeout(() => {
        setSent(false); setSelected(null); setVars({}); setCustom('');
        setAudience('attendees'); setPriority('informational'); setUseCustom(false);
      }, 2000);
    } finally { setSending(false); }
  }

  const toggleChannel = (ch) =>
    setChannels(prev => prev.includes(ch) ? prev.filter(c=>c!==ch) : [...prev, ch]);

  return (
    <div style={{ flex:1, overflow:'hidden', display:'flex', gap:0 }}>
      {/* Left: compose */}
      <div style={{ width:420, borderRight:'1px solid #1e1e2e', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #1e1e2e', flexShrink:0 }}>
          <div style={{ fontSize:12, fontWeight:800, color:'#6b7280', letterSpacing:1, marginBottom:12 }}>COMPOSE BROADCAST</div>

          {/* Template grid */}
          {!useCustom && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:14 }}>
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => selectTemplate(t)}
                  style={{ background: selected?.id===t.id ? (t.priority==='emergency'?'#ef444422':'#7c3aed22'):'#0a0a0f', border:`1px solid ${selected?.id===t.id?(t.priority==='emergency'?'#ef4444':'#7c3aed'):'#1e1e2e'}`, borderRadius:7, padding:'9px 10px', cursor:'pointer', textAlign:'left', color: selected?.id===t.id?'#e2e8f0':'#6b7280', fontSize:12, fontWeight:600, lineHeight:1.3 }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => { setUseCustom(!useCustom); setSelected(null); }}
            style={{ background: useCustom?'#0891b222':'transparent', border:`1px solid ${useCustom?'#0891b2':'#2d2d3d'}`, borderRadius:7, padding:'7px 14px', cursor:'pointer', color: useCustom?'#67e8f9':'#6b7280', fontSize:12, fontWeight:600, width:'100%', marginBottom:14 }}>
            {useCustom ? '← Use template' : '✏ Write custom message'}
          </button>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
          {/* Template variables */}
          {selected && !useCustom && selected.vars.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'#6b7280', fontWeight:700, letterSpacing:1, marginBottom:10 }}>FILL IN DETAILS</div>
              {selected.vars.map(v => (
                <div key={v} style={{ marginBottom:10 }}>
                  <label style={{ display:'block', fontSize:11, color:'#475569', marginBottom:5 }}>{v}</label>
                  <input value={vars[v]||''} onChange={e => setVars(prev => ({...prev,[v]:e.target.value}))}
                    placeholder={`Enter ${v.toLowerCase()}`}
                    style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2d2d3d', borderRadius:7, padding:'10px 12px', fontSize:14, color:'#e2e8f0', outline:'none' }} />
                </div>
              ))}
            </div>
          )}

          {/* Custom message */}
          {useCustom && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, color:'#6b7280', fontWeight:700, letterSpacing:1, marginBottom:8 }}>MESSAGE</div>
              <textarea value={custom} onChange={e=>setCustom(e.target.value)} rows={4}
                placeholder="Type your message..."
                style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2d2d3d', borderRadius:7, padding:'11px 13px', fontSize:14, color:'#e2e8f0', resize:'none', outline:'none', lineHeight:1.5 }} />
            </div>
          )}

          {/* Message preview */}
          {message && (
            <div style={{ background:'#0a0a0f', border:'1px solid #1e1e2e', borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
              <div style={{ fontSize:10, color:'#475569', letterSpacing:1, marginBottom:6 }}>PREVIEW</div>
              <div style={{ fontSize:14, color:'#e2e8f0', lineHeight:1.6 }}>{message}</div>
            </div>
          )}

          {/* Audience */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'#6b7280', fontWeight:700, letterSpacing:1, marginBottom:8 }}>SEND TO</div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {['all','attendees','operators'].map(a => (
                <button key={a} onClick={() => setAudience(a)}
                  style={{ background: audience===a?'#7c3aed22':'transparent', border:`1px solid ${audience===a?'#7c3aed':'#2d2d3d'}`, borderRadius:6, padding:'6px 14px', cursor:'pointer', color: audience===a?'#a78bfa':'#6b7280', fontSize:12, fontWeight:700, textTransform:'capitalize' }}>
                  {a === 'all' ? 'Everyone' : a}
                </button>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:'#6b7280', fontWeight:700, letterSpacing:1, marginBottom:8 }}>VIA</div>
            <div style={{ display:'flex', gap:7 }}>
              {['app','sms','whatsapp'].map(ch => (
                <button key={ch} onClick={() => toggleChannel(ch)}
                  style={{ background: channels.includes(ch)?'#3b82f622':'transparent', border:`1px solid ${channels.includes(ch)?'#3b82f6':'#2d2d3d'}`, borderRadius:6, padding:'6px 14px', cursor:'pointer', color: channels.includes(ch)?'#60a5fa':'#6b7280', fontSize:12, fontWeight:700, textTransform:'uppercase' }}>
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Send button */}
          <button onClick={handleSend} disabled={!canSend}
            style={{ width:'100%', height:52, borderRadius:10, border:'none', background: sent?'#059669':!canSend?'#1e1e2e':priority==='emergency'?'linear-gradient(135deg,#dc2626,#b91c1c)':'linear-gradient(135deg,#7c3aed,#6d28d9)', color: !canSend?'#475569':'white', fontSize:15, fontWeight:800, cursor:!canSend?'not-allowed':'pointer' }}>
            {sent ? '✓ Sent!' : sending ? 'Sending...' : priority==='emergency'?'🚨 SEND EMERGENCY':'SEND BROADCAST'}
          </button>
        </div>
      </div>

      {/* Right: history */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1, marginBottom:14 }}>BROADCAST HISTORY</div>
        {broadcasts.length === 0 && <div style={{ color:'#334155', fontSize:13 }}>No broadcasts sent yet</div>}
        {broadcasts.map(b => (
          <div key={b.id} style={{ background:'#12121a', border:'1px solid #1e1e2e', borderRadius:9, padding:'13px 15px', marginBottom:9 }}>
            <div style={{ display:'flex', gap:8, marginBottom:7, flexWrap:'wrap' }}>
              <span style={{ background:'#2d2d3d', borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>{b.audience}</span>
              <span style={{ background:'#2d2d3d', borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>{b.priority}</span>
            </div>
            <div style={{ fontSize:13, color:'#e2e8f0', lineHeight:1.5 }}>{b.message}</div>
            <div style={{ fontSize:11, color:'#334155', marginTop:7 }}>
              {b.sender_name || 'Staff'} · {timeAgo(b.created_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
