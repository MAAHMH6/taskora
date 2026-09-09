'use client'

import { BarChart2, TrendingUp, CheckSquare, AlertCircle, Clock, Target } from 'lucide-react'

interface AnalyticsClientProps {
  totalTasks: number
  completed: number
  overdue: number
  totalFocusMin: number
  weeklyData: { day: string; tasks: number; completed: number }[]
  projects: { id: string; name: string; color: string; progress: number }[]
  tasksByPriority: { high: number; medium: number; low: number }
}

export default function AnalyticsClient({
  totalTasks, completed, overdue, totalFocusMin, weeklyData, projects, tasksByPriority
}: AnalyticsClientProps) {
  const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0
  const maxCompleted = Math.max(...weeklyData.map(d => d.completed), 1)

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Analytics</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Your productivity insights</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total Tasks', value: totalTasks, icon: CheckSquare, color: '#3b82f6' },
          { label: 'Completed', value: completed, icon: TrendingUp, color: '#10b981' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: Target, color: '#8b5cf6' },
          { label: 'Overdue', value: overdue, icon: AlertCircle, color: '#ef4444' },
          { label: 'Focus Time', value: `${Math.floor(totalFocusMin / 60)}h ${totalFocusMin % 60}m`, icon: Clock, color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div style={{
              width: '34px', height: '34px', borderRadius: '8px',
              background: `${stat.color}20`, border: `1px solid ${stat.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
            }}>
              <stat.icon size={16} style={{ color: stat.color }} />
            </div>
            <p style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
        {/* Weekly bar chart */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '20px' }}>
            Weekly Completion
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', padding: '0 4px' }}>
            {weeklyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                  <div style={{
                    width: '100%',
                    height: `${Math.max((d.completed / maxCompleted) * 100, d.completed > 0 ? 8 : 0)}%`,
                    background: 'linear-gradient(180deg, #3b82f6, #8b5cf6)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: d.completed > 0 ? '8px' : '0',
                    transition: 'height 0.5s ease'
                  }} />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.day}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{d.completed}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Priority breakdown */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>By Priority</h2>
            {[
              { label: 'High', count: tasksByPriority.high, color: '#ef4444' },
              { label: 'Medium', count: tasksByPriority.medium, color: '#f59e0b' },
              { label: 'Low', count: tasksByPriority.low, color: '#3b82f6' },
            ].map(p => {
              const pct = totalTasks > 0 ? (p.count / totalTasks) * 100 : 0
              return (
                <div key={p.label} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{p.count}</span>
                  </div>
                  <div className="progress-bar">
                    <div style={{
                      height: '100%', width: `${pct}%`, background: p.color,
                      borderRadius: '2px', transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Projects progress */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Projects</h2>
            {projects.slice(0, 4).map(p => (
              <div key={p.id} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{p.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div style={{
                    height: '100%', width: `${p.progress}%`,
                    background: `linear-gradient(90deg, ${p.color}, ${p.color}88)`,
                    borderRadius: '2px', transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>No projects yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
