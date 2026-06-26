import { useState, useMemo } from 'react'
import AppLayout from '../components/layout/AppLayout'
import TaskCard from '../components/tasks/TaskCard'
import TaskForm from '../components/tasks/TaskForm'
import ShareModal from '../components/tasks/ShareModal'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { useCategories, PALETTE } from '../hooks/useCategories'

const STATUS_COLS = [
  { key:'todo',        label:'To Do',       color:'var(--muted)' },
  { key:'in_progress', label:'In Progress', color:'#3b82f6' },
  { key:'done',        label:'Done',        color:'#30a46c' },
  { key:'blocked',     label:'Blocked',     color:'#e5484d' },
]

function hexAlpha(hex, a) {
  const h = hex.replace('#','')
  const [r,g,b] = [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
  return `rgba(${r},${g},${b},${a})`
}

export default function OwnerDashboard() {
  const { profile } = useAuth()
  const { tasks, loading, createTask, updateTask, deleteTask, addStep, toggleStep, updateStep, addComment } = useTasks(profile?.id)
  const { categories, createCategory } = useCategories(profile?.id)

  const [filter,      setFilter]      = useState({ catId: null, status: null, priority: null })
  const [showAdd,     setShowAdd]     = useState(false)
  const [showShare,   setShowShare]   = useState(false)
  const [showAddCat,  setShowAddCat]  = useState(false)
  const [catName,     setCatName]     = useState('')
  const [catColor,    setCatColor]    = useState(PALETTE[6])
  const [viewMode,    setViewMode]    = useState('list') // 'list' | 'board'
  const [savingCat,   setSavingCat]   = useState(false)

  const visible = useMemo(() => tasks.filter(t => {
    if (filter.catId    && t.category_id !== filter.catId)    return false
    if (filter.status   && t.status      !== filter.status)   return false
    if (filter.priority && t.priority    !== filter.priority) return false
    return true
  }), [tasks, filter])

  const stats = useMemo(() => {
    const total  = tasks.length
    const done   = tasks.filter(t => t.status === 'done').length
    const active = tasks.filter(t => t.status === 'in_progress').length
    return { total, done, active }
  }, [tasks])

  async function handleAddCat() {
    if (!catName.trim()) return
    setSavingCat(true)
    await createCategory(catName.trim(), catColor)
    setCatName(''); setShowAddCat(false); setSavingCat(false)
  }

  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })

  if (loading) return <AppLayout><LoadingState /></AppLayout>

  return (
    <AppLayout>
      <div style={{ paddingTop:28, maxWidth:1180, margin:'0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16, marginBottom:'var(--gap)' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--muted)', letterSpacing:'.02em' }}>{today}</div>
            <h1 style={{ fontSize:30, fontWeight:800, letterSpacing:'-.02em', marginTop:2, color:'var(--ink)' }}>Task Tracker</h1>
          </div>

          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <StatCard value={stats.total}  label="Tasks"       dark={false} />
            <StatCard value={stats.active} label="In progress" dark={false} />
            <StatCard value={stats.done}   label="Completed"   dark={true} />
            <button
              onClick={() => setShowShare(true)}
              style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:'10px 16px', fontSize:12, fontWeight:700, color:'var(--ink)', boxShadow:'var(--shadow)', cursor:'pointer' }}
            >
              👤 Share
            </button>
          </div>
        </div>

        {/* ── Status filter + view toggle ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          <StatusChip label="All" active={!filter.status} onClick={() => setFilter(f => ({ ...f, status: null }))} color="var(--ink)" />
          {STATUS_COLS.map(s => (
            <StatusChip key={s.key} label={s.label} active={filter.status === s.key} onClick={() => setFilter(f => ({ ...f, status: filter.status === s.key ? null : s.key }))} color={s.color} />
          ))}
          <div style={{ flex:1 }} />
          <button onClick={() => setViewMode(v => v==='list' ? 'board' : 'list')}
            style={{ background:'none', border:'1px solid var(--line)', borderRadius:'var(--rsm)', padding:'5px 12px', fontSize:12, fontWeight:600, color:'var(--muted)' }}>
            {viewMode === 'list' ? '⊟ Board' : '≡ List'}
          </button>
        </div>

        {/* ── Category chips ── */}
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          <CategoryChip label="All tasks" active={!filter.catId} onClick={() => setFilter(f => ({ ...f, catId: null }))} color="var(--ink)" />
          {categories.map(cat => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              count={tasks.filter(t => t.category_id === cat.id).length}
              active={filter.catId === cat.id}
              onClick={() => setFilter(f => ({ ...f, catId: filter.catId === cat.id ? null : cat.id }))}
              color={cat.color}
            />
          ))}
          <button
            onClick={() => setShowAddCat(v => !v)}
            style={{ cursor:'pointer', padding:'7px 12px', borderRadius:999, fontSize:13, fontWeight:600, border:'1px dashed var(--line)', color:'var(--muted)', background:'none' }}
          >
            + Category
          </button>
        </div>

        {/* ── Add category inline ── */}
        {showAddCat && (
          <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:14, marginBottom:16, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', animation:'pop .18s ease', boxShadow:'var(--shadow)' }}>
            <input
              autoFocus
              className="tt-input"
              style={{ flex:1, minWidth:160 }}
              placeholder="Category name"
              value={catName}
              onChange={e => setCatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddCat() }}
            />
            <div style={{ display:'flex', gap:7 }}>
              {PALETTE.map(col => (
                <button
                  key={col}
                  onClick={() => setCatColor(col)}
                  style={{ width:26, height:26, borderRadius:8, background:col, border:'none', boxShadow: catColor === col ? `0 0 0 2px var(--surface), 0 0 0 4px ${col}` : 'none', cursor:'pointer' }}
                />
              ))}
            </div>
            <button onClick={handleAddCat} disabled={savingCat}
              style={{ background:'var(--ink)', color:'var(--surface)', border:'none', borderRadius:'var(--rsm)', padding:'9px 16px', fontSize:13, fontWeight:600, opacity: savingCat ? .6 : 1 }}>
              {savingCat ? '…' : 'Add'}
            </button>
            <button onClick={() => setShowAddCat(false)} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:13, fontWeight:600 }}>Cancel</button>
          </div>
        )}

        {/* ── New task button ── */}
        <button
          onClick={() => setShowAdd(true)}
          style={{ width:'100%', background:'var(--surface)', border:'1.5px dashed var(--line)', borderRadius:'var(--rad)', padding:'14px 18px', fontSize:14, fontWeight:600, color:'var(--muted)', marginBottom:16, display:'flex', alignItems:'center', gap:10, cursor:'pointer', textAlign:'left' }}
        >
          <span style={{ fontSize:18, lineHeight:1 }}>+</span> New task
        </button>

        {/* ── Task list / board ── */}
        {viewMode === 'list' ? (
          <TaskList tasks={visible} categories={categories} onUpdate={updateTask} onDelete={deleteTask} onToggleStep={toggleStep} onUpdateStep={updateStep} onAddStep={addStep} onAddComment={addComment} />
        ) : (
          <BoardView tasks={visible} categories={categories} onUpdate={updateTask} onDelete={deleteTask} onToggleStep={toggleStep} onUpdateStep={updateStep} onAddStep={addStep} onAddComment={addComment} />
        )}

        {visible.length === 0 && (
          <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--muted)' }}>
            <div style={{ fontSize:15, fontWeight:600 }}>No tasks here yet</div>
            <div style={{ fontSize:13, marginTop:4 }}>Click "+ New task" above to start tracking.</div>
          </div>
        )}

        <div style={{ height:24 }} />
      </div>

      {showAdd && (
        <TaskForm
          categories={categories}
          onSave={createTask}
          onClose={() => setShowAdd(false)}
        />
      )}
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
    </AppLayout>
  )
}

