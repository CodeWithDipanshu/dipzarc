import { createClient } from '@/lib/supabase/client'
import type { Task, TaskWithCount } from '@/types'

const supabase = createClient()

export const taskService = {
  /** Fetch all active tasks */
  async getActiveTasks(): Promise<Task[]> {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_active', true)
      .order('aura_reward', { ascending: false })
    return data ?? []
  },

  /** Fetch tasks enriched with how many times user has done them today */
  async getTasksWithCounts(userId: string): Promise<TaskWithCount[]> {
    const today = new Date().toISOString().split('T')[0]

    const [tasksRes, countsRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('is_active', true).order('aura_reward', { ascending: false }),
      supabase.from('daily_task_counts')
        .select('task_id, count')
        .eq('user_id', userId)
        .eq('date', today),
    ])

    const counts: Record<string, number> = {}
    for (const row of countsRes.data ?? []) {
      counts[row.task_id] = row.count
    }

    return (tasksRes.data ?? []).map((task: Task) => ({
      ...task,
      completedToday: counts[task.id] ?? 0,
      canStart:       (counts[task.id] ?? 0) < task.daily_limit,
    }))
  },

  /** Admin: fetch ALL tasks including inactive */
  async getAllTasks(): Promise<Task[]> {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
    return data ?? []
  },

  /** Admin: create a task */
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'created_by'>) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, created_by: user?.id })
      .select()
      .single()
    if (error) throw error
    return data as Task
  },

  /** Admin: update a task */
  async updateTask(id: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Task
  },

  /** Admin: toggle task active state */
  async toggleTask(id: string, isActive: boolean) {
    return taskService.updateTask(id, { is_active: isActive })
  },
}
