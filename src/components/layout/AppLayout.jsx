import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme, MOOD_KEYS, SHAPE_KEYS, DENSITY_KEYS } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'

export default function AppLayout({ children }) {
  const { profile, signOut } = useAuth()
  const { mood, shape, density, setMood, setShape, setDensity } = useTheme()
  const [showSettings, setShowSettings] = useState(false)
  const [hasShared,    setHasShared]    = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  // Check if anyone has shared tasks with this user
  useEffect(() => {
    if (!profile) return
    supabase.from('task_access').select('id', { count:'exact', head:true }).eq('viewer_id', profile.id)
      .then(({ count }) => setHasShared((count || 0) > 0))
  }, [profile])

  const onDashboard = location.pathname === '/dashboard'
  const onShared    = location.pathname === '/shared'

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--ink)' }}>
      {/* ── Top nav ── */}
      <nav style={{
        position:'sticky', top:0, zIndex:100,
        background:'var(--surface)', borderBottom:'1px solid var(--line)',
        padding:'0 clamp(12px,3vw,32px)',
        display:'flex', alignItems:'center', gap:12, height:52,
      }}>
        <span style={{ fontSize:15, fontWeight:800, letterSpacing:'-.02em', color:'var(--ink)' }}>Task Tracker</span>

        {/* nav tabs */}
        <div style={{ display:'flex', gap:4, marginLeft:8 }}>
          <NavTab label="My Tasks" active={onDashboard} onClick={() => navigate('/dashboard')} />
          {hasShared && <NavTab label="Shared with me" active={onShared} onClick={() => navigate('/shared')} />}
        </div>

        <div style={{ flex:1 }} />

        <button
          onClick={() => setShowSettings(v => !v)}
          style={{ background:'none', border:'1px solid var(--line)', borderRadius:'var(--rsm)', padding:'6px 10px', fontSize:12, fontWeight:600, color:'var(--muted)' }}
        >
          ⚙ Theme
        </button>

        <span style={{ fontSize:13, fontWeight:600, color:'var(--muted)' }} className="hide-mobile">
          {profile?.full_name || profile?.email}
        </span>
        <button
          onClick={signOut}
          style={{ background:'none', border:'1px solid var(--line)', borderRadius:'var(--rsm)', padding:'6px 10px', fontSize:12, fontWeight:600, color:'var(--muted)' }}
        >
          Sign out
        </button>
      </nav>

      {/* ── Theme panel ── */}
      {showSettings && (
        <div style={{ position:'fixed', top:60, right:16, zIndex:200, background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:18, boxShadow:'0 8px 24px rgba(0,0,0,.12)', width:220, animation:'pop .15s ease' }}>
          <ThemeGroup label="Theme" options={MOOD_KEYS}    value={mood}    onChange={setMood} />
          <ThemeGroup label="Shape" options={SHAPE_KEYS}   value={shape}   onChange={setShape} />
          <ThemeGroup label="Space" options={DENSITY_KEYS} value={density} onChange={setDensity} />
        </div>
      )}
      {showSettings && <div style={{ position:'fixed', inset:0, zIndex:199 }} onClick={() => setShowSettings(false)} />}

      <main style={{ padding:'0 clamp(12px,3vw,32px) 40px' }}>
        {children}
      </main>
    </div>
  )
}

function NavTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      border:'none', cursor:'pointer',
      padding:'6px 12px', borderRadius:'var(--rsm)',
      fontSize:13, fontWeight: active ? 700 : 600,
      color: active ? 'var(--ink)' : 'var(--muted)',
      background: active ? 'var(--surface2)' : 'none',
    }}>
      {label}
    </button>
  )
}

function ThemeGroup({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:6 }}>{label}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)} style={{ background: value === opt ? 'var(--ink)' : 'var(--surface2)', color: value === opt ? 'var(--surface)' : 'var(--ink)', border:'1px solid var(--line)', borderRadius:'var(--rsm)', padding:'4px 9px', fontSize:12, fontWeight:600 }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
