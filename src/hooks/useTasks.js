import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTasks(userId) {
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('tasks')
      .select(`
        *,
        categories(id, name, color),
        task_steps(*, step_comments(*, profiles!step_comments_user_id_fkey(full_name, email))),
        task_comments(*, profiles!task_comments_user_id_fkey(full_name, email))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('position', { foreignTable: 'task_steps', ascending: true })
    if (err) setError(err.message)
    else setTasks(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  async function createTask({ title, description, status, priority, dueDate, categoryId }) {
    const { error: err } = await supabase.from('tasks').insert({
      user_id:     userId,
      title,
      description: description || '',
      status:      status || 'todo',
      priority:    priority || 'medium',
      due_date:    dueDate || null,
      category_id: categoryId || null,
    })
    if (!err) await load()
    return err
  }

  async function updateTask(id, updates) {
    const patch = {}
    if (updates.title       !== undefined) patch.title       = updates.title
    if (updates.description !== undefined) patch.description = updates.description
    if (updates.status      !== undefined) patch.status      = updates.status
    if (updates.priority    !== undefined) patch.priority    = updates.priority
    if (updates.dueDate     !== undefined) patch.due_date    = updates.dueDate
    if (updates.categoryId  !== undefined) patch.category_id = updates.categoryId
    const { error: err } = await supabase.from('tasks').update(patch).eq('id', id)
    if (!err) await load()
    return err
  }

  async function deleteTask(id) {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id)
    if (!err) setTasks(prev => prev.filter(t => t.id !== id))
    return err
  }

  // ── Steps ──────────────────────────────────────────────────────
  async function addStep(taskId, title) {
    const task  = tasks.find(t => t.id === taskId)
    const pos   = (task?.task_steps?.length ?? 0)
    const { error: err } = await supabase.from('task_steps').insert({
      task_id: taskId, title, done: false, position: pos,
    })
    if (!err) await load()
    return err
  }

  async function toggleStep(stepId, done) {
    const { error: err } = await supabase.from('task_steps').update({ done }).eq('id', stepId)
    if (!err) {
      setTasks(prev => prev.map(t => ({
        ...t,
        task_steps: t.task_steps.map(s => s.id === stepId ? { ...s, done } : s)
      })))
    }
    return err
  }

  async function updateStep(stepId, patch) {
    const { error: err } = await supabase.from('task_steps').update(patch).eq('id', stepId)
    return err
  }

  async function updateSubsteps(stepId, substeps) {
    const { error: err } = await supabase.from('task_steps').update({ substeps }).eq('id', stepId)
    if (!err) {
      setTasks(prev => prev.map(t => ({
        ...t,
        task_steps: t.task_steps.map(s => s.id === stepId ? { ...s, substeps } : s)
      })))
    }
    return err
  }

  // ── Step comments ──────────────────────────────────────────────
  async function addComment(stepId, userId, text) {
    const { error: err } = await supabase.from('step_comments').insert({ step_id: stepId, user_id: userId, text })
    if (!err) await load()
    return err
  }

  // ── Task-level comments ────────────────────────────────────────
  async function addTaskComment(taskId, userId, text) {
    const { error: err } = await supabase.from('task_comments').insert({ task_id: taskId, user_id: userId, text })
    if (!err) await load()
    return err
  }

  return { tasks, loading, error, refetch: load, createTask, updateTask, deleteTask, addStep, toggleStep, updateStep, updateSubsteps, addComment, addTaskComment }
}

// ── Manager view: read tasks belonging to another owner ──────────
export async function fetchOwnerTasks(ownerId) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      categories(id, name, color),
      task_steps(*, step_comments(*, profiles!step_comments_user_id_fkey(full_name, email))),
      task_comments(*, profiles!task_comments_user_id_fkey(full_name, email))
    `)
    .eq('user_id', ownerId)
    .order('created_at', { ascending: false })
    .order('position', { foreignTable: 'task_steps', ascending: true })
  return { data: data || [], error }
}
