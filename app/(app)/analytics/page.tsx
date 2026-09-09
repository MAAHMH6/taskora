import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date()
  const weekAgo = format(subDays(today, 7), 'yyyy-MM-dd')

  const [{ data: allTasks }, { data: focusSessions }, { data: projects }] = await Promise.all([
    supabase.from('tasks').select('id, status, priority, due_date, created_at, completed_at').eq('user_id', user.id).neq('status', 'cancelled'),
    supabase.from('focus_sessions').select('duration_minutes, started_at, session_type').eq('user_id', user.id).gte('started_at', `${weekAgo}T00:00:00`),
    supabase.from('projects').select('id, name, color, progress').eq('user_id', user.id).eq('status', 'active'),
  ])

  const tasks = allTasks || []
  const completed = tasks.filter(t => t.status === 'completed')
  const overdue = tasks.filter(t => t.due_date && t.due_date < format(today, 'yyyy-MM-dd') && t.status !== 'completed')
  const totalFocusMin = (focusSessions || []).filter(s => s.session_type === 'focus').reduce((s, f) => s + (f.duration_minutes || 0), 0)

  // Weekly completion data (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(today, 6 - i), 'yyyy-MM-dd')
    const dayTasks = tasks.filter(t => t.due_date === d).length
    const dayCompleted = tasks.filter(t => t.completed_at?.startsWith(d)).length
    return { day: format(subDays(today, 6 - i), 'EEE'), tasks: dayTasks, completed: dayCompleted }
  })

  return (
    <AnalyticsClient
      totalTasks={tasks.length}
      completed={completed.length}
      overdue={overdue.length}
      totalFocusMin={totalFocusMin}
      weeklyData={weeklyData}
      projects={projects || []}
      tasksByPriority={{
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length,
      }}
    />
  )
}
