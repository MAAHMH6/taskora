import { createClient } from '@/lib/supabase/server'
import { format, isToday, isPast, startOfWeek, endOfWeek } from 'date-fns'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(today), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(today), 'yyyy-MM-dd')

  // Fetch all needed data in parallel
  const [
    { data: todayTasks },
    { data: overdueTasks },
    { data: weekTasks },
    { data: projects },
    { data: recentActivity },
    { data: upcomingTasks },
    { data: focusSessions },
  ] = await Promise.all([
    supabase.from('tasks').select('*, project:projects(name, color, icon)')
      .eq('user_id', user.id)
      .eq('due_date', todayStr)
      .neq('status', 'cancelled')
      .order('priority', { ascending: true })
      .order('sort_order'),
    supabase.from('tasks').select('id, title, priority, due_date, status, project:projects(name, color)')
      .eq('user_id', user.id)
      .lt('due_date', todayStr)
      .neq('status', 'completed')
      .neq('status', 'cancelled'),
    supabase.from('tasks').select('id, status')
      .eq('user_id', user.id)
      .gte('due_date', weekStart)
      .lte('due_date', weekEnd),
    supabase.from('projects').select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(4),
    supabase.from('task_activity').select('*, task:tasks(title), profile:profiles(full_name)')
      .eq('tasks.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('tasks').select('*, project:projects(name, color, icon)')
      .eq('user_id', user.id)
      .gt('due_date', todayStr)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('due_date')
      .limit(5),
    supabase.from('focus_sessions').select('duration_minutes')
      .eq('user_id', user.id)
      .gte('started_at', format(today, "yyyy-MM-dd'T'00:00:00")),
  ])

  const todayCompleted = (todayTasks || []).filter(t => t.status === 'completed').length
  const weekCompleted = (weekTasks || []).filter(t => t.status === 'completed').length
  const totalTasks = weekTasks?.length || 0
  const completionRate = totalTasks > 0 ? Math.round((weekCompleted / totalTasks) * 100) : 0
  const focusMinutes = (focusSessions || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const stats = {
    todayTotal: todayTasks?.length || 0,
    todayCompleted,
    overdue: overdueTasks?.length || 0,
    weekCompleted,
    completionRate,
    focusMinutes,
  }

  return (
    <DashboardClient
      stats={stats}
      todayTasks={todayTasks || []}
      projects={projects || []}
      upcomingTasks={upcomingTasks || []}
      userName={user.email?.split('@')[0] || 'there'}
    />
  )
}
