import { useState, useEffect, useMemo } from 'react'
import AppLayout from '../components/layout/AppLayout'
import TaskCard from '../components/tasks/TaskCard'
import TaskForm from '../components/tasks/TaskForm'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchOwnerTasks } from '../hooks/useTasks'

const STATUS_COLORS = { todo:'var(--muted)', in_progress:'#3b82f6', done:'#30a46c', blocked:'#e5484d' }
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', done:'Done', blocked:'Blocked' }

export default function ManagerDashboard() {
  const { profile } = useAuth()
  const [owners,       setOwners]      = useState([])
  const [selectedId,   setSelectedId]  = useState(null)
  const [permission,   setPermission]  = useState('read') // 'read' | 'edit'
  const [tasks,        setTasks]       = useState([])
  const [categories,   setCategories]  = useState([])
  const [loadingOwners, setLoadingOwners] = useState(true)
  const [loadingTasks,  setLoadingTasks]  = useState(false)
  const [filterStatus, setFilterStatus]  = useState(null)
  const [filterCat,    setFilterCat]     = useState(null)
  const [showAddTask,  setShowAddTask]   = useState(false)

  useEffect(() => {
    if (!profile) return
    setLoadingOwners(true)
    supabase
      .from('task_access')
      .select('owner_id, permission, profiles!task_access_owner_id_fkey(id, full_name, email)')
      .eq('viewer_id', profile.id)
      .then(({ data }) => {
        const list = (data || []).map(r => ({ ...r.profiles, permission: r.permission })).filter(Boolean)
        setOwners(list)
        if (list.length > 0) { setSelectedId(list[0].id); setPermission(list[0].permission || 'read') }
        setLoadingOwners(false)
      })
  }, [profile])

  useEffect(() => {
    if (!selectedId) return
    setLoadingTasks(true)
    fetchOwnerTasks(selectedId).then(({ data }) => {
      setTasks(data)
      const cats = []; const seen = new Set()
      data.forEach(t => { if (t.categories && !seen.has(t.categories.id)) { seen.add(t.categories.id); cats.push(t.categories) } })
      setCategories(cats)
      setLoadingTasks(false)
    })
  }, [selectedId])

  function selectOwner(owner) {
    setSelectedId(owner.id)
    setPermission(owner.permission || 'read')
    setFilterStatus(null); setFilterCat(null)
  }

  async function handleUpdateTask(id, updates) {
    const patch = {}
    if (updates.status   !== undefined) patch.status    = updates.status
    if (updates.priority !== undefined) patch.priority  = updates.priority
    await supabase.from('tasks').update(patch).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  async function handleAddStep(taskId, title) {
    const task = tasks.find(t => t.id === taskId)
    const pos  = task?.task_steps?.length ?? 0
    await supabase.from('task_steps').insert({ task_id: taskId, title, done: false, position: pos })
    const { data } = await fetchOwnerTasks(selectedId)
    setTasks(data)
  }

  async function handleToggleStep(stepId, done) {
    await supabase.from('task_steps').update({ done }).eq('id', stepId)
    setTasks(prev => prev.map(t => ({ ...t, task_steps: t.task_steps.map(s => s.id === stepId ? { ...s, done } : s) })))
  }

  async function handleUpdateStep(stepId, patch) {
    await supabase.from('task_steps').update(patch).eq('id', stepId)
  }

  async function handleAddComment(stepId, userId, text) {
    await supabase.from('step_comments').insert({ step_id: stepId, user_id: userId, text })
    const { data } = await fetchOwnerTasks(selectedId)
    setTasks(data)
  }

  async function handleUpdateSubsteps(stepId, substeps) {
    await supabase.from('task_steps').update({ substeps }).eq('id', stepId)
    setTasks(prev => prev.map(t => ({
      ...t, task_steps: t.task_steps.map(s => s.id === stepId ? { ...s, substeps } : s)
    })))
  }

  async function handleAddTaskComment(taskId, userId, text) {
    await supabase.from('task_comments').insert({ task_id: taskId, user_id: userId, text })
    const { data } = await fetchOwnerTasks(selectedId)
    setTasks(data)
  }

  async function handleCreateTask(taskData) {
    if (!selectedId) return
    const { error } = await supabase.from('tasks').insert({
      user_id:     selectedId,
      title:       taskData.title,
      description: taskData.description || '',
      status:      taskData.status || 'todo',
      priority:    taskData.priority || 'medium',
      due_date:    taskData.dueDate || null,
      category_id: taskData.categoryId || null,
    })
    if (!error) { const { data } = await fetchOwnerTasks(selectedId); setTasks(data) }
    return error
  }

  const visible = useMemo(() => tasks.filter(t => {
    if (filterStatus && t.status      !== filterStatus) return false
    if (filterCat    && t.category_id !== filterCat)    return false
    return true
  }), [tasks, filterStatus, filterCat])

  const stats = useMemo(() => ({
    total:   tasks.length,
    done:    tasks.filter(t => t.status === 'done').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    active:  tasks.filter(t => t.status === 'in_progress').length,
  }), [tasks])

  const selectedOwner = owners.find(o => o.id === selectedId)

  if (loadingOwners) return <AppLayout><Spinner /></AppLayout>

  if (owners.length === 0) {
    return (
      <AppLayout>
        <div style={{ maxWidth:500, margin:'80px auto', textAlign:'center', padding:'0 16px' }}>
          <div style={{ fontSize:32, marginBottom:16 }}>📋</div>
          <h2 style={{ fontSize:20, fontWeight:800, color:'var(--ink)', marginBottom:8 }}>No shared tasks yet</h2>
          <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.6 }}>
            When someone shares their task board with you, it'll appear here.<br />
            Ask them to use the <strong style={{ color:'var(--ink)' }}>Share</strong> button on their dashboard.
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
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--muted)' }}>Shared with you</span>
              <PermBadge permission={permission} />
            </div>
            <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:'-.02em', color:'var(--ink)' }}>
              {selectedOwner?.full_name || selectedOwner?.email || 'Tasks'}
            </h1>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            <MiniStat value={stats.total}   label="Tasks"       color="var(--ink)" />
            <MiniStat value={stats.active}  label="In progress" color="#3b82f6" />
            <MiniStat value={stats.done}    label="Done"        color="#30a46c" />
            <MiniStat value={stats.blocked} label="Blocked"     color="#e5484d" />
          </div>
        </div>

        {/* ── Owner switcher ── */}
        {owners.length > 1 && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
            {owners.map(o => (
              <button key={o.id} onClick={() => selectOwner(o)} style={{ padding:'7px 14px', borderRadius:999, fontSize:13, fontWeight:600, cursor:'pointer', border:`1px solid ${selectedId === o.id ? 'var(--ink)' : 'var(--line)'}`, background: selectedId === o.id ? 'var(--ink)' : 'var(--surface)', color: selectedId === o.id ? 'var(--surface)' : 'var(--ink)' }}>
                {o.full_name || o.email}
              </button>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>
          {[null, 'todo', 'in_progress', 'done', 'blocked'].map(s => (
            <button key={s || 'all'} onClick={() => setFilterStatus(s)} style={{ padding:'6px 12px', borderRadius:999, fontSize:12.5, fontWeight:600, cursor:'pointer', border:`1px solid ${filterStatus === s ? (s ? STATUS_COLORS[s] : 'var(--ink)') : 'var(--line)'}`, background: filterStatus === s ? (s ? STATUS_COLORS[s] : 'var(--ink)') : 'var(--surface)', color: filterStatus === s ? '#fff' : 'var(--ink)' }}>
              {s ? STATUS_LABELS[s] : 'All'}
            </button>
          ))}
        </div>

        {/* ── Edit permission: add task button ── */}
        {permission === 'edit' && (
          <button onClick={() => setShowAddTask(true)} style={{ width:'100%', background:'var(--surface)', border:'1.5px dashed var(--line)', borderRadius:'var(--rad)', padding:'14px 18px', fontSize:14, fontWeight:600, color:'var(--muted)', marginBottom:16, display:'flex', alignItems:'center', gap:10, cursor:'pointer', textAlign:'left' }}>
            <span style={{ fontSize:18, lineHeight:1 }}>+</span> Add task to {selectedOwner?.full_name?.split(' ')[0] || 'their'} board
          </button>
        )}

        {/* ── View-only notice ── */}
        {permission === 'read' && (
          <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:14, padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--line)', borderRadius:'var(--rsm)', display:'inline-flex', alignItems:'center', gap:6 }}>
            👁 View only — you can comment on steps but cannot edit tasks.
          </div>
        )}

        {/* ── Tasks ── */}
        {loadingTasks ? <Spinner /> : (
          <div style={{ display:'flex', flexDirection:'column', gap:'var(--cgap)' }}>
            {visible.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                permission={permission}
                onUpdate={handleUpdateTask}
                onDelete={() => {}}
                onToggleStep={handleToggleStep}
                onUpdateStep={handleUpdateStep}
                onUpdateSubsteps={handleUpdateSubsteps}
                onAddStep={handleAddStep}
                onAddComment={handleAddComment}
                onAddTaskComment={handleAddTaskComment}
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

      {showAddTask && (
        <TaskForm
          categories={categories}
          onSave={handleCreateTask}
          onClose={() => setShowAddTask(false)}
        />
      )}
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

function PermBadge({ permission }) {
  const isEdit = permission === 'edit'
  return (
    <span style={{ fontSize:10, fontWeight:800, letterSpacing:'.04em', textTransform:'uppercase', padding:'2px 8px', borderRadius:999, background: isEdit ? 'rgba(139,92,246,.1)' : 'rgba(59,130,246,.1)', color: isEdit ? '#8b5cf6' : '#3b82f6' }}>
      {isEdit ? 'Edit access' : 'View only'}
    </span>
  )
}

function Spinner() {
  return <div style={{ height:120, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)', fontSize:14, fontWeight:600 }}>Loading…</div>
}
