import { useState } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function ShareModal({ onClose }) {
  const { profile } = useAuth()
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState(null) // { ok: bool, msg: string }
  const [busy,   setBusy]   = useState(false)

  async function handleShare() {
    const addr = email.trim().toLowerCase()
    if (!addr) return
    setBusy(true)
    setStatus(null)

    const { data: target, error: findErr } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('email', addr)
      .maybeSingle()

    if (findErr || !target) {
      setStatus({ ok: false, msg: 'No account found with that email.' })
      setBusy(false)
      return
    }
    if (target.role !== 'manager') {
      setStatus({ ok: false, msg: 'That user is not signed up as a manager.' })
      setBusy(false)
      return
    }
    if (target.id === profile?.id) {
      setStatus({ ok: false, msg: 'You cannot share with yourself.' })
      setBusy(false)
      return
    }

    const { error: shareErr } = await supabase
      .from('task_access')
      .upsert({ owner_id: profile.id, viewer_id: target.id, permission: 'read' })

    if (shareErr) {
      setStatus({ ok: false, msg: shareErr.message })
    } else {
      setStatus({ ok: true, msg: `Shared with ${target.full_name || addr}! They can now view your tasks.` })
      setEmail('')
    }
    setBusy(false)
  }

  return (
    <Modal title="Share with manager" onClose={onClose}>
      <p style={{ fontSize:13, color:'var(--muted)', marginBottom:16, lineHeight:1.5 }}>
        Enter the email of a manager account. They'll get read-only access to all your tasks.
      </p>
      <div style={{ display:'flex', gap:8 }}>
        <input
          autoFocus
          className="tt-input"
          style={{ flex:1 }}
          type="email"
          placeholder="manager@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleShare() }}
        />
        <button
          onClick={handleShare}
          disabled={busy || !email.trim()}
          style={{
            background:'var(--ink)', color:'var(--surface)', border:'none',
            borderRadius:'var(--rsm)', padding:'9px 16px', fontSize:13, fontWeight:600,
            opacity: (busy || !email.trim()) ? .5 : 1,
          }}
        >
          {busy ? '…' : 'Share'}
        </button>
      </div>

      {status && (
        <div style={{ marginTop:12, padding:'10px 12px', borderRadius:'var(--rsm)', fontSize:13, lineHeight:1.45,
          background: status.ok ? 'rgba(48,164,108,.12)' : 'rgba(229,72,77,.10)',
          color:      status.ok ? '#30a46c' : '#c0392b',
          border:     `1px solid ${status.ok ? 'rgba(48,164,108,.25)' : 'rgba(229,72,77,.2)'}`,
        }}>
          {status.msg}
        </div>
      )}

      <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--line)' }}>
        <AccessList ownerId={profile?.id} />
      </div>
    </Modal>
  )
}

function AccessList({ ownerId }) {
  const [rows, setRows] = useState(null)

  if (rows === null) {
    supabase.from('task_access').select('id, viewer_id, profiles!task_access_viewer_id_fkey(full_name, email)').eq('owner_id', ownerId).then(({ data }) => setRows(data || []))
    return <div style={{ fontSize:12, color:'var(--muted)' }}>Loading access list…</div>
  }
  if (!rows.length) return <p style={{ fontSize:12, color:'var(--muted)' }}>No managers have access yet.</p>

  async function revoke(id) {
    await supabase.from('task_access').delete().eq('id', id)
    setRows(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Current access</div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {rows.map(r => (
          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--surface2)', borderRadius:'var(--rsm)', border:'1px solid var(--line)' }}>
            <span style={{ flex:1, fontSize:13, fontWeight:600, color:'var(--ink)' }}>
              {r.profiles?.full_name || r.profiles?.email || 'Unknown'}
            </span>
            <span style={{ fontSize:11, color:'var(--muted)' }}>{r.profiles?.email}</span>
            <button onClick={() => revoke(r.id)} style={{ background:'none', border:'none', fontSize:11, fontWeight:700, color:'#c0392b', opacity:.7, padding:'2px 6px' }}>Revoke</button>
          </div>
        ))}
      </div>
    </div>
  )
}
