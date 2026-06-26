import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_COLOR = { todo:'var(--muted)', in_progress:'#3b82f6', done:'#30a46c', blocked:'#e5484d' }

function relTime(ts) {
  if (!ts) return ''
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d / 6e4), h = Math.floor(d / 36e5), day = Math.floor(d / 864e5)
  if (d < 6e4) return 'just now'
  if (m < 60)  return m + 'm ago'
  if (h < 24)  return h + 'h ago'
  if (day < 2) return 'yesterday'
  return day + 'd ago'
}

export default function StepList({ task, catColor, onToggleStep, onUpdateStep, onAddStep, onAddComment, readOnly = false }) {
  return (
    <div style={{ borderTop:'1px solid var(--line)', padding:'6px 18px 18px', background:'var(--surface2)' }}>
      {task.task_steps.map((step, idx) => (
        <Step
          key={step.id}
          step={step}
          isLast={idx === task.task_steps.length - 1}
          catColor={catColor}
          onToggle={() => onToggleStep(step.id, !step.done)}
          onUpdateStep={onUpdateStep}
          onAddComment={onAddComment}
          readOnly={readOnly}
        />
      ))}

      {!readOnly && (
        <div style={{ paddingTop:16, paddingLeft:36 }}>
          <AddStepInput onAdd={title => onAddStep(task.id, title)} />
        </div>
      )}
    </div>
  )
}

function Step({ step, isLast, catColor, onToggle, onUpdateStep, onAddComment, readOnly }) {
  const [open, setOpen] = useState(false)
  const { profile } = useAuth()

  return (
    <div style={{ display:'flex', gap:14, paddingTop:16 }}>
      {/* timeline */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
        <button
          onClick={readOnly ? undefined : onToggle}
          disabled={readOnly}
          style={{
            width:22, height:22, borderRadius:'50%',
            border:`2px solid ${step.done ? catColor : 'var(--line)'}`,
            background: step.done ? catColor : 'var(--surface)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:11, fontWeight:800,
            cursor: readOnly ? 'default' : 'pointer',
            flexShrink:0,
          }}
        >
          {step.done ? '✓' : ''}
        </button>
        {!isLast && <div style={{ flex:1, width:2, background:'var(--line)', marginTop:4, minHeight:8 }} />}
      </div>

      {/* content */}
      <div style={{ flex:1, minWidth:0, paddingBottom:4 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', whiteSpace:'nowrap' }}>
            {relTime(step.created_at)}
          </span>
          <span style={{
            fontSize:14.5, fontWeight:700,
            color: step.done ? 'var(--muted)' : 'var(--ink)',
            textDecoration: step.done ? 'line-through' : 'none',
            flex:1,
          }}>
            {step.title}
          </span>
          <button
            onClick={() => setOpen(v => !v)}
            style={{ background:'none', border:'none', fontSize:12, fontWeight:600, color:'var(--muted)', whiteSpace:'nowrap', padding:'0 0 0 8px' }}
          >
            {open ? 'Hide details' : 'Details'}
          </button>
        </div>

        {open && (
          <div style={{ marginTop:11, display:'grid', gap:12, animation:'pop .16s ease' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
              <LabelledArea label="⸖ Input"   value={step.input}   onChange={readOnly ? null : v => onUpdateStep(step.id, { input: v })}   placeholder="What went in…" />
              <LabelledArea label="✓ Outcome" value={step.outcome} onChange={readOnly ? null : v => onUpdateStep(step.id, { outcome: v })} placeholder="Result / what came out…" />
            </div>
            <LabelledArea label="Notes" value={step.notes} onChange={readOnly ? null : v => onUpdateStep(step.id, { notes: v })} placeholder="Notes…" />

            {/* comments */}
            <div>
              <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Comments</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {(step.step_comments || []).map(c => (
                  <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rsm)', padding:'8px 11px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--ink)' }}>{c.author_name || 'User'}</span>
                      <span style={{ fontSize:11, color:'var(--muted)' }}>{relTime(c.created_at)}</span>
                    </div>
                    <div style={{ fontSize:13, lineHeight:1.45, color:'var(--ink)' }}>{c.text}</div>
                  </div>
                ))}
                <input
                  className="tt-input"
                  placeholder="Add a comment… (Enter to send)"
                  style={{ width:'100%' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const v = e.target.value.trim()
                      if (v && profile) { onAddComment(step.id, profile.id, v); e.target.value = '' }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LabelledArea({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:5 }}>{label}</div>
      <textarea
        className="tt-tarea"
        rows={2}
        placeholder={placeholder}
        defaultValue={value}
        readOnly={!onChange}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        onBlur={onChange ? e => onChange(e.target.value) : undefined}
      />
    </div>
  )
}

function AddStepInput({ onAdd }) {
  return (
    <input
      className="tt-input"
      style={{ width:'100%', borderStyle:'dashed' }}
      placeholder="Add a step and press Enter…"
      onKeyDown={e => {
        if (e.key === 'Enter') {
          const v = e.target.value.trim()
          if (v) { onAdd(v); e.target.value = '' }
        }
      }}
    />
  )
}
