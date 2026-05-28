'use client'

import { useEffect, useState } from 'react'
import {
  Plus, Edit2, ToggleLeft, ToggleRight,
  Save, X, AlertCircle, Zap, Clock, Target,
} from 'lucide-react'
import { PageHeader }  from '@/components/ui/PageHeader'
import { PageLoading } from '@/components/ui/Loading'
import { StatCard }    from '@/components/ui/StatCard'
import { useProfile }  from '@/hooks/useProfile'
import { taskService } from '@/services/taskService'
import { useRouter }   from 'next/navigation'
import { cn }          from '@/utils/helpers'
import type { Task, TaskCategory } from '@/types'

const CATEGORIES: TaskCategory[] = [
  'workout', 'study', 'coding', 'reading', 'meditation', 'deep_work', 'other',
]

const CATEGORY_ICONS: Record<string, string> = {
  workout: '💪', study: '📚', coding: '💻',
  reading: '📖', meditation: '🧠', deep_work: '⚡', other: '🎯',
}

const EMPTY_FORM = {
  title:            '',
  description:      '',
  duration_minutes: 30,
  aura_reward:      500,
  daily_limit:      2,
  category:         'other' as TaskCategory,
  icon:             '',
  is_active:        true,
}

type FormData = typeof EMPTY_FORM

