import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

function relTime(ts) {
  if (!ts) return ''
  const d = Date.now()-new Date(ts).getTime()
  const m=Math.floor(d/6e4), h=Math.floor(d/36e5), day=Math.floor(d/864e5)
  if (d<6e4) return 'just now'
  if (m<60)  return m+'m ago'
  if (h<24)  return h+'h ago'
  if (day<2) return 'yesterday'
  return day+'d ago'
}

export default function StepList({ task, catColor, canEdit=true, onToggleStep, onUpdateStep, onUpdateSubsteps, onAddStep, onAddComment }) {
  return (
    <div style={{ borderTop:'1px solid var(--line)', padding:'6px 18px 18px', background:'var(--surface2)' }}>
      {task.task_steps.map((step, idx) => (
        <Step
          key={step.id}
          step={step}
          isLast={idx === task.task_steps.length-1}
          catColor={catColor}
          canEdit={canEdit}
          onToggle={() => onToggleStep(step.id, !step.done)}
          onUpdateStep={onUpdateStep}
          onUpdateSubsteps={onUpdateSubsteps}
          onAddComment={onAddComment}
        />
      ))}

      {canEdit && (
        <div style={{ paddingTop:16, paddingLeft:36 }}>
          <input
            className="tt-input"
            style={{ width:'100%', borderStyle:'dashed' }}
            placeholder="Add a step and press Enter…"
            onKeyDown={e => {
              if (e.key==='Enter') {
                const v = e.target.value.trim()
                if (v) { onAddStep(task.id, v); e.target.value='' }
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

function Step({ step, isLast, catColor, canEdit, onToggle, onUpdateStep, onUpdateSubsteps, onAddComment }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const { profile } = useAuth()
  const substeps = step.substeps || []

  function toggleSubstep(idx) {
    const next = substeps.map((s,i) => i===idx ? {...s, done:!s.done} : s)
    onUpdateSubsteps && onUpdateSubsteps(step.id, next)
  }
  function deleteSubstep(idx) {
    const next = substeps.filter((_,i) => i!==idx)
    onUpdateSubsteps && onUpdateSubsteps(step.id, next)
  }
  function addSubstep(title) {
    const next = [...substeps, { title, done:false }]
    onUpdateSubsteps && onUpdateSubsteps(step.id, next)
  }

  return (
    <div style={{ display:'flex', gap:14, paddingTop:16 }}>
      {/* timeline */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
        <button
          onClick={canEdit ? onToggle : undefined}
          disabled={!canEdit}
          style={{ width:22, height:22, borderRadius:'50%', border:`2px solid ${step.done?catColor:'var(--line)'}`, background:step.done?catColor:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:800, cursor:canEdit?'pointer':'default', flexShrink:0 }}
        >
          {step.done ? '✓' : ''}
        </button>
        {!isLast && <div style={{ flex:1, width:2, background:'var(--line)', marginTop:4, minHeight:8 }}/>}
      </div>

      {/* content */}
      <div style={{ flex:1, minWidth:0, paddingBottom:4 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:11.5, fontWeight:600, color:'var(--muted)', whiteSpace:'nowrap' }}>{relTime(step.created_at)}</span>
          <span style={{ fontSize:14.5, fontWeight:700, color:step.done?'var(--muted)':'var(--ink)', textDecoration:step.done?'line-through':'none', flex:1 }}>
            {step.title}
          </span>
          {substeps.length > 0 && (
            <span style={{ fontSize:10.5, fontWeight:700, color:'var(--muted)', background:'var(--surface)', border:'1px solid var(--line)', padding:'2px 8px', borderRadius:999 }}>
              ✓ {substeps.filter(s=>s.done).length}/{substeps.length}
            </span>
          )}
          <button onClick={() => setDetailOpen(v=>!v)} style={{ background:'none', border:'none', fontSize:12, fontWeight:600, color:'var(--muted)', whiteSpace:'nowrap', padding:'0 0 0 8px', cursor:'pointer' }}>
            {detailOpen ? 'Hide details' : 'Details'}
          </button>
        </div>

        {/* Subtasks — always visible */}
        <div style={{ marginTop:substeps.length>0?8:0, display:'flex', flexDirection:'column', gap:6 }}>
          {substeps.map((sub, idx) => (
            <div key={idx} style={{ display:'flex', alignItems:'center', gap:9 }}>
              <button
                onClick={canEdit ? () => toggleSubstep(idx) : undefined}
                disabled={!canEdit}
                style={{ width:17, height:17, borderRadius:6, border:`1.5px solid ${sub.done?catColor:'var(--muted)'}`, background:sub.done?catColor:'transparent', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:9, fontWeight:800, flexShrink:0, cursor:canEdit?'pointer':'default' }}
              >
                {sub.done ? '✓' : ''}
              </button>
              <span style={{ fontSize:13, fontWeight:500, color:sub.done?'var(--muted)':'var(--ink)', textDecoration:sub.done?'line-through':'none', flex:1 }}>{sub.title}</span>
              {canEdit && (
                <button onClick={() => deleteSubstep(idx)} style={{ background:'none', border:'none', fontSize:16, color:'var(--muted)', opacity:.5, lineHeight:1, cursor:'pointer', padding:'0 2px' }}>×</button>
              )}
            </div>
          ))}
          {canEdit && (
            <input
              placeholder="+ Add subtask…"
              onKeyDown={e => { if (e.key==='Enter') { const v=e.target.value.trim(); if(v){ addSubstep(v); e.target.value='' } } }}
              style={{ width:'100%', maxWidth:300, border:'none', borderBottom:'1px dashed var(--line)', background:'transparent', padding:'4px 2px', fontSize:12.5, outline:'none', color:'var(--ink)' }}
            />
          )}
        </div>

        {/* Detail panel */}
        {detailOpen && (
          <div style={{ marginTop:11, display:'grid', gap:12, animation:'pop .16s ease' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12 }}>
              <LabelledArea label="⸖ Input"   value={step.input}   onChange={canEdit ? v => onUpdateStep(step.id, {input:v})   : null} placeholder="What went in…" />
              <LabelledArea label="✓ Outcome" value={step.outcome} onChange={canEdit ? v => onUpdateStep(step.id, {outcome:v}) : null} placeholder="Result / what came out…" />
            </div>
            <LabelledArea label="Notes" value={step.notes} onChange={canEdit ? v => onUpdateStep(step.id, {notes:v}) : null} placeholder="Notes…" />

            <div>
              <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--muted)', marginBottom:7 }}>Comments</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {(step.step_comments||[]).map(c => {
                  const authorName = c.profiles?.full_name || c.profiles?.email || 'User'
                  return (
                    <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rsm)', padding:'8px 11px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:'var(--ink)' }}>{authorName}</span>
                        <span style={{ fontSize:11, color:'var(--muted)' }}>{relTime(c.created_at)}</span>
                      </div>
                      <div style={{ fontSize:13, lineHeight:1.45, color:'var(--ink)' }}>{c.text}</div>
                    </div>
                  )
                })}
                <input
                  className="tt-input"
                  placeholder="Add a comment… (Enter to send)"
                  style={{ width:'100%' }}
                  onKeyDown={e => {
                    if (e.key==='Enter') {
                      const v = e.target.value.trim()
                      if (v && profile) { onAddComment(step.id, profile.id, v); e.target.value='' }
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
        onBlur={onChange ? e => onChange(e.target.value) : undefined}
      />
    </div>
  )
}
