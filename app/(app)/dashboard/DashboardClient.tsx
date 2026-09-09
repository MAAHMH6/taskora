'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import {
  CheckSquare, AlertCircle, TrendingUp, Clock, Target,
  ArrowRight, Sparkles, Zap, ChevronRight, MoreHorizontal,
  Plus, Calendar, FolderKanban
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Task, Project, DashboardStats } from '@/lib/types'

interface DashboardClientProps {
  stats: DashboardStats
  todayTasks: Task[]
  projects: Project[]
  upcomingTasks: Task[]
  userName: string
}

function StatCard({ icon: Icon, label, value, sub, color, accent }: {
  icon: React.ElementType, label: string, value: string | number,
  sub?: string, color: string, accent: string
}) {
  return (
    <div className="stat-card" style={{ flex: '1', minWidth: '140px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '9px',
          background: `rgba(${color}, 0.15)`, border: `1px solid rgba(${color}, 0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={17} style={{ color: `rgb(${accent})` }} />
        </div>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === 'high' ? 'badge-high' : priority === 'medium' ? 'badge-medium' : 'badge-low'
  const dot = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#3b82f6'
  return (
    <span className={cls}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dot, display: 'inline-block' }} />
      {priority}
    </span>
  )
}

export default function DashboardClient({ stats, todayTasks, projects, upcomingTasks, userName }: DashboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>(todayTasks)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const filteredTasks = activeFilter === 'all' ? tasks :
    tasks.filter(t => t.priority === activeFilter)

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
    await supabase.from('tasks').update({
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null
    }).eq('id', taskId)
  }

  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1)

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>

      {/* Welcome Banner */}
      <div className="glass-card" style={{
        padding: '24px 28px', marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(10,20,50,0.9) 0%, rgba(15,10,40,0.9) 100%)',
        position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%',
          background: 'radial-gradient(ellipse at right, rgba(59,130,246,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{greeting},</p>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>
            {displayName} 👋
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Here&apos;s what&apos;s happening with your tasks today.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1 }}>
          <TrendingUp size={16} style={{ color: 'var(--accent-green)' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Small steps create big results.</span>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <StatCard
          icon={CheckSquare} label="Today's Tasks"
          value={`${stats.todayCompleted} / ${stats.todayTotal}`}
          color="59,130,246" accent="96,165,250"
        />
        <StatCard
          icon={AlertCircle} label="Overdue"
          value={stats.overdue}
          sub={stats.overdue > 0 ? 'Needs attention' : 'All caught up!'}
          color="239,68,68" accent="252,165,165"
        />
        <StatCard
          icon={TrendingUp} label="This Week"
          value={stats.weekCompleted}
          sub="completed"
          color="16,185,129" accent="110,231,183"
        />
        <StatCard
          icon={Target} label="Completion Rate"
          value={`${stats.completionRate}%`}
          sub="+12% from last week"
          color="139,92,246" accent="196,181,253"
        />
        <StatCard
          icon={Clock} label="Focus Time"
          value={stats.focusMinutes >= 60
            ? `${Math.floor(stats.focusMinutes / 60)}h ${stats.focusMinutes % 60}m`
            : `${stats.focusMinutes}m`}
          sub="today"
          color="245,158,11" accent="252,211,77"
        />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Today's Tasks */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>Today&apos;s Tasks</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="tab-bar">
                  {['all', 'high', 'medium', 'low'].map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`tab-btn ${activeFilter === f ? 'active' : ''}`}
                    >
                      {f === 'all' ? `All (${tasks.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <Link href="/tasks/new">
                  <button className="btn-primary" style={{ padding: '7px 12px', fontSize: '12px' }}>
                    <Plus size={13} /> Add Task
                  </button>
                </Link>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                <CheckSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px' }}>No tasks for today</p>
                <Link href="/ai-inbox">
                  <button className="btn-secondary" style={{ marginTop: '12px', fontSize: '13px' }}>
                    <Sparkles size={14} /> Use AI Inbox to add tasks
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredTasks.map(task => (
                  <div key={task.id} className="task-row">
                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      className={`task-checkbox ${task.status === 'completed' ? 'checked' : ''}`}
                      id={`task-check-${task.id}`}
                    >
                      {task.status === 'completed' && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <Link href={`/tasks/${task.id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
                      <span style={{
                        fontSize: '13.5px', fontWeight: 500,
                        color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {task.title}
                      </span>
                    </Link>

                    <PriorityBadge priority={task.priority} />

                    {task.project && (
                      <span style={{
                        fontSize: '11px', color: 'var(--text-muted)',
                        background: 'rgba(59,130,246,0.08)', padding: '2px 8px',
                        borderRadius: '6px', whiteSpace: 'nowrap'
                      }}>
                        {(task.project as { icon?: string; name: string }).icon} {(task.project as { icon?: string; name: string }).name}
                      </span>
                    )}

                    {task.due_date && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <Calendar size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        {format(parseISO(task.due_date), 'h:mm a')}
                      </span>
                    )}

                    <button className="btn-ghost" style={{ padding: '4px' }}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Link href="/tasks" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', fontSize: '13px' }}>
                View all tasks <ArrowRight size={14} />
              </button>
            </Link>
          </div>

          {/* AI Daily Planner */}
          <div className="glass-card ai-glow" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: '#a78bfa' }} />
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>AI Daily Planner</h2>
              </div>
              <Link href="/ai-inbox">
                <button className="btn-ghost" style={{ fontSize: '12px' }}>
                  View Plan <ArrowRight size={13} />
                </button>
              </Link>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Good morning. Here&apos;s your personalized plan for today.
            </p>

            {todayTasks.slice(0, 4).map((task, i) => {
              const times = ['9:00 – 10:30', '10:30 – 11:00', '11:00 – 11:30', '2:00 – 3:00']
              const dot = task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6'
              return (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '10px', marginBottom: '6px',
                  background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.08)'
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '80px', flexShrink: 0 }}>{times[i]}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </span>
                  <PriorityBadge priority={task.priority} />
                </div>
              )
            })}

            {todayTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '13px' }}>No tasks scheduled for today</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px' }} id="accept-plan-btn">
                <Zap size={14} /> Accept Plan
              </button>
              <button className="btn-secondary" style={{ padding: '10px 16px' }} id="regenerate-plan-btn">
                <Sparkles size={14} /> Regenerate
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Quick Capture */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Zap size={15} style={{ color: 'var(--accent-blue-light)' }} />
              <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Quick Capture</h2>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {['Text', 'Voice', 'File', 'Image'].map((tab, i) => {
                const icons = ['✏️', '🎤', '📄', '🖼️']
                return (
                  <button key={tab} className={`tab-btn ${i === 0 ? 'active' : ''}`}
                    style={{ flex: 1, flexDirection: 'column', gap: '4px', padding: '8px 4px', fontSize: '11px' }}
                    id={`quick-capture-${tab.toLowerCase()}`}
                  >
                    <span>{icons[i]}</span>
                    {tab}
                  </button>
                )
              })}
            </div>

            <textarea
              id="quick-capture-text"
              className="textarea"
              placeholder="e.g. Tomorrow I need to finish the LevelHub curriculum and make 10 Instagram posts..."
              style={{ minHeight: '80px', fontSize: '13px', marginBottom: '10px' }}
            />

            <Link href="/ai-inbox" style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }} id="ai-organize-btn">
                <Sparkles size={14} /> Let AI Organize
              </button>
            </Link>
          </div>

          {/* Recent Projects */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderKanban size={15} style={{ color: 'var(--accent-blue-light)' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Recent Projects</h2>
              </div>
              <Link href="/projects">
                <button className="btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>
                  View all <ArrowRight size={12} />
                </button>
              </Link>
            </div>

            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '13px' }}>No projects yet</p>
                <Link href="/projects">
                  <button className="btn-secondary" style={{ marginTop: '8px', fontSize: '12px' }}>
                    <Plus size={13} /> New Project
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {projects.map(project => (
                  <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '26px', height: '26px', borderRadius: '7px',
                            background: `${project.color}25`, border: `1px solid ${project.color}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px'
                          }}>
                            {project.icon}
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {project.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {project.progress}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${project.progress}%`, background: `linear-gradient(90deg, ${project.color}, ${project.color}88)` }} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} style={{ color: 'var(--accent-blue-light)' }} />
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>Upcoming</h2>
              </div>
              <Link href="/calendar">
                <button className="btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>
                  View all <ArrowRight size={12} />
                </button>
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingTasks.slice(0, 5).map(task => {
                const dot = task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6'
                const dueDate = task.due_date ? parseISO(task.due_date) : null
                const dayLabel = dueDate ? format(dueDate, 'EEE') : ''
                return (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '30px', flexShrink: 0 }}>{dayLabel}</span>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dot, flexShrink: 0 }} />
                    <Link href={`/tasks/${task.id}`} style={{ textDecoration: 'none', flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: '12px', color: 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block'
                      }}>
                        {task.title}
                      </span>
                    </Link>
                  </div>
                )
              })}
              {upcomingTasks.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                  No upcoming tasks
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
