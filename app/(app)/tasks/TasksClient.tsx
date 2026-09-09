'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, parseISO, isToday, isPast } from 'date-fns'
import {
  CheckSquare, Plus, Filter, Search, MoreHorizontal, Calendar,
  Flag, Trash2, Edit3, Sparkles, FolderKanban, AlertCircle
} from 'lucide-react'
import { Task, Project } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import CreateTaskModal from '@/components/CreateTaskModal'

interface TasksClientProps {
  tasks: Task[]
  projects: Project[]
}

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed'
type FilterPriority = 'all' | 'high' | 'medium' | 'low'

export default function TasksClient({ tasks: initialTasks, projects }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const supabase = createClient()

  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    if (projectFilter !== 'all' && t.project_id !== projectFilter) return false
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    }).eq('id', taskId)
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    setTasks(prev => prev.filter(t => t.id !== taskId))
    await supabase.from('tasks').delete().eq('id', taskId)
  }

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  const priorityDot: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Tasks</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {tasks.filter(t => t.status !== 'completed').length} remaining · {tasks.filter(t => t.status === 'completed').length} completed
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/ai-inbox">
            <button className="btn-secondary" id="ai-capture-btn" style={{ fontSize: '13px' }}>
              <Sparkles size={14} /> AI Capture
            </button>
          </Link>
          <button className="btn-primary" id="new-task-btn" onClick={() => setShowCreateModal(true)} style={{ fontSize: '13px' }}>
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="task-search"
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="input"
              style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
            />
          </div>

          {/* Status tabs */}
          <div className="tab-bar">
            {(['all', 'pending', 'in_progress', 'completed'] as FilterStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`tab-btn ${statusFilter === s ? 'active' : ''}`}
              >
                {s === 'all' ? `All (${counts.all})` :
                 s === 'in_progress' ? `Active (${counts.in_progress})` :
                 `${s.charAt(0).toUpperCase() + s.slice(1)} (${counts[s]})`}
              </button>
            ))}
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as FilterPriority)}
            className="input"
            style={{ width: 'auto', height: '36px', fontSize: '13px', paddingRight: '28px' }}
            id="priority-filter"
          >
            <option value="all">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🔵 Low</option>
          </select>

          {/* Project filter */}
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="input"
              style={{ width: 'auto', height: '36px', fontSize: '13px', paddingRight: '28px' }}
              id="project-filter"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <CheckSquare size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {tasks.length === 0 ? 'Create your first task or use AI Inbox to organize your thoughts' : 'Try adjusting your filters'}
            </p>
            {tasks.length === 0 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ fontSize: '13px' }}>
                  <Plus size={14} /> New Task
                </button>
                <Link href="/ai-inbox">
                  <button className="btn-secondary" style={{ fontSize: '13px' }}>
                    <Sparkles size={14} /> AI Inbox
                  </button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredTasks.map((task, idx) => {
              const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed'
              const isDueToday = task.due_date && isToday(parseISO(task.due_date))
              const projectData = task.project as { name: string; color: string; icon: string } | null
              return (
                <div key={task.id} style={{
                  borderBottom: idx < filteredTasks.length - 1 ? '1px solid rgba(59,130,246,0.06)' : 'none'
                }}>
                  <div className="task-row" style={{ padding: '12px 20px' }}>
                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                      id={`task-toggle-${task.id}`}
                    >
                      {task.status === 'completed' && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <Link href={`/tasks/${task.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{
                            fontSize: '13.5px', fontWeight: 500,
                            color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {task.title}
                          </span>
                          {task.ai_generated && (
                            <Sparkles size={11} style={{ color: '#a78bfa', flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {projectData && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <span style={{ fontSize: '10px' }}>{projectData.icon}</span>
                              {projectData.name}
                            </span>
                          )}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {(task.subtasks as { completed: boolean }[]).filter(s => s.completed).length}/{task.subtasks.length} subtasks
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <span className={`badge-${task.priority}`} style={{ flexShrink: 0 }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: priorityDot[task.priority], display: 'inline-block' }} />
                      {task.priority}
                    </span>

                    {task.due_date && (
                      <span style={{
                        fontSize: '11px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px',
                        color: isOverdue ? '#fca5a5' : isDueToday ? '#fcd34d' : 'var(--text-muted)'
                      }}>
                        <Calendar size={11} />
                        {isOverdue ? '⚠ ' : ''}{format(parseISO(task.due_date), 'MMM d')}
                      </span>
                    )}

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Link href={`/tasks/${task.id}`}>
                        <button className="btn-ghost" style={{ padding: '4px 6px' }} id={`edit-task-${task.id}`}>
                          <Edit3 size={13} />
                        </button>
                      </Link>
                      <button
                        className="btn-ghost"
                        style={{ padding: '4px 6px', color: 'rgba(239,68,68,0.6)' }}
                        onClick={() => deleteTask(task.id)}
                        id={`delete-task-${task.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newTask) => {
            setTasks(prev => [newTask, ...prev])
            setShowCreateModal(false)
          }}
        />
      )}
    </div>
  )
}
