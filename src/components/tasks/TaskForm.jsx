import { useState } from 'react'
import Modal from '../common/Modal'

const STATUS_OPTS   = [['todo','To Do'],['in_progress','In Progress'],['done','Done'],['blocked','Blocked']]
const PRIORITY_OPTS = [['low','Low'],['medium','Medium'],['high','High']]

export default function TaskForm({ categories, onSave, onClose }) {
  const [title,      setTitle]      = useState('')
  const [desc,       setDesc]       = useState('')
  const [status,     setStatus]     = useState('todo')
  const [priority,   setPriority]   = useState('medium')
  const [dueDate,    setDueDate]    = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState('')

  async function handleSave() {
    if (!title.trim()) { setErr('Title is required.'); return }
    setSaving(true)
    const error = await onSave({ title: title.trim(), description: desc, status, priority, dueDate: dueDate || null, categoryId: categoryId || null })
    setSaving(false)
    if (error) { setErr(error.message); return }
    onClose()
  }

  return (
    <Modal title="New task" onClose={onClose}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <input
          autoFocus
          className="tt-input"
          style={{ width:'100%', fontSize:16, fontWeight:700 }}
          placeholder="What needs doing?"
          value={title}
          onChange={e => { setTitle(e.target.value); setErr('') }}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
        />

        <textarea
          className="tt-tarea"
          rows={2}
          placeholder="Description (optional)"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Field label="Status">
            <select className="tt-input" style={{ width:'100%' }} value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="tt-input" style={{ width:'100%' }} value={priority} onChange={e => setPriority(e.target.value)}>
              {PRIORITY_OPTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Field label="Category">
            <select className="tt-input" style={{ width:'100%' }} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">— none —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Due date">
            <input type="date" className="tt-input" style={{ width:'100%' }} value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </Field>
        </div>

        {err && <div style={{ fontSize:12, color:'#e5484d' }}>{err}</div>}

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', paddingTop:4 }}>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:13, fontWeight:600, color:'var(--muted)', padding:'8px 10px' }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background:'var(--ink)', color:'var(--surface)', border:'none', borderRadius:'var(--rsm)', padding:'9px 22px', fontSize:13, fontWeight:600, opacity: saving ? .6 : 1 }}
          >
            {saving ? 'Creating…' : 'Create task'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase', color:'var(--muted)', marginBottom:5 }}>{label}</div>
      {children}
    </div>
  )
}
