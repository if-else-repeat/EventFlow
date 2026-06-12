import { useState } from 'react';

export default function LoginScreen({ loading, error, onLogin }) {
  const [phone, setPhone]     = useState('');
  const [code,  setCode]      = useState('');

  async function handleSubmit() {
    if (!phone.trim() || !code.trim()) return;
    await onLogin(phone.trim(), code.trim());
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0f', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:360 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:56, height:56, borderRadius:14, background:'linear-gradient(135deg,#7c3aed,#0891b2)', fontSize:22, fontWeight:900, color:'white', marginBottom:16 }}>
            EF
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:'#e2e8f0' }}>EventFlow</div>
          <div style={{ fontSize:13, color:'#475569', marginTop:4 }}>Field Operator App</div>
        </div>

        {/* Form */}
        <div style={{ background:'#12121a', border:'1px solid #1e1e2e', borderRadius:14, padding:28 }}>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1, marginBottom:8 }}>
              PHONE NUMBER
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 70010 00040"
              style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2d2d3d', borderRadius:8, padding:'14px 16px', fontSize:16, color:'#e2e8f0', outline:'none' }}
              onFocus={e => e.target.style.borderColor='#7c3aed'}
              onBlur={e  => e.target.style.borderColor='#2d2d3d'}
            />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6b7280', letterSpacing:1, marginBottom:8 }}>
              EVENT CODE
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="TEST01"
              maxLength={6}
              style={{ width:'100%', background:'#0a0a0f', border:'1px solid #2d2d3d', borderRadius:8, padding:'14px 16px', fontSize:22, fontWeight:900, color:'#a78bfa', letterSpacing:6, textAlign:'center', outline:'none' }}
              onFocus={e => e.target.style.borderColor='#7c3aed'}
              onBlur={e  => e.target.style.borderColor='#2d2d3d'}
            />
          </div>

          {error && (
            <div style={{ background:'#ef444422', border:'1px solid #ef4444', borderRadius:8, padding:'12px 14px', fontSize:13, color:'#fca5a5', marginBottom:16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !phone.trim() || !code.trim()}
            style={{ width:'100%', height:54, borderRadius:10, border:'none', background: loading?'#2d2d3d':'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'white', fontSize:16, fontWeight:800, cursor: loading?'not-allowed':'pointer', opacity: loading?0.6:1 }}
          >
            {loading ? 'Joining...' : 'Join Event'}
          </button>
        </div>

        <p style={{ textAlign:'center', fontSize:12, color:'#334155', marginTop:20 }}>
          Contact your supervisor for the event code and your registered phone number.
        </p>
      </div>
    </div>
  );
}
