import { useState, useMemo } from 'react'
import AppLayout from '../components/layout/AppLayout'
import TaskCard from '../components/tasks/TaskCard'
import ShareModal from '../components/tasks/ShareModal'
import CalendarSection from '../components/tasks/CalendarSection'
import MessagesSection from '../components/tasks/MessagesSection'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { useCategories, PALETTE } from '../hooks/useCategories'

function hexAlpha(hex, a) {
  if (!hex || hex.startsWith('var')) return `rgba(136,136,136,${a})`
  const h = hex.replace('#','')
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16)
  return `rgba(${r},${g},${b},${a})`
}
function loadTitle() {
  try { return localStorage.getItem('tt_board_title') || 'Task Tracker' } catch { return 'Task Tracker' }
}

export default function OwnerDashboard() {
  const { profile } = useAuth()
  const { tasks, loading, createTask, updateTask, deleteTask, addStep, toggleStep, updateStep, updateSubsteps, addComment, addTaskComment } = useTasks(profile?.id)
  const { categories, createCategory } = useCategories(profile?.id)

  const [filterCat,    setFilterCat]    = useState(null)
  const [view,         setView]         = useState('list') // 'list' | 'kanban'
  const [showShare,    setShowShare]    = useState(false)
  const [showAddCat,   setShowAddCat]   = useState(false)
  const [catName,      setCatName]      = useState('')
  const [catColor,     setCatColor]     = useState(PALETTE[6])
  const [savingCat,    setSavingCat]    = useState(false)
  const [addingTask,   setAddingTask]   = useState(false)
  const [taskTitle,    setTaskTitle]    = useState('')
  const [taskCat,      setTaskCat]      = useState(null)
  const [title,        setTitle]        = useState(loadTitle)
  const [editingTitle, setEditingTitle] = useState(false)

  const visible = useMemo(() =>
    tasks.filter(t => !filterCat || t.category_id === filterCat),
    [tasks, filterCat]
  )

  const stats = useMemo(() => ({
    total:  tasks.length,
    done:   tasks.filter(t => t.status === 'done').length,
    active: tasks.filter(t => t.status === 'in_progress').length,
  }), [tasks])

  async function handleAddCat() {
    if (!catName.trim()) return
    setSavingCat(true)
    await createCategory(catName.trim(), catColor)
    setCatName(''); setShowAddCat(false); setSavingCat(false)
  }

  async function handleSaveTask() {
    const v = taskTitle.trim()
    if (!v) return
    await createTask({ title: v, categoryId: taskCat || categories[0]?.id || null, status:'todo', priority:'medium' })
    setTaskTitle(''); setAddingTask(false)
  }

  function commitTitle(e) {
    const v = (e.target.value || '').trim()
    if (v) { setTitle(v); try { localStorage.setItem('tt_board_title', v) } catch {} }
    setEditingTitle(false)
  }

  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })

  if (loading) return (
    <AppLayout>
      <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:14, fontWeight:600 }}>
        Loading tasks…
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div style={{ paddingTop:28, maxWidth:1180, margin:'0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16, marginBottom:'var(--gap)' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.13em', color:'var(--muted)' }}>{today}</div>
            {editingTitle ? (
              <input
                autoFocus defaultValue={title}
                onBlur={commitTitle}
                onKeyDown={e => { if (e.key==='Enter') e.target.blur(); if (e.key==='Escape') setEditingTitle(false) }}
                style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, letterSpacing:'-.02em', marginTop:5, border:'none', borderBottom:'2px solid var(--accent)', background:'transparent', color:'var(--ink)', outline:'none', width:'min(440px,72vw)' }}
              />
            ) : (
              <h1 onClick={() => setEditingTitle(true)} title="Click to rename"
                style={{ fontFamily:"'Syne',sans-serif", fontSize:32, fontWeight:800, letterSpacing:'-.02em', marginTop:5, color:'var(--ink)', cursor:'text', display:'inline-flex', alignItems:'center', gap:10 }}>
                {title}
                <span style={{ fontSize:14, color:'var(--muted)', opacity:.55 }}>✎</span>
              </h1>
            )}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <StatCard value={stats.total}  label="Tasks"       />
            <StatCard value={stats.active} label="In progress" />
            <StatCard value={stats.done}   label="Completed"   accent />
            <button onClick={() => setShowShare(true)}
              style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:'13px 18px', fontSize:12, fontWeight:700, color:'var(--ink)', boxShadow:'var(--shadow)', cursor:'pointer' }}>
              👤 Share
            </button>
          </div>
        </div>

        {/* ── Category cards grid ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(168px,1fr))', gap:12, marginBottom:20 }}>
          <CatCard label="All tasks" count={stats.total} color={null} active={filterCat===null} onClick={() => setFilterCat(null)} />
          {categories.map(cat => (
            <CatCard key={cat.id} label={cat.name} count={tasks.filter(t=>t.category_id===cat.id).length} color={cat.color} active={filterCat===cat.id} onClick={() => setFilterCat(filterCat===cat.id ? null : cat.id)} />
          ))}
          <button onClick={() => setShowAddCat(v=>!v)}
            style={{ cursor:'pointer', border:'1px dashed var(--line)', borderRadius:'var(--rsm)', padding:'15px 17px', display:'flex', alignItems:'center', justifyContent:'center', gap:7, color:'var(--muted)', fontSize:13, fontWeight:600, minHeight:80, background:'none' }}>
            + Category
          </button>
        </div>

        {/* ── Add category inline ── */}
        {showAddCat && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:18, marginBottom:16, animation:'pop .18s ease', boxShadow:'var(--shadow)' }}>
            <input autoFocus value={catName} onChange={e=>setCatName(e.target.value)} placeholder="Category name"
              onKeyDown={e=>{ if(e.key==='Enter') handleAddCat() }}
              style={{ width:'100%', border:'1px solid var(--line)', borderRadius:'var(--rsm)', padding:'11px 14px', fontSize:14, fontWeight:600, outline:'none', background:'var(--surface2)', color:'var(--ink)', marginBottom:12 }}
            />
            <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.09em', color:'var(--muted)', marginBottom:10 }}>Colour</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:9, maxWidth:520, marginBottom:14 }}>
              {PALETTE.map(col => (
                <button key={col} onClick={() => setCatColor(col)}
                  style={{ width:26, height:26, borderRadius:7, background:col, border:'none', boxShadow: catColor===col?`0 0 0 2px var(--surface),0 0 0 4px ${col}`:'none', cursor:'pointer' }} />
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button onClick={() => setShowAddCat(false)} style={{ background:'transparent', border:'none', color:'var(--muted)', fontSize:13, fontWeight:600, cursor:'pointer', padding:'9px 12px' }}>Cancel</button>
              <button onClick={handleAddCat} disabled={savingCat}
                style={{ background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--rsm)', padding:'9px 20px', fontSize:13, fontWeight:700, cursor:'pointer', opacity: savingCat?.6:1 }}>
                Add category
              </button>
            </div>
          </div>
        )}

        {/* ── New task + view toggle ── */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <div onClick={() => { setAddingTask(true); if (!taskCat && categories[0]) setTaskCat(categories[0].id) }}
            style={{ flex:1, cursor:'pointer', background:'var(--surface)', border:'1.5px dashed var(--line)', borderRadius:'var(--rad)', padding:'14px 18px', fontSize:14, fontWeight:600, color:'var(--muted)', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18, lineHeight:1 }}>+</span> New task
          </div>
          <div style={{ display:'flex', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', overflow:'hidden', boxShadow:'var(--shadow)', flexShrink:0 }}>
            {[['list','≡ List'],['kanban','⊞ Board']].map(([v,l]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding:'12px 16px', fontSize:12.5, fontWeight:700, border:'none', cursor:'pointer', background: view===v ? 'var(--ink)' : 'transparent', color: view===v ? 'var(--surface)' : 'var(--muted)', borderRight: v==='list' ? '1px solid var(--line)' : 'none' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Inline add task ── */}
        {addingTask && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:16, marginBottom:16, animation:'pop .18s ease', boxShadow:'var(--shadow)' }}>
            <input autoFocus value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="What needs doing?"
              onKeyDown={e=>{ if(e.key==='Enter') handleSaveTask() }}
              style={{ width:'100%', border:'none', borderBottom:'1px solid var(--line)', padding:'6px 2px 12px', fontSize:17, fontWeight:700, outline:'none', background:'transparent', color:'var(--ink)' }}
            />
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginTop:14 }}>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--muted)' }}>Category</span>
              {categories.map(cat => {
                const on = taskCat===cat.id
                return (
                  <div key={cat.id} onClick={() => setTaskCat(cat.id)}
                    style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:999, fontSize:12.5, fontWeight:600, border:`1.5px solid ${on?cat.color:'var(--line)'}`, background: on?hexAlpha(cat.color,0.13):'var(--surface)', color:'var(--ink)' }}>
                    <span style={{ width:9, height:9, borderRadius:3, background:cat.color, display:'inline-block' }}/>
                    {cat.name}
                  </div>
                )
              })}
              <div style={{ flex:1 }}/>
              <button onClick={() => { setAddingTask(false); setTaskTitle('') }} style={{ background:'transparent', border:'none', color:'var(--muted)', fontSize:13, fontWeight:600, cursor:'pointer', padding:'8px 10px' }}>Cancel</button>
              <button onClick={handleSaveTask} style={{ background:'var(--accentGrad)', color:'#fff', border:'none', borderRadius:'var(--rsm)', padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer' }}>Create task</button>
            </div>
          </div>
        )}

        {/* ── Task list / Kanban ── */}
        {view === 'list' ? (
          <>
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--cgap)' }}>
              {visible.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  permission="owner"
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onToggleStep={toggleStep}
                  onUpdateStep={updateStep}
                  onUpdateSubsteps={updateSubsteps}
                  onAddStep={addStep}
                  onAddComment={addComment}
                  onAddTaskComment={addTaskComment}
                />
              ))}
            </div>
            {visible.length === 0 && (
              <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--muted)' }}>
                <div style={{ fontSize:15, fontWeight:600 }}>No tasks here yet</div>
                <div style={{ fontSize:13, marginTop:4 }}>Click "+ New task" above to start tracking.</div>
              </div>
            )}
          </>
        ) : (
          <KanbanBoard tasks={visible} onUpdate={updateTask} onDelete={deleteTask} />
        )}

        {/* ── Divider ── */}
        <div style={{ height:2, background:'var(--line)', margin:'36px 0 32px', borderRadius:1 }} />

        {/* ── Calendar + Checklist ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 288px', gap:20, alignItems:'start' }}>
          <CalendarSection categories={categories} />
          <ChecklistPanel />
        </div>

        <div style={{ height:36 }} />

        {/* ── Messages ── */}
        <MessagesSection />

        <div style={{ height:32 }} />
      </div>

      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
    </AppLayout>
  )
}

