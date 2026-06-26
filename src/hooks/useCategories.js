import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const PALETTE = ['#e5484d','#f5821f','#f5b32e','#30a46c','#12a594','#3b82f6','#8b5cf6','#e93d82','#8b8d98']

export function useCategories(userId) {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    setCategories(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  async function createCategory(name, color) {
    const { error } = await supabase.from('categories').insert({ user_id: userId, name, color })
    if (!error) await load()
    return error
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (!error) setCategories(prev => prev.filter(c => c.id !== id))
    return error
  }

  return { categories, loading, createCategory, deleteCategory, refetch: load }
}
