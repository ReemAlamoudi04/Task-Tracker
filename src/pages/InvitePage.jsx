import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function InvitePage() {
  const { token } = useParams()
  const { session, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ready | accepting | accepted | invalid | self
  const [invite, setInvite] = useState(null)

  useEffect(() => {
    if (loading) return

    supabase
      .from('invite_links')
      .select('id, permission, owner_id, profiles!invite_links_owner_id_fkey(full_name, email)')
      .eq('token', token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setStatus('invalid'); return }
        setInvite(data)

        if (!session) {
          // Not logged in — send to auth, preserving the token
          navigate(`/auth?invite=${token}`, { replace: true })
          return
        }

        setStatus('ready')
      })
  }, [token, session, loading])

  async function accept() {
    if (!profile || !invite) return
    if (profile.id === invite.owner_id) { setStatus('self'); return }

    setStatus('accepting')
    const { error } = await supabase
      .from('task_access')
      .upsert(
        { owner_id: invite.owner_id, viewer_id: profile.id, permission: invite.permission },
        { onConflict: 'owner_id,viewer_id' }
      )

    if (error) { setStatus('invalid'); return }
    setStatus('accepted')
    setTimeout(() => navigate('/dashboard'), 2200)
  }

  const ownerName = invite?.profiles?.full_name || invite?.profiles?.email || 'Someone'
  const permLabel = invite?.permission === 'edit' ? 'Edit (can add tasks & steps)' : 'View (read + comment)'

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:'32px 28px', boxShadow:'0 2px 16px rgba(0,0,0,.07)', textAlign:'center' }}>

          {status === 'loading' && <p style={{ color:'var(--muted)', fontSize:14 }}>Loading invite…</p>}

          {status === 'invalid' && (
            <>
              <div style={{ fontSize:32, marginBottom:12 }}>🔗</div>
              <h2 style={{ fontSize:18, fontWeight:800, color:'var(--ink)', marginBottom:8 }}>Invalid invite</h2>
              <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>This invite link is invalid or has been revoked.</p>
              <button onClick={() => navigate('/dashboard')} style={{ marginTop:20, background:'var(--ink)', color:'var(--surface)', border:'none', borderRadius:'var(--rsm)', padding:'10px 24px', fontSize:13, fontWeight:700 }}>Go to dashboard</button>
            </>
          )}

          {status === 'self' && (
            <>
              <div style={{ fontSize:32, marginBottom:12 }}>🙃</div>
              <h2 style={{ fontSize:18, fontWeight:800, color:'var(--ink)', marginBottom:8 }}>That's your own link</h2>
              <p style={{ fontSize:13, color:'var(--muted)' }}>Share this link with someone else.</p>
              <button onClick={() => navigate('/dashboard')} style={{ marginTop:20, background:'var(--ink)', color:'var(--surface)', border:'none', borderRadius:'var(--rsm)', padding:'10px 24px', fontSize:13, fontWeight:700 }}>Back to dashboard</button>
            </>
          )}

          {status === 'ready' && invite && (
            <>
              <div style={{ fontSize:32, marginBottom:12 }}>📋</div>
              <h2 style={{ fontSize:20, fontWeight:800, color:'var(--ink)', marginBottom:6 }}>You're invited</h2>
              <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6, marginBottom:16 }}>
                <strong style={{ color:'var(--ink)' }}>{ownerName}</strong> wants to share their task board with you.
              </p>
              <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:999, background: invite.permission === 'edit' ? 'rgba(139,92,246,.1)' : 'rgba(59,130,246,.1)', marginBottom:24 }}>
                <span style={{ fontSize:12, fontWeight:700, color: invite.permission === 'edit' ? '#8b5cf6' : '#3b82f6' }}>{permLabel}</span>
              </div>
              <button
                onClick={accept}
                style={{ display:'block', width:'100%', background:'var(--ink)', color:'var(--surface)', border:'none', borderRadius:'var(--rsm)', padding:'12px', fontSize:14, fontWeight:700, cursor:'pointer' }}
              >
                Accept invite
              </button>
            </>
          )}

          {status === 'accepting' && <p style={{ color:'var(--muted)', fontSize:14 }}>Granting access…</p>}

          {status === 'accepted' && (
            <>
              <div style={{ fontSize:32, marginBottom:12 }}>✅</div>
              <h2 style={{ fontSize:18, fontWeight:800, color:'var(--ink)', marginBottom:8 }}>Access granted!</h2>
              <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>
                You can now {invite?.permission === 'edit' ? 'view and edit' : 'view'} <strong style={{ color:'var(--ink)' }}>{ownerName}</strong>'s tasks. Redirecting…
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
