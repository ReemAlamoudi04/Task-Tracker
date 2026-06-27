import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const PERMISSION_INFO = {
  read: { label:'View', desc:'Can see tasks and leave comments. Cannot add or change anything.' },
  edit: { label:'Edit', desc:'Can add tasks, add steps, and update task status.' },
}

export default function ShareModal({ onClose }) {
  const { profile } = useAuth()
  const [permission,  setPermission]  = useState('read')
  const [generated,   setGenerated]   = useState(null) // { url, id }
  const [busy,        setBusy]        = useState(false)
  const [copied,      setCopied]      = useState(false)
  const [links,       setLinks]       = useState(null)
  const [access,      setAccess]      = useState(null)

  useEffect(() => { if (profile) { loadLinks(); loadAccess() } }, [profile])

  async function loadLinks() {
    const { data } = await supabase
      .from('invite_links')
      .select('id, token, permission, created_at')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
    setLinks(data || [])
  }

  async function loadAccess() {
    const { data } = await supabase
      .from('task_access')
      .select('id, permission, profiles!task_access_viewer_id_fkey(full_name, email)')
      .eq('owner_id', profile.id)
    setAccess(data || [])
  }

  async function generateLink() {
    setBusy(true)
    const { data, error } = await supabase
      .from('invite_links')
      .insert({ owner_id: profile.id, permission })
      .select('id, token')
      .single()
    setBusy(false)
    if (error || !data) return
    const url = `${window.location.origin}/invite/${data.token}`
    setGenerated({ url, id: data.id })
    loadLinks()
  }

  async function revokeLink(id) {
    await supabase.from('invite_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
    if (generated?.id === id) setGenerated(null)
  }

  async function revokeAccess(id) {
    await supabase.from('task_access').delete().eq('id', id)
    setAccess(prev => prev.filter(a => a.id !== id))
  }

  function copy(url) {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <Modal title="Share your tasks" onClose={onClose} maxWidth={520}>
      {/* ── Generate link ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase', color:'var(--muted)', marginBottom:10 }}>Create invite link</div>

        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          {Object.entries(PERMISSION_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setPermission(key)}
              style={{
                flex:1, textAlign:'left', cursor:'pointer',
                border:`2px solid ${permission === key ? 'var(--ink)' : 'var(--line)'}`,
                borderRadius:'var(--rsm)', padding:'10px 12px',
                background: permission === key ? 'var(--ink)' : 'var(--surface2)',
              }}
            >
              <div style={{ fontSize:13, fontWeight:700, color: permission === key ? 'var(--surface)' : 'var(--ink)' }}>{info.label}</div>
              <div style={{ fontSize:11, color: permission === key ? 'rgba(255,255,255,.6)' : 'var(--muted)', marginTop:2, lineHeight:1.4 }}>{info.desc}</div>
            </button>
          ))}
        </div>

        <button
          onClick={generateLink}
          disabled={busy}
          style={{ width:'100%', background:'var(--ink)', color:'var(--surface)', border:'none', borderRadius:'var(--rsm)', padding:'10px', fontSize:13, fontWeight:700, opacity: busy ? .6 : 1 }}
        >
          {busy ? 'Generating…' : '+ Generate invite link'}
        </button>

        {generated && (
          <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--rsm)', animation:'pop .15s ease' }}>
            <input readOnly value={generated.url} style={{ flex:1, border:'none', background:'transparent', fontSize:12, color:'var(--ink)', outline:'none', minWidth:0 }} onClick={e => e.target.select()} />
            <button
              onClick={() => copy(generated.url)}
              style={{ background: copied ? '#30a46c' : 'var(--ink)', color:'var(--surface)', border:'none', borderRadius:'var(--rsm)', padding:'6px 12px', fontSize:12, fontWeight:700, whiteSpace:'nowrap', flexShrink:0 }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {/* ── Active links ── */}
      {links && links.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Active links</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {links.map(l => {
              const url = `${window.location.origin}/invite/${l.token}`
              return (
                <div key={l.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--rsm)' }}>
                  <PermBadge permission={l.permission} />
                  <span style={{ flex:1, fontSize:11.5, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{url}</span>
                  <button onClick={() => copy(url)} style={{ background:'none', border:'none', fontSize:11, fontWeight:700, color:'var(--muted)', padding:'2px 6px' }}>Copy</button>
                  <button onClick={() => revokeLink(l.id)} style={{ background:'none', border:'none', fontSize:11, fontWeight:700, color:'#c0392b', opacity:.8, padding:'2px 6px' }}>Revoke</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── People with access ── */}
      {access && access.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>People with access</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {access.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--rsm)' }}>
                <PermBadge permission={a.permission} />
                <span style={{ flex:1, fontSize:13, fontWeight:600, color:'var(--ink)' }}>{a.profiles?.full_name || a.profiles?.email}</span>
                <span style={{ fontSize:11, color:'var(--muted)' }}>{a.profiles?.email}</span>
                <button onClick={() => revokeAccess(a.id)} style={{ background:'none', border:'none', fontSize:11, fontWeight:700, color:'#c0392b', opacity:.8, padding:'2px 6px' }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {access !== null && access.length === 0 && links !== null && links.length === 0 && (
        <p style={{ fontSize:13, color:'var(--muted)', textAlign:'center', padding:'8px 0' }}>Generate a link above and share it — anyone with the link can access your tasks.</p>
      )}
    </Modal>
  )
}

function PermBadge({ permission }) {
  const colors = { read: { bg:'rgba(59,130,246,.1)', color:'#3b82f6' }, edit: { bg:'rgba(139,92,246,.1)', color:'#8b5cf6' } }
  const c = colors[permission] || colors.read
  return (
    <span style={{ fontSize:10, fontWeight:800, letterSpacing:'.04em', textTransform:'uppercase', padding:'2px 7px', borderRadius:999, background:c.bg, color:c.color, flexShrink:0 }}>
      {permission === 'read' ? 'View' : 'Edit'}
    </span>
  )
}
