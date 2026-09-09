import { createClient } from '@/lib/supabase/server'
import ProjectsClient from './ProjectsClient'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(id, status, priority)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return <ProjectsClient projects={projects || []} />
}
