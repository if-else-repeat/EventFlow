import { useState } from 'react';

export default function LoginView({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [code,  setCode]  = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoad] = useState(false);

  async function handleLogin() {
    if (!phone.trim() || !code.trim()) return;
    setLoad(true); setError(null);
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), event_code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); return; }
      if (!['command','manager'].includes(data.operator.role)) {
        setError('This dashboard is for Command and Zone Managers only. Use the Operator App instead.');
        return;
      }
      onLogin(data.token);
    } catch { setError('Network error. Is the API running?'); }
    finally { setLoad(false); }
  }

  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0a0f' }}>
      <div style={{ width:420 }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:60, height:60, borderRadius:16, background:'linear-gradient(135deg,#7c3aed,#0891b2)', fontSize:22, fontWeight:900, color:'white', marginBottom:16 }}>EF</div>
          <div style={{ fontSize:24, fontWeight:800, color:'#e2e8f0' }}>EventFlow</div>
          <div style={{ fontSize:14, color:'#475569', marginTop:4 }}>Command Dashboard</div>
        </div>
        <div style={{ background:'#12121a', border:'1px solid #1e1e2e', borderRadius:16, padding:32 }}>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1, marginBottom:8 }}>PHONE NUMBER</label>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+917001000001"
              style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2d2d3d', borderRadius:8, padding:'13px 16px', fontSize:15, color:'#e2e8f0', outline:'none' }} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1, marginBottom:8 }}>EVENT CODE</label>
            <input type="text" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="TEST01" maxLength={6}
              style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2d2d3d', borderRadius:8, padding:'13px 16px', fontSize:22, fontWeight:900, color:'#a78bfa', letterSpacing:8, textAlign:'center', outline:'none' }} />
          </div>
          {error && <div style={{ background:'#ef444422', border:'1px solid #ef4444', borderRadius:8, padding:'11px 14px', fontSize:13, color:'#fca5a5', marginBottom:16 }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading||!phone.trim()||!code.trim()}
            style={{ width:'100%', height:52, borderRadius:10, border:'none', background:loading?'#2d2d3d':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', fontSize:15, fontWeight:800, cursor:'pointer', opacity:loading?0.6:1 }}>
            {loading ? 'Signing in...' : 'Open Command Dashboard'}
          </button>
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'#334155', marginTop:16 }}>
          Command and Zone Manager roles only
        </p>
      </div>
    </div>
  );
}
