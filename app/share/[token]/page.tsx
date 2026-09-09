import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Calendar, Flag, FolderKanban, ExternalLink } from 'lucide-react'

export default async function SharePage({ params }: { params: { token: string } }) {
  const supabase = await createClient()

  const { data: share } = await supabase
    .from('shares')
    .select('*, task:tasks(*, project:projects(name, color, icon), subtasks(*)), project:projects(*)')
    .eq('token', params.token)
    .eq('is_active', true)
    .single()

  if (!share) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const task = share.task as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const project = task ? (task.project as any) : (share.project as any)

  const priorityColor: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' }
  const priorityLabel: Record<string, string> = { high: '🔴 High', medium: '🟡 Medium', low: '🔵 Low' }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.12) 0%, transparent 60%), #050d1a',
      fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '40px 20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '9px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <CheckCircle2 size={20} color="white" />
        </div>
        <span style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>Taskora</span>
      </div>

      <div style={{ width: '100%', maxWidth: '600px' }}>
        {task ? (
          <div style={{
            background: 'rgba(10, 20, 45, 0.9)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59,130,246,0.2)', borderRadius: '20px',
            overflow: 'hidden'
          }}>
            {/* Task header */}
            <div style={{
              padding: '24px 28px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
              borderBottom: '1px solid rgba(59,130,246,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                {project && (
                  <span style={{
                    fontSize: '12px', padding: '3px 10px', borderRadius: '8px',
                    background: `${project.color}20`, color: project.color as string,
                    border: `1px solid ${project.color}30`, fontWeight: 600
                  }}>
                    {project.icon as string} {project.name as string}
                  </span>
                )}
                <span style={{
                  fontSize: '12px', padding: '3px 10px', borderRadius: '8px', fontWeight: 600,
                  background: `${priorityColor[task.priority as string] || '#3b82f6'}20`,
                  color: priorityColor[task.priority as string] || '#3b82f6',
                }}>
                  {priorityLabel[task.priority as string] || 'Medium'}
                </span>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', lineHeight: '1.3', marginBottom: '8px' }}>
                {task.title as string}
              </h1>
              {task.due_date && (
                <p style={{ fontSize: '13px', color: 'rgba(96,165,250,0.9)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={13} />
                  Due: {format(parseISO(task.due_date as string), 'EEEE, MMMM d, yyyy')}
                </p>
              )}
            </div>

            <div style={{ padding: '24px 28px' }}>
              {task.description && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(139,162,199,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Description</p>
                  <p style={{ fontSize: '14px', color: 'rgba(200,220,255,0.85)', lineHeight: '1.7' }}>{task.description as string}</p>
                </div>
              )}

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: task.status === 'completed' ? '#10b981' : task.status === 'in_progress' ? '#3b82f6' : '#6b7280'
                }} />
                <span style={{ fontSize: '13px', color: 'rgba(200,220,255,0.9)', fontWeight: 500, textTransform: 'capitalize' }}>
                  {(task.status as string).replace('_', ' ')}
                </span>
              </div>

              {/* Subtasks */}
              {(task.subtasks as unknown[])?.length > 0 && (
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(139,162,199,0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Subtasks ({(task.subtasks as { completed: boolean }[]).filter(s => s.completed).length}/{(task.subtasks as unknown[]).length} completed)
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(task.subtasks as { id: string; title: string; completed: boolean }[]).map((st) => (
                      <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(59,130,246,0.05)' }}>
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '50%',
                          background: st.completed ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                          border: st.completed ? 'none' : '2px solid rgba(59,130,246,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {st.completed && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <span style={{ fontSize: '13px', color: st.completed ? 'rgba(139,162,199,0.6)' : 'rgba(200,220,255,0.9)', textDecoration: st.completed ? 'line-through' : 'none' }}>
                          {st.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(59,130,246,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
              <a href="https://taskora.app" style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(139,162,199,0.6)' }}>
                  <span>Powered by Taskora</span>
                  <ExternalLink size={11} />
                </div>
              </a>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(139,162,199,0.8)' }}>
            <p>This shared item is no longer available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