function StatCard({ value, label, accent }) {
  return (
    <div style={{ background: accent?'var(--ink)':'var(--surface)', border: accent?'none':'1px solid var(--line)', borderRadius:'var(--rad)', padding:'13px 18px', minWidth:86, boxShadow: accent?'none':'var(--shadow)' }}>
      <div style={{ fontSize:24, fontWeight:800, lineHeight:1, color: accent?'var(--surface)':'var(--ink)' }}>{value}</div>
      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.09em', color: accent?'rgba(255,255,255,.65)':'var(--muted)', marginTop:6 }}>{label}</div>
    </div>
  )
}

// ── Checklist panel (localStorage) ──────────────────────────────────────────

function loadChecklist() {
  try { const r = localStorage.getItem('tt_checklist_v1'); return r ? JSON.parse(r) : [] } catch { return [] }
}

function ChecklistPanel() {
  const [items,  setItems]  = useState(loadChecklist)
  const [draft,  setDraft]  = useState('')

  function save(next) { setItems(next); try { localStorage.setItem('tt_checklist_v1', JSON.stringify(next)) } catch {} }

  function addItem() {
    const text = draft.trim(); if (!text) return
    save([...items, { id: Math.random().toString(36).slice(2), text, done: false }])
    setDraft('')
  }
  function toggle(id) { save(items.map(it => it.id === id ? { ...it, done: !it.done } : it)) }
  function remove(id) { save(items.filter(it => it.id !== id)) }

  const done = items.filter(i => i.done).length

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', boxShadow:'var(--shadow)', display:'flex', flexDirection:'column', minHeight:300 }}>
      {/* header */}
      <div style={{ padding:'14px 16px 12px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:800, color:'var(--ink)' }}>Checklist</span>
        <span style={{ fontSize:11, fontWeight:800, color:'var(--muted)', background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:999, padding:'2px 8px' }}>{done}/{items.length}</span>
      </div>

      {/* items */}
      <div style={{ flex:1, overflowY:'auto', padding:'6px 0' }}>
        {items.length === 0 && (
          <div style={{ padding:'28px 16px', textAlign:'center', fontSize:13, color:'var(--muted)' }}>Nothing here yet</div>
        )}
        {items.map(it => (
          <div key={it.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom:'1px solid var(--line)', opacity: it.done ? .6 : 1 }}>
            <button onClick={() => toggle(it.id)}
              style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${it.done ? '#30a46c' : 'var(--line)'}`, background: it.done ? '#30a46c' : 'transparent', color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, cursor:'pointer' }}>
              {it.done ? '✓' : ''}
            </button>
            <span style={{ flex:1, fontSize:13.5, fontWeight:500, color:'var(--ink)', textDecoration: it.done ? 'line-through' : 'none', wordBreak:'break-word' }}>{it.text}</span>
            <button onClick={() => remove(it.id)}
              style={{ background:'none', border:'none', fontSize:16, color:'var(--muted)', opacity:.5, lineHeight:1, cursor:'pointer', padding:'0 2px', flexShrink:0 }}>×</button>
          </div>
        ))}
      </div>

      {/* add input */}
      <div style={{ borderTop:'1px solid var(--line)', padding:'10px 14px', display:'flex', gap:8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addItem() }}
          placeholder="Add a checklist item…"
          style={{ flex:1, border:'none', background:'transparent', fontSize:13, color:'var(--ink)', outline:'none' }}
        />
        {draft.trim() && (
          <button onClick={addItem}
            style={{ background:'var(--accentGrad)', border:'none', borderRadius:'var(--rsm)', padding:'4px 10px', fontSize:12, fontWeight:700, color:'#fff', cursor:'pointer' }}>
            Add
          </button>
        )}
      </div>
    </div>
  )
}

// ── Kanban board ─────────────────────────────────────────────────────────────

const KANBAN_COLS = [
  { key:'todo',        label:'To Do',       color:'var(--muted)' },
  { key:'in_progress', label:'In Progress', color:'#3b82f6' },
  { key:'done',        label:'Done',        color:'#30a46c' },
  { key:'blocked',     label:'Blocked',     color:'#e5484d' },
]
const STATUS_LABELS_K = { todo:'To Do', in_progress:'In Progress', done:'Done', blocked:'Blocked' }

function KanbanBoard({ tasks, onUpdate, onDelete }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, alignItems:'start' }}>
      {KANBAN_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)
        return (
          <div key={col.key} style={{ background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:'var(--rad)', overflow:'hidden' }}>
            {/* column header */}
            <div style={{ padding:'12px 14px 10px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:9, height:9, borderRadius:'50%', background:col.color, flexShrink:0, display:'inline-block' }}/>
              <span style={{ fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--ink)' }}>{col.label}</span>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--muted)', marginLeft:'auto' }}>({colTasks.length})</span>
            </div>
            {/* cards */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, padding:8, minHeight:80 }}>
              {colTasks.length === 0 && (
                <div style={{ textAlign:'center', padding:'24px 8px', fontSize:12, fontWeight:600, color:'var(--muted)', opacity:.5 }}>Empty</div>
              )}
              {colTasks.map(task => <KanbanCard key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function KanbanCard({ task, onUpdate, onDelete }) {
  const cat   = task.categories
  const color = cat?.color || '#8b8d98'
  const steps = task.task_steps || []
  const done  = steps.filter(s => s.done).length
  const pct   = steps.length ? Math.round(done / steps.length * 100) : 0

  function relTime(ts) {
    if (!ts) return ''
    const d = Date.now() - new Date(ts).getTime()
    const m = Math.floor(d/6e4), h = Math.floor(d/36e5), day = Math.floor(d/864e5)
    if (d < 6e4) return 'just now'
    if (m < 60) return m + 'm ago'
    if (h < 24) return h + 'h ago'
    return day + 'd ago'
  }

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rsm)', overflow:'hidden', boxShadow:'var(--shadow)', borderLeft:`3px solid ${color}` }}>
      <div style={{ padding:'10px 12px' }}>
        {cat && (
          <div style={{ fontSize:10, fontWeight:700, color, marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' }}>{cat.name}</div>
        )}
        <div style={{ fontSize:13.5, fontWeight:700, color:'var(--ink)', lineHeight:1.3, marginBottom:8 }}>{task.title}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:8 }}>
          <select
            value={task.status}
            onChange={e => onUpdate(task.id, { status: e.target.value })}
            onClick={e => e.stopPropagation()}
            style={{ fontSize:10, fontWeight:700, border:'1px solid var(--line)', borderRadius:999, padding:'2px 7px', background:'var(--surface2)', color:'var(--ink)', cursor:'pointer', outline:'none' }}
          >
            {Object.entries(STATUS_LABELS_K).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)', marginLeft:'auto' }}>Updated {relTime(task.updated_at)}</span>
          <button onClick={() => { if(confirm('Delete this task?')) onDelete(task.id) }}
            style={{ background:'none', border:'none', fontSize:13, color:'#c0392b', opacity:.6, padding:'0 2px', cursor:'pointer', lineHeight:1 }}>✕</button>
        </div>
        {steps.length > 0 && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, fontWeight:600, color:'var(--muted)', marginBottom:3 }}>
              <span>{done}/{steps.length} steps</span><span>{pct}%</span>
            </div>
            <div style={{ height:4, background:'var(--surface2)', border:'1px solid var(--line)', borderRadius:999, overflow:'hidden' }}>
              <div style={{ height:'100%', background:color, width:`${pct}%`, borderRadius:999, transition:'width .3s' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CatCard({ label, count, color, active, onClick }) {
  const cardBg  = active ? (color || 'var(--ink)') : 'var(--surface)'
  const border  = active ? (color || 'var(--ink)') : 'var(--line)'
  const nameFg  = active ? '#fff' : 'var(--ink)'
  const countFg = active ? '#fff' : (color || 'var(--ink)')
  const dotBg   = active ? 'rgba(255,255,255,.85)' : (color || 'var(--accentGrad)')
  return (
    <div onClick={onClick} style={{ cursor:'pointer', background:cardBg, border:`1px solid ${border}`, borderRadius:'var(--rsm)', padding:'15px 17px', display:'flex', flexDirection:'column', gap:11, boxShadow:'var(--shadow)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ width:9, height:9, borderRadius: color?2:'50%', background:dotBg, flexShrink:0 }}/>
        <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:nameFg }}>{label}</span>
      </div>
      <span style={{ fontSize:26, fontWeight:800, color:countFg, lineHeight:1 }}>{count}</span>
    </div>
  )
}
