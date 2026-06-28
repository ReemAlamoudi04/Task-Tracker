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

        {/* ── New task button ── */}
        <div onClick={() => { setAddingTask(true); if (!taskCat && categories[0]) setTaskCat(categories[0].id) }}
          style={{ cursor:'pointer', background:'var(--surface)', border:'1.5px dashed var(--line)', borderRadius:'var(--rad)', padding:'14px 18px', fontSize:14, fontWeight:600, color:'var(--muted)', marginBottom:16, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18, lineHeight:1 }}>+</span> New task
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

        {/* ── Task list ── */}
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

        {/* ── Divider ── */}
        <div style={{ height:2, background:'var(--line)', margin:'36px 0 32px', borderRadius:1 }} />

        {/* ── Calendar + Checklist ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr minmax(240px,300px)', gap:20, alignItems:'start' }}>
          <CalendarSection categories={categories} />
          <TaskChecklist tasks={tasks} categories={categories} onUpdate={updateTask} />
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

const STATUS_ORDER = { in_progress:0, todo:1, blocked:2, done:3 }
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', done:'Done', blocked:'Blocked' }
const STATUS_COLORS = { todo:'var(--muted)', in_progress:'#3b82f6', done:'#30a46c', blocked:'#e5484d' }

function TaskChecklist({ tasks, categories, onUpdate }) {
  const sorted = [...tasks].sort((a,b) => (STATUS_ORDER[a.status]??9) - (STATUS_ORDER[b.status]??9))
  const done = tasks.filter(t=>t.status==='done').length

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', boxShadow:'var(--shadow)', overflow:'hidden' }}>
      <div style={{ padding:'16px 18px 12px', borderBottom:'1px solid var(--line)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:800, color:'var(--ink)' }}>Tasks</h3>
          <span style={{ fontSize:11, fontWeight:700, color:'var(--muted)' }}>{done}/{tasks.length} done</span>
        </div>
        {tasks.length > 0 && (
          <div style={{ marginTop:8, height:5, background:'var(--surface2)', borderRadius:999, overflow:'hidden', border:'1px solid var(--line)' }}>
            <div style={{ height:'100%', borderRadius:999, background:'var(--accentGrad)', width:`${tasks.length ? Math.round(done/tasks.length*100) : 0}%`, transition:'width .3s' }} />
          </div>
        )}
      </div>
      <div style={{ maxHeight:520, overflowY:'auto', padding:'8px 0' }}>
        {sorted.length === 0 && (
          <div style={{ padding:'24px 18px', textAlign:'center', fontSize:13, color:'var(--muted)' }}>No tasks yet</div>
        )}
        {sorted.map(task => {
          const cat = task.categories
          const isDone = task.status === 'done'
          return (
            <div key={task.id} style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 16px', borderBottom:'1px solid var(--line)', opacity: isDone ? .55 : 1 }}>
              <button
                onClick={() => onUpdate(task.id, { status: isDone ? 'todo' : 'done' })}
                title={isDone ? 'Mark incomplete' : 'Mark done'}
                style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${isDone ? '#30a46c' : 'var(--line)'}`, background: isDone ? '#30a46c' : 'transparent', color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}
              >
                {isDone ? '✓' : ''}
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--ink)', textDecoration: isDone?'line-through':'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{task.title}</div>
                {cat && (
                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                    <span style={{ width:7, height:7, borderRadius:2, background:cat.color, display:'inline-block' }}/>
                    <span style={{ fontSize:10.5, fontWeight:600, color:'var(--muted)' }}>{cat.name}</span>
                  </div>
                )}
              </div>
              <span style={{ fontSize:10, fontWeight:700, color: STATUS_COLORS[task.status], flexShrink:0 }}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          )
        })}
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