export default function AdminTasksPage() {
  const profile = useProfile()
  const router  = useRouter()

  const [tasks,       setTasks]       = useState<Task[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editingId,   setEditingId]   = useState<string | null>(null)
  const [form,        setForm]        = useState<FormData>(EMPTY_FORM)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [togglingId,  setTogglingId]  = useState<string | null>(null)

  useEffect(() => {
    if (profile && profile.role !== 'admin') router.push('/dashboard')
  }, [profile])

  const loadTasks = async () => {
    const data = await taskService.getAllTasks()
    setTasks(data)
    setLoading(false)
  }
  useEffect(() => { loadTasks() }, [])

  const activeCount   = tasks.filter(t => t.is_active).length
  const inactiveCount = tasks.filter(t => !t.is_active).length
  const totalAura     = tasks.filter(t => t.is_active).reduce((a, t) => a + t.aura_reward, 0)

  // ── Form helpers ─────────────────────────────────────────
  const openNew = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError(null)
    setShowForm(true)
  }

  const openEdit = (task: Task) => {
    setForm({
      title:            task.title,
      description:      task.description ?? '',
      duration_minutes: task.duration_minutes,
      aura_reward:      task.aura_reward,
      daily_limit:      task.daily_limit,
      category:         task.category,
      icon:             task.icon ?? '',
      is_active:        task.is_active,
    })
    setEditingId(task.id)
    setError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setError(null)
  }

  const set = (field: keyof FormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  // ── Save (create or update) ──────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (form.duration_minutes < 1)  { setError('Duration must be at least 1 minute.'); return }
    if (form.aura_reward < 1)       { setError('Aura reward must be at least 1.'); return }
    if (form.daily_limit < 1)       { setError('Daily limit must be at least 1.'); return }

    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        const updated = await taskService.updateTask(editingId, form)
        setTasks(prev => prev.map(t => t.id === editingId ? updated : t))
      } else {
        const created = await taskService.createTask(form)
        setTasks(prev => [created, ...prev])
      }
      closeForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle active state ──────────────────────────────────
  const handleToggle = async (task: Task) => {
    setTogglingId(task.id)
    try {
      const updated = await taskService.toggleTask(task.id, !task.is_active)
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    } catch (err) {
      console.error(err)
    } finally {
      setTogglingId(null)
    }
  }

  if (!profile || loading) return <PageLoading />
  if (profile.role !== 'admin') return null

  return (
    <div className="min-h-full">
      <PageHeader
        title="Admin — Tasks"
        subtitle={`${activeCount} active · ${inactiveCount} inactive`}
        right={
          <button onClick={openNew} className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5">
            <Plus size={13} /> New Task
          </button>
        }
      />

      <div className="p-5 space-y-5">

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Active Tasks"   value={activeCount}   icon={Target} variant="purple" />
          <StatCard label="Inactive Tasks" value={inactiveCount} icon={Target} />
          <StatCard label="Max Daily Aura" value={totalAura.toLocaleString()} sub="if all done" icon={Zap} variant="blue" />
        </div>

        {/* ── TASK LIST ── */}
        <div className="card overflow-hidden">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_80px_80px_60px_120px_80px] gap-3 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
            {['Task', 'Category', 'Duration', 'Aura', 'Limit', 'Status', 'Actions'].map(h => (
              <span key={h} className="font-hud font-bold text-[10px] uppercase tracking-widest text-slate-600">{h}</span>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="py-16 text-center text-slate-700 font-hud text-xs uppercase tracking-widest">
              No tasks yet. Create the first one.
            </div>
          )}

          {tasks.map(task => (
            <div key={task.id}
              className={cn(
                'grid grid-cols-1 md:grid-cols-[2fr_1fr_80px_80px_60px_120px_80px] gap-3 px-5 py-4 border-b border-white/[0.04] last:border-none items-center',
                !task.is_active && 'opacity-50',
              )}
            >
              {/* Title + description */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">{CATEGORY_ICONS[task.category]}</span>
                  <span className="font-hud font-bold text-sm text-slate-200">{task.title}</span>
                </div>
                {task.description && (
                  <p className="font-hud text-[10px] text-slate-600 mt-0.5 line-clamp-1 ml-7">
                    {task.description}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="font-hud text-xs text-slate-500 capitalize">
                {task.category.replace('_', ' ')}
              </div>

              {/* Duration */}
              <div className="flex items-center gap-1">
                <Clock size={10} className="text-slate-600" />
                <span className="font-hud text-xs text-slate-400">{task.duration_minutes}m</span>
              </div>

              {/* Aura */}
              <div className="flex items-center gap-1">
                <Zap size={10} className="text-purple-400" />
                <span className="font-hud font-bold text-xs text-purple-400">{task.aura_reward.toLocaleString()}</span>
              </div>

              {/* Daily limit */}
              <div className="font-hud text-xs text-slate-500">×{task.daily_limit}</div>

              {/* Active toggle */}
              <button
                onClick={() => handleToggle(task)}
                disabled={togglingId === task.id}
                className={cn(
                  'flex items-center gap-1.5 font-hud text-[11px] font-bold uppercase tracking-wider transition-colors',
                  task.is_active ? 'text-green-400 hover:text-green-300' : 'text-slate-600 hover:text-slate-400',
                )}
              >
                {togglingId === task.id
                  ? <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
                  : task.is_active
                    ? <ToggleRight size={16} />
                    : <ToggleLeft size={16} />
                }
                {task.is_active ? 'Active' : 'Off'}
              </button>

              {/* Edit button */}
              <button
                onClick={() => openEdit(task)}
                className="flex items-center gap-1.5 text-slate-600 hover:text-purple-400 font-hud text-[11px] uppercase tracking-wider transition-colors"
              >
                <Edit2 size={12} /> Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── TASK FORM MODAL ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={closeForm}
        >
          <div
            className="card-purple w-full max-w-lg p-6 my-8 animate-rank-unlock"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-hud font-bold text-lg tracking-widest text-slate-100 uppercase">
                {editingId ? 'Edit Task' : 'New Task'}
              </h2>
              <button onClick={closeForm} className="text-slate-600 hover:text-slate-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="section-header block mb-1.5">Title *</label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Morning Workout"
                  className="input-cyber"
                />
              </div>

              {/* Description */}
              <div>
                <label className="section-header block mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="What does this task involve?"
                  rows={2}
                  className="input-cyber resize-none"
                />
              </div>

              {/* Category + Icon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="section-header block mb-1.5">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => set('category', e.target.value as TaskCategory)}
                    className="input-cyber"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {CATEGORY_ICONS[c]} {c.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="section-header block mb-1.5">Icon (lucide name)</label>
                  <input
                    value={form.icon}
                    onChange={e => set('icon', e.target.value)}
                    placeholder="e.g. Dumbbell"
                    className="input-cyber"
                  />
                </div>
              </div>

              {/* Duration + Aura + Daily limit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="section-header block mb-1.5">Duration (min) *</label>
                  <input
                    type="number" min={1} max={480}
                    value={form.duration_minutes}
                    onChange={e => set('duration_minutes', parseInt(e.target.value) || 1)}
                    className="input-cyber"
                  />
                </div>
                <div>
                  <label className="section-header block mb-1.5">Aura Reward *</label>
                  <input
                    type="number" min={1}
                    value={form.aura_reward}
                    onChange={e => set('aura_reward', parseInt(e.target.value) || 1)}
                    className="input-cyber"
                  />
                </div>
                <div>
                  <label className="section-header block mb-1.5">Daily Limit *</label>
                  <input
                    type="number" min={1} max={10}
                    value={form.daily_limit}
                    onChange={e => set('daily_limit', parseInt(e.target.value) || 1)}
                    className="input-cyber"
                  />
                </div>
              </div>

              {/* Aura/min hint */}
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                <Zap size={11} className="text-purple-400 flex-shrink-0" />
                <span className="font-hud text-[11px] text-slate-500">
                  {(form.aura_reward / form.duration_minutes).toFixed(1)} aura/min ·{' '}
                  max <span className="text-purple-400 font-bold">
                    {(form.aura_reward * form.daily_limit).toLocaleString()}
                  </span> aura/day per user
                </span>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-1">
                <span className="section-header mb-0">Active (visible to users)</span>
                <button
                  onClick={() => set('is_active', !form.is_active)}
                  className={cn(
                    'flex items-center gap-1.5 font-hud font-bold text-sm transition-colors',
                    form.is_active ? 'text-green-400' : 'text-slate-600',
                  )}
                >
                  {form.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {form.is_active ? 'On' : 'Off'}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5 text-xs font-hud">
                  <AlertCircle size={13} className="flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Save size={14} />}
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Task'}
              </button>
              <button onClick={closeForm} className="btn-secondary px-5">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
