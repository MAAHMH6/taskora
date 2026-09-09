'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FolderKanban, CheckSquare, MoreHorizontal, Archive, Trash2, Loader2, X } from 'lucide-react'
import { Project } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

const PROJECT_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316']
const PROJECT_ICONS = ['📁','🚀','💼','🎯','⚡','🔧','🎨','📊','🌐','💡','🏗️','⚙️']

interface ProjectsClientProps {
  projects: (Project & { tasks?: { id: string; status: string; priority: string }[] })[]
}

export default function ProjectsClient({ projects: initialProjects }: ProjectsClientProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0])
  const [newIcon, setNewIcon] = useState(PROJECT_ICONS[0])
  const [creating, setCreating] = useState(false)
  const supabase = createClient()

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: project } = await supabase.from('projects').insert({
      user_id: user.id,
      name: newName.trim(),
      description: newDesc.trim() || null,
      color: newColor,
      icon: newIcon,
    }).select('*, tasks(id, status, priority)').single()

    if (project) {
      setProjects(prev => [project, ...prev])
      setNewName('')
      setNewDesc('')
      setShowCreate(false)
    }
    setCreating(false)
  }

  const archiveProject = async (projectId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: 'archived' as Project['status'] } : p))
    await supabase.from('projects').update({ status: 'archived' }).eq('id', projectId)
  }

  const activeProjects = projects.filter(p => p.status === 'active')
  const archivedProjects = projects.filter(p => p.status === 'archived')

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Projects</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {activeProjects.length} active · {archivedProjects.length} archived
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} id="new-project-btn" style={{ fontSize: '13px' }}>
          <Plus size={14} /> New Project
        </button>
      </div>

      {/* Project grid */}
      {activeProjects.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <FolderKanban size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>No projects yet</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Organize your tasks into projects</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: '13px' }}>
            <Plus size={14} /> Create First Project
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {activeProjects.map(project => {
            const tasks = project.tasks || []
            const total = tasks.length
            const completed = tasks.filter(t => t.status === 'completed').length
            const high = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length

            return (
              <div key={project.id} className="glass-card" style={{ padding: '20px', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: `${project.color}20`, border: `1px solid ${project.color}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                    }}>
                      {project.icon}
                    </div>
                    <div>
                      <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>{project.name}</h3>
                      </Link>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {total} task{total !== 1 ? 's' : ''}
                        {high > 0 ? ` · ${high} high priority` : ''}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => archiveProject(project.id)}
                    className="btn-ghost"
                    style={{ padding: '4px' }}
                    title="Archive"
                    id={`archive-project-${project.id}`}
                  >
                    <Archive size={14} />
                  </button>
                </div>

                {project.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                    {project.description}
                  </p>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Progress</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'white' }}>{project.progress}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: '6px' }}>
                    <div className="progress-fill" style={{
                      width: `${project.progress}%`,
                      background: `linear-gradient(90deg, ${project.color}, ${project.color}88)`
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {tasks.slice(0, 3).map(t => (
                    <span key={t.id} style={{
                      fontSize: '10px', padding: '2px 8px', borderRadius: '6px',
                      background: t.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.08)',
                      color: t.status === 'completed' ? '#6ee7b7' : 'var(--text-muted)',
                      border: `1px solid ${t.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                    }}>
                      {t.status === 'completed' ? '✓' : '○'}
                    </span>
                  ))}
                  {total > 3 && (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '2px 6px' }}>+{total - 3} more</span>
                  )}
                </div>

                <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none', display: 'block', marginTop: '12px' }}>
                  <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px' }}>
                    Open Project →
                  </button>
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal animate-fade-in" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>New Project</h2>
              <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={createProject} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Project Name *
                </label>
                <input
                  id="new-project-name"
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. LevelHubAI, SmartReturns..."
                  className="input"
                  autoFocus
                  style={{ fontSize: '15px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Brief description..."
                  className="textarea"
                  style={{ minHeight: '64px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Color
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PROJECT_COLORS.map(c => (
                    <button
                      key={c} type="button" onClick={() => setNewColor(c)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '50%', background: c, border: 'none',
                        cursor: 'pointer', outline: newColor === c ? `3px solid white` : 'none', outlineOffset: '2px',
                        transition: 'outline 0.15s'
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Icon
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {PROJECT_ICONS.map(icon => (
                    <button
                      key={icon} type="button" onClick={() => setNewIcon(icon)}
                      style={{
                        width: '36px', height: '36px', borderRadius: '8px', fontSize: '18px',
                        border: `1px solid ${newIcon === icon ? newColor : 'var(--border)'}`,
                        background: newIcon === icon ? `${newColor}20` : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={creating || !newName.trim()} className="btn-primary" id="create-project-submit">
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
