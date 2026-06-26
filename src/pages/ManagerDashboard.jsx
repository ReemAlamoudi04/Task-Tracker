import { useState, useEffect, useMemo } from 'react'
import AppLayout from '../components/layout/AppLayout'
import TaskCard from '../components/tasks/TaskCard'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchOwnerTasks } from '../hooks/useTasks'

const STATUS_COLORS = { todo:'var(--muted)', in_progress:'#3b82f6', done:'#30a46c', blocked:'#e5484d' }
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', done:'Done', blocked:'Blocked' }

export default function ManagerDashboard() {
  const { profile } = useAuth()
  const [owners,      setOwners]      = useState([])
  const [selectedId,  setSelectedId]  = useState(null)
  const [tasks,       setTasks]       = useState([])
  const [categories,  setCategories]  = useState([])
  const [loadingOwners, setLoadingOwners] = useState(true)
  const [loadingTasks,  setLoadingTasks]  = useState(false)
  const [filterStatus,  setFilterStatus]  = useState(null)
  const [filterCat,     setFilterCat]     = useState(null)

  // Load owners this manager has access to
  useEffect(() => {
    if (!profile) return
    setLoadingOwners(true)
    supabase
      .from('task_access')
      .select('owner_id, profiles!task_access_owner_id_fkey(id, full_name, email)')
      .eq('viewer_id', profile.id)
      .then(({ data }) => {
        const list = (data || []).map(r => r.profiles).filter(Boolean)
        setOwners(list)
        if (list.length > 0 && !selectedId) setSelectedId(list[0].id)
        setLoadingOwners(false)
      })
  }, [profile])

  // Load tasks for selected owner
  useEffect(() => {
    if (!selectedId) return
    setLoadingTasks(true)
    fetchOwnerTasks(selectedId).then(({ data }) => {
      setTasks(data)
      // Collect unique categories from tasks
      const cats = []
      const seen = new Set()
      data.forEach(t => {
        if (t.categories && !seen.has(t.categories.id)) {
          seen.add(t.categories.id)
          cats.push(t.categories)
        }
      })
      setCategories(cats)
      setLoadingTasks(false)
    })
  }, [selectedId])

  const selectedOwner = owners.find(o => o.id === selectedId)

  const visible = useMemo(() => tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (filterCat    && t.category_id !== filterCat) return false
    return true
  }), [tasks, filterStatus, filterCat])

  const stats = useMemo(() => ({
    total:   tasks.length,
    done:    tasks.filter(t => t.status === 'done').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    active:  tasks.filter(t => t.status === 'in_progress').length,
  }), [tasks])

  if (loadingOwners) {
    return (
      <AppLayout>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--muted)', fontSize:14, fontWeight:600 }}>
          Loading…
        </div>
      </AppLayout>
    )
  }

  if (owners.length === 0) {
    return (
      <AppLayout>
        <div style={{ maxWidth:500, margin:'80px auto', textAlign:'center', padding:'0 16px' }}>
          <div style={{ fontSize:32, marginBottom:16 }}>📋</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--ink)', marginBottom:8 }}>No access yet</h2>
          <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>
            You don't have access to any owner's tasks yet. Ask an owner to share their task board with your email address: <strong style={{ color:'var(--ink)' }}>{profile?.email}</strong>
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div style={{ paddingTop:28, maxWidth:1180, margin:'0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:16, marginBottom:'var(--gap)' }}>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--muted)', letterSpacing:'.02em' }}>Manager view</div>
            <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:'-.02em', marginTop:2, color:'var(--ink)' }}>
              {selectedOwner?.full_name || selectedOwner?.email || 'Tasks'}
            </h1>
          </div>

          {/* stat cards */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <MiniStat value={stats.total}   label="Tasks"       color="var(--ink)" />
            <MiniStat value={stats.active}  label="In progress" color="#3b82f6" />
            <MiniStat value={stats.done}    label="Done"        color="#30a46c" />
            <MiniStat value={stats.blocked} label="Blocked"     color="#e5484d" />
          </div>
        </div>

        {/* ── Owner switcher (if multiple) ── */}
        {owners.length > 1 && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {owners.map(o => (
              <button
                key={o.id}
                onClick={() => { setSelectedId(o.id); setFilterStatus(null); setFilterCat(null) }}
                style={{
                  padding:'7px 14px', borderRadius:999, fontSize:13, fontWeight:600, cursor:'pointer',
                  border:`1px solid ${selectedId === o.id ? 'var(--ink)' : 'var(--line)'}`,
                  background: selectedId === o.id ? 'var(--ink)' : 'var(--surface)',
                  color:      selectedId === o.id ? 'var(--surface)' : 'var(--ink)',
                }}
              >
                {o.full_name || o.email}
              </button>
            ))}
          </div>
        )}

        {/* ── Status filter ── */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          {[null, 'todo', 'in_progress', 'done', 'blocked'].map(s => (
            <button
              key={s || 'all'}
              onClick={() => setFilterStatus(s)}
              style={{
                padding:'6px 12px', borderRadius:999, fontSize:12.5, fontWeight:600, cursor:'pointer',
                border:`1px solid ${filterStatus === s ? (s ? STATUS_COLORS[s] : 'var(--ink)') : 'var(--line)'}`,
                background: filterStatus === s ? (s ? STATUS_COLORS[s] : 'var(--ink)') : 'var(--surface)',
                color: filterStatus === s ? '#fff' : 'var(--ink)',
              }}
            >
              {s ? STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>

        {/* ── Category filter ── */}
        {categories.length > 0 && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            <CatChip label="All categories" active={!filterCat} color="var(--muted)" onClick={() => setFilterCat(null)} />
            {categories.map(c => (
              <CatChip key={c.id} label={c.name} active={filterCat === c.id} color={c.color} onClick={() => setFilterCat(filterCat === c.id ? null : c.id)} />
            ))}
          </div>
        )}

        {/* ── Read-only notice ── */}
        <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:14, padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rsm)', display:'inline-flex', alignItems:'center', gap:6 }}>
          👁 Read-only view — you can see and comment on steps, but cannot edit tasks.
        </div>

        {/* ── Task list ── */}
        {loadingTasks ? (
          <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:14, fontWeight:600 }}>Loading tasks…</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--cgap)' }}>
            {visible.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                readOnly={true}
                onToggleStep={() => {}}
                onUpdateStep={() => {}}
                onAddStep={() => {}}
                onAddComment={async (stepId, userId, text) => {
                  await supabase.from('step_comments').insert({ step_id: stepId, user_id: userId, text })
                  const { data } = await fetchOwnerTasks(selectedId)
                  setTasks(data)
                }}
                onUpdate={() => {}}
                onDelete={() => {}}
              />
            ))}
            {visible.length === 0 && (
              <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--muted)' }}>
                <div style={{ fontSize:15, fontWeight:600 }}>No tasks match this filter</div>
              </div>
            )}
          </div>
        )}

        <div style={{ height:24 }} />
      </div>
    </AppLayout>
  )
}

function MiniStat({ value, label, color }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rad)', padding:'10px 16px', minWidth:72, boxShadow:'var(--shadow)' }}>
      <div style={{ fontSize:20, fontWeight:800, lineHeight:1, color }}>{value}</div>
      <div style={{ fontSize:11, fontWeight:600, color:'var(--muted)', marginTop:2 }}>{label}</div>
    </div>
  )
}

function CatChip({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      cursor:'pointer', display:'flex', alignItems:'center', gap:6,
      padding:'6px 12px', borderRadius:999, fontSize:12.5, fontWeight:600,
      border:`1px solid ${active ? color : 'var(--line)'}`,
      background: active ? color : 'var(--surface)',
      color: active ? '#fff' : 'var(--ink)',
    }}>
      <span style={{ width:8, height:8, borderRadius:2, background: active ? 'rgba(255,255,255,.8)' : color, display:'inline-block', flexShrink:0 }} />
      {label}
    </button>
  )
}
