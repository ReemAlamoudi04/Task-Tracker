import { useEffect } from 'react'

export default function Modal({ title, onClose, children, maxWidth = 480 }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <span style={{ fontSize:16, fontWeight:800, letterSpacing:'-.01em', color:'var(--ink)' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, color:'var(--muted)', lineHeight:1, padding:'4px 6px' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
