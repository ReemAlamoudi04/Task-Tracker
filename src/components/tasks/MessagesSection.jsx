import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'

function loadMsgs() {
  try {
    const r = localStorage.getItem('tt_msgs_v1')
    return r ? JSON.parse(r) : [
      { id:'m0', author:'System', text:'Welcome! Use this space to leave notes and messages.', ts: Date.now()-3600000 }
    ]
  } catch { return [] }
}
function saveMsgs(msgs) { try { localStorage.setItem('tt_msgs_v1', JSON.stringify(msgs)) } catch {} }

function relTime(ts) {
  const d = Date.now()-ts, m=Math.floor(d/6e4), h=Math.floor(d/36e5), day=Math.floor(d/864e5)
  if (d<6e4) return 'just now'
  if (m<60) return m+'m ago'
  if (h<24) return h+'h ago'
  if (day===1) return 'yesterday'
  return day+'d ago'
}

function hexAlpha(hex, a) {
  if (!hex || hex.startsWith('var')) return `rgba(136,136,136,${a})`
  const h = hex.replace('#','')
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16)
  return `rgba(${r},${g},${b},${a})`
}

export default function MessagesSection() {
  const { profile } = useAuth()
  const [msgs,  setMsgs]  = useState(loadMsgs)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  function send() {
    const v = draft.trim()
    if (!v || !profile) return
    const newMsg = { id:'m'+Math.random().toString(36).slice(2,8), author: profile.full_name||profile.email||'You', text:v, ts:Date.now() }
    const next = [...msgs, newMsg]
    setMsgs(next); saveMsgs(next); setDraft('')
  }

  const myName = profile?.full_name || profile?.email || 'You'

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:21, fontWeight:800, letterSpacing:'-.01em', color:'var(--ink)' }}>Messages</h2>
        <span style={{ fontSize:13, fontWeight:600, color:'var(--muted)' }}>{msgs.length} messages</span>
      </div>
      <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', boxShadow:'var(--shadow)', overflow:'hidden', display:'flex', flexDirection:'column', maxWidth:760 }}>
        <div style={{ padding:'18px 18px 8px', display:'flex', flexDirection:'column', gap:14, maxHeight:380, overflowY:'auto' }}>
          {msgs.map(m => {
            const isMe = m.author === myName
            const initials = (m.author||'?').trim().charAt(0).toUpperCase()
            return (
              <div key={m.id} style={{ display:'flex', gap:10, alignItems:'flex-start', flexDirection: isMe?'row-reverse':'row' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background: isMe?'var(--accentGrad)':hexAlpha('#8b5cf6',0.2), color: isMe?'#fff':'#a78bfa', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0 }}>
                  {initials}
                </div>
                <div style={{ maxWidth:'74%' }}>
                  <div style={{ display:'flex', gap:8, alignItems:'baseline', marginBottom:3, flexDirection: isMe?'row-reverse':'row' }}>
                    <span style={{ fontSize:12.5, fontWeight:700, color:'var(--ink)' }}>{m.author}</span>
                    <span style={{ fontSize:11, color:'var(--muted)' }}>{relTime(m.ts)}</span>
                  </div>
                  <div style={{ fontSize:13.5, lineHeight:1.5, color: isMe?'#fff':'var(--ink)', background: isMe?'var(--accentGrad)':'var(--surface2)', border: isMe?'none':'1px solid var(--line)', padding:'9px 13px', borderRadius:13 }}>
                    {m.text}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding:'12px 14px', borderTop:'1px solid var(--line)', display:'flex', gap:10, alignItems:'center', background:'var(--surface2)' }}>
          <input
            value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send() }}
            placeholder="Write a message… (Enter to send)"
            style={{ flex:1, border:'1px solid var(--line)', borderRadius:999, padding:'10px 16px', fontSize:13.5, outline:'none', background:'var(--surface)', color:'var(--ink)' }}
          />
          <button onClick={send} style={{ background:'var(--accentGrad)', color:'#fff', border:'none', borderRadius:999, padding:'10px 20px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Send</button>
        </div>
      </div>
    </div>
  )
}
