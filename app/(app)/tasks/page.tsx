import { createClient } from '@/lib/supabase/server'
import TasksClient from './TasksClient'
import { Project } from '@/lib/types'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase.from('tasks')
      .select('*, project:projects(name, color, icon), subtasks(*)')
      .eq('user_id', user.id)
      .neq('status', 'cancelled')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('priority')
      .order('sort_order'),
    supabase.from('projects')
      .select('id, name, color, icon')
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ])

  return <TasksClient tasks={tasks || []} projects={(projects || []) as unknown as Project[]} />
}
