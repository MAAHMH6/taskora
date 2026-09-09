'use client'

import { useState } from 'react'
import { X, FolderKanban, Flag, Calendar, Tag, FileText, Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Task, Project, Priority, TaskStatus } from '@/lib/types'
import { format } from 'date-fns'

interface CreateTaskModalProps {
  projects: Project[]
  onClose: () => void
  onCreated: (task: Task) => void
  defaultProjectId?: string
}

export default function CreateTaskModal({ projects, onClose, onCreated, defaultProjectId }: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<TaskStatus>('pending')
  const [projectId, setProjectId] = useState(defaultProjectId || '')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: task, error: err } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      project_id: projectId || null,
      due_date: dueDate || null,
      due_time: dueTime || null,
    }).select('*, project:projects(name, color, icon), subtasks(*)').single()

    if (err || !task) {
      setError(err?.message || 'Failed to create task')
      setLoading(false)
      return
    }

    // Create subtasks
    if (subtasks.length > 0) {
      await supabase.from('subtasks').insert(
        subtasks.filter(s => s.trim()).map((s, i) => ({
          task_id: task.id,
          user_id: user.id,
          title: s,
          sort_order: i,
        }))
      )
    }

    setLoading(false)
    onCreated(task as Task)
  }

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks(prev => [...prev, newSubtask.trim()])
      setNewSubtask('')
    }
  }

  const priorityOptions: { value: Priority; label: string; color: string }[] = [
    { value: 'high', label: '🔴 High', color: '#ef4444' },
    { value: 'medium', label: '🟡 Medium', color: '#f59e0b' },
    { value: 'low', label: '🔵 Low', color: '#3b82f6' },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fade-in" style={{ maxWidth: '540px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid var(--border)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Create New Task</h2>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '6px' }} id="close-create-modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5', fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Task Title *
            </label>
            <input
              id="create-task-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="input"
              autoFocus
              style={{ fontSize: '15px', fontWeight: 500 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Description
            </label>
            <textarea
              id="create-task-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add details, context, or notes..."
              className="textarea"
              style={{ minHeight: '72px', fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Priority
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {priorityOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    style={{
                      flex: 1, padding: '7px 4px', borderRadius: '8px', fontSize: '12px',
                      border: `1px solid ${priority === opt.value ? opt.color : 'var(--border)'}`,
                      background: priority === opt.value ? `${opt.color}20` : 'transparent',
                      color: priority === opt.value ? opt.color : 'var(--text-muted)',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500,
                      transition: 'all 0.15s ease'
                    }}
                    id={`priority-${opt.value}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="input"
                style={{ fontSize: '13px' }}
                id="create-task-status"
              >
                <option value="pending">⏳ Pending</option>
                <option value="in_progress">🔄 In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Due Date
              </label>
              <input
                id="create-task-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="input"
                style={{ fontSize: '13px', colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Due Time
              </label>
              <input
                id="create-task-due-time"
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="input"
                style={{ fontSize: '13px', colorScheme: 'dark' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Project
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="input"
              style={{ fontSize: '13px' }}
              id="create-task-project"
            >
              <option value="">No project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
          </div>

          {/* Subtasks */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Subtasks
            </label>
            {subtasks.map((st, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(59,130,246,0.5)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>{st}</span>
                <button type="button" onClick={() => setSubtasks(prev => prev.filter((_, idx) => idx !== i))}
                  className="btn-ghost" style={{ padding: '2px 4px', fontSize: '11px' }}>
                  ×
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
                placeholder="Add a subtask..."
                className="input"
                style={{ fontSize: '13px', flex: 1 }}
                id="new-subtask-input"
              />
              <button type="button" onClick={addSubtask} className="btn-secondary" style={{ padding: '8px 12px' }}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          <hr className="divider" />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn-ghost" id="cancel-create-task">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="btn-primary"
              id="submit-create-task"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
