import { useState } from 'react'
import StepList from './StepList'

const STATUS_LABELS  = { todo:'To Do', in_progress:'In Progress', done:'Done', blocked:'Blocked' }
const STATUS_COLORS  = { todo:'var(--muted)', in_progress:'#3b82f6', done:'#30a46c', blocked:'#e5484d' }
const PRIORITY_COLORS = { low:'#30a46c', medium:'#f5b32e', high:'#e5484d' }

function hexAlpha(hex, a) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
  return `rgba(${r},${g},${b},${a})`
}

function relTime(ts) {
  if (!ts) return ''
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d/6e4), h = Math.floor(d/36e5), day = Math.floor(d/864e5)
  if (d < 6e4) return 'just now'
  if (m < 60)  return m+'m ago'
  if (h < 24)  return h+'h ago'
  if (day < 2) return 'yesterday'
  return day+'d ago'
}

export default function TaskCard({ task, onUpdate, onDelete, onToggleStep, onUpdateStep, onAddStep, onAddComment, readOnly = false }) {
  const [expanded, setExpanded] = useState(false)
  const [editing,  setEditing]  = useState(false)

  const cat     = task.categories
  const color   = cat?.color || '#8b8d98'
  const tint    = hexAlpha(color, 0.13)
  const steps   = task.task_steps || []
  const done    = steps.filter(s => s.done).length
  const pct     = steps.length ? Math.round(done / steps.length * 100) : 0
  const lastTs  = steps.length ? Math.max(...steps.map(s => new Date(s.updated_at || s.created_at).getTime())) : new Date(task.updated_at).getTime()

  return (
    <div style={{
      background: 'var(--surface)',
      border:     '1px solid var(--line)',
      borderRadius: 'var(--rad)',
      overflow:   'hidden',
      boxShadow:  'var(--shadow)',
    }}>
      {/* ── header row ── */}
      <div style={{ display:'flex', alignItems:'stretch' }}>
        {/* color bar */}
        <div style={{ width:5, background:color, flexShrink:0 }} />

        {/* main clickable area */}
        <div
          onClick={() => setExpanded(v => !v)}
          style={{ cursor:'pointer', flex:1, padding:'var(--cardpad)', minWidth:0 }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            {/* category chip */}
            {cat && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color, background:tint, padding:'3px 9px', borderRadius:999 }}>
                {cat.name}
              </span>
            )}
            {/* title */}
            <h3 style={{ fontSize:16, fontWeight:700, letterSpacing:'-.01em', color:'var(--ink)', flex:1, minWidth:0 }}>
              {task.title}
            </h3>

            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, flexWrap:'wrap' }}>
              {/* status badge */}
              <span style={{ fontSize:11, fontWeight:700, color: STATUS_COLORS[task.status], background: hexAlpha(STATUS_COLORS[task.status].startsWith('var') ? '#888' : STATUS_COLORS[task.status], 0.1), padding:'2px 8px', borderRadius:999 }}>
                {STATUS_LABELS[task.status]}
              </span>
              {/* priority dot */}
              <span style={{ width:8, height:8, borderRadius:'50%', background: PRIORITY_COLORS[task.priority] || 'var(--muted)', flexShrink:0 }} title={task.priority + ' priority'} />
              <span style={{ fontSize:12, fontWeight:600, color:'var(--muted)', whiteSpace:'nowrap' }}>Updated {relTime(lastTs)}</span>
              <span style={{ fontSize:13, color:'var(--muted)', transform:`rotate(${expanded ? 180 : 0}deg)`, transition:'transform .2s', display:'inline-block' }}>⌄</span>
            </div>
          </div>

          {/* progress bar */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:11 }}>
            <div style={{ flex:1, height:7, background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:999, overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:999, background:color, width:`${pct}%`, transition:'width .3s' }} />
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--ink)', whiteSpace:'nowrap' }}>{done}/{steps.length} steps</span>
          </div>

          {/* due date */}
          {task.due_date && (
            <div style={{ marginTop:6, fontSize:11.5, fontWeight:600, color:'var(--muted)' }}>
              Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
            </div>
          )}
        </div>

        {/* action buttons (owner only) */}
        {!readOnly && (
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', gap:6, padding:'0 12px', borderLeft:'1px solid var(--line)' }}>
            <button
              onClick={e => { e.stopPropagation(); setEditing(true) }}
              style={{ background:'none', border:'none', fontSize:13, color:'var(--muted)', padding:'4px 6px' }}
              title="Edit"
            >✎</button>
            <button
              onClick={e => { e.stopPropagation(); if (confirm('Delete this task?')) onDelete(task.id) }}
              style={{ background:'none', border:'none', fontSize:13, color:'#c0392b', opacity:.7, padding:'4px 6px' }}
              title="Delete"
            >✕</button>
          </div>
        )}
      </div>

      {/* ── steps ── */}
      {expanded && (
        <StepList
          task={task}
          catColor={color}
          onToggleStep={onToggleStep}
          onUpdateStep={onUpdateStep}
          onAddStep={onAddStep}
          onAddComment={onAddComment}
          readOnly={readOnly}
        />
      )}

      {/* ── inline edit form ── */}
      {editing && (
        <InlineEditForm task={task} onSave={patch => { onUpdate(task.id, patch); setEditing(false) }} onClose={() => setEditing(false)} />
      )}
    </div>
  )
}

function InlineEditForm({ task, onSave, onClose }) {
  const [title,    setTitle]    = useState(task.title)
  const [status,   setStatus]   = useState(task.status)
  const [priority, setPriority] = useState(task.priority)
  const [dueDate,  setDueDate]  = useState(task.due_date || '')
  const [desc,     setDesc]     = useState(task.description || '')

  function save() {
    if (!title.trim()) return
    onSave({ title: title.trim(), status, priority, dueDate: dueDate || null, description: desc })
  }

  return (
    <div style={{ borderTop:'1px solid var(--line)', padding:16, background:'var(--surface2)', animation:'pop .15s ease' }}>
      <input
        className="tt-input"
        style={{ width:'100%', fontSize:15, fontWeight:700, marginBottom:12 }}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save() }}
      />
      <textarea
        className="tt-tarea"
        rows={2}
        placeholder="Description (optional)"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        style={{ marginBottom:12 }}
      />
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:12 }}>
        <SelectPill label="Status"   value={status}   onChange={setStatus}   options={['todo','in_progress','done','blocked']} labels={STATUS_LABELS} />
        <SelectPill label="Priority" value={priority} onChange={setPriority} options={['low','medium','high']}                labels={{ low:'Low', medium:'Medium', high:'High' }} />
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="tt-input" style={{ fontSize:12 }} />
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:13, fontWeight:600, color:'var(--muted)', padding:'8px 10px' }}>Cancel</button>
        <button onClick={save} style={{ background:'var(--ink)', color:'var(--surface)', border:'none', borderRadius:'var(--rsm)', padding:'8px 18px', fontSize:13, fontWeight:600 }}>Save</button>
      </div>
    </div>
  )
}

function SelectPill({ label, value, onChange, options, labels }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="tt-input"
      style={{ fontSize:12, fontWeight:600 }}
    >
      {options.map(o => <option key={o} value={o}>{labels[o] || o}</option>)}
    </select>
  )
}
