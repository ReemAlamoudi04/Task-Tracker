import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function AuthPage() {
  const { session, profile, loading, signIn, signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const pendingInvite = searchParams.get('invite')

  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [busy,     setBusy]     = useState(false)
  const [err,      setErr]      = useState('')
  const [info,     setInfo]     = useState('')

  if (!loading && session && profile) {
    if (pendingInvite) return <Navigate to={`/invite/${pendingInvite}`} replace />
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setInfo('')
    if (!email.trim() || !password.trim()) { setErr('Email and password are required.'); return }
    if (mode === 'signup' && !name.trim()) { setErr('Please enter your name.'); return }
    setBusy(true)

    if (mode === 'login') {
      const { error } = await signIn(email.trim(), password)
      if (error) setErr(error.message)
    } else {
      const { error } = await signUp(email.trim(), password, name.trim(), 'owner')
      if (error) setErr(error.message)
      else setInfo('Check your email to confirm your account, then log in.')
    }
    setBusy(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:48, height:48, borderRadius:14, background:'var(--ink)', marginBottom:14 }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="4" y="7"  width="18" height="3" rx="1.5" fill="white"/>
              <rect x="4" y="12" width="13" height="3" rx="1.5" fill="white" opacity=".7"/>
              <rect x="4" y="17" width="15" height="3" rx="1.5" fill="white" opacity=".5"/>
            </svg>
          </div>
          <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-.02em', color:'var(--ink)', lineHeight:1.1 }}>Task Tracker</h1>
          <p style={{ fontSize:13, color:'var(--muted)', marginTop:6 }}>Your work, clearly.</p>
          {pendingInvite && (
            <div style={{ marginTop:12, fontSize:13, fontWeight:600, color:'#3b82f6', background:'rgba(59,130,246,.08)', padding:'8px 14px', borderRadius:'var(--rsm)' }}>
              Sign in or create an account to accept your invite.
            </div>
          )}
        </div>

        <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:'28px 24px', boxShadow:'0 2px 16px rgba(0,0,0,.07)' }}>
          <h2 style={{ fontSize:17, fontWeight:800, color:'var(--ink)', marginBottom:20 }}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {mode === 'signup' && (
              <FormField label="Full name">
                <input className="tt-input" style={{ width:'100%' }} type="text" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              </FormField>
            )}
            <FormField label="Email">
              <input className="tt-input" style={{ width:'100%' }} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
            </FormField>
            <FormField label="Password">
              <input className="tt-input" style={{ width:'100%' }} type="password" placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </FormField>

            {err  && <div style={{ fontSize:12.5, color:'#e5484d', padding:'8px 10px', background:'rgba(229,72,77,.08)', borderRadius:'var(--rsm)' }}>{err}</div>}
            {info && <div style={{ fontSize:12.5, color:'#30a46c', padding:'8px 10px', background:'rgba(48,164,108,.1)',  borderRadius:'var(--rsm)' }}>{info}</div>}

            <button type="submit" disabled={busy} style={{ marginTop:6, background:'var(--ink)', color:'var(--surface)', border:'none', borderRadius:'var(--rsm)', padding:12, fontSize:14, fontWeight:700, opacity: busy ? .6 : 1, minHeight:44 }}>
              {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--muted)' }}>
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setErr(''); setInfo('') }} style={{ background:'none', border:'none', fontWeight:700, color:'var(--ink)', textDecoration:'underline', fontSize:'inherit', cursor:'pointer' }}>Sign up</button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setErr(''); setInfo('') }} style={{ background:'none', border:'none', fontWeight:700, color:'var(--ink)', textDecoration:'underline', fontSize:'inherit', cursor:'pointer' }}>Sign in</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', marginBottom:5 }}>{label}</div>
      {children}
    </div>
  )
}