function TaskList({ tasks, ...rest }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--cgap)' }}>
      {tasks.map(task => <TaskCard key={task.id} task={task} {...rest} />)}
    </div>
  )
}

function BoardView({ tasks, ...rest }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16, alignItems:'start' }}>
      {STATUS_COLS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)
        return (
          <div key={col.key}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background: col.color.startsWith('var') ? 'var(--muted)' : col.color, display:'inline-block' }} />
              <span style={{ fontSize:12, fontWeight:700, color:'var(--muted)', letterSpacing:'.04em', textTransform:'uppercase' }}>{col.label}</span>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--muted)' }}>({colTasks.length})</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--cgap)' }}>
              {colTasks.map(task => <TaskCard key={task.id} task={task} {...rest} />)}
              {colTasks.length === 0 && (
                <div style={{ fontSize:12, color:'var(--muted)', fontStyle:'italic', padding:'12px 0' }}>Empty</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatCard({ value, label, dark }) {
  return (
    <div style={{
      background:  dark ? 'var(--ink)' : 'var(--surface)',
      border:      dark ? 'none' : '1px solid var(--line)',
      borderRadius:'var(--rad)',
      padding:     '10px 16px',
      minWidth:    78,
      boxShadow:   dark ? 'none' : 'var(--shadow)',
    }}>
      <div style={{ fontSize:22, fontWeight:800, lineHeight:1, color: dark ? 'var(--surface)' : 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)', marginTop:2 }}>{label}</div>
    </div>
  )
}

function StatusChip({ label, active, onClick, color }) {
  const isVar = color.startsWith('var')
  return (
    <button onClick={onClick} style={{
      cursor:'pointer', padding:'6px 12px', borderRadius:999, fontSize:12.5, fontWeight:600,
      border: `1px solid ${active ? (isVar ? 'var(--ink)' : color) : 'var(--line)'}`,
      background: active ? (isVar ? 'var(--ink)' : color) : 'var(--surface)',
      color: active ? '#fff' : 'var(--ink)',
    }}>
      {label}
    </button>
  )
}

function CategoryChip({ label, count, active, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      cursor:'pointer', display:'flex', alignItems:'center', gap:7,
      padding:'7px 13px', borderRadius:999, fontSize:13, fontWeight:600,
      border: `1px solid ${active ? color : 'var(--line)'}`,
      background: active ? color : 'var(--surface)',
      color: active ? '#fff' : 'var(--ink)',
    }}>
      {color !== 'var(--ink)' && <span style={{ width:9, height:9, borderRadius:3, background:active ? 'rgba(255,255,255,.8)' : color, display:'inline-block' }} />}
      {label}
      {count !== undefined && <span style={{ fontWeight:700, color: active ? 'rgba(255,255,255,.8)' : color }}>{count}</span>}
    </button>
  )
}

function LoadingState() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--muted)', fontSize:14, fontWeight:600 }}>
      Loading tasks…
    </div>
  )
}
