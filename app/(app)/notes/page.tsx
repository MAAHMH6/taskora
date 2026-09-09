import { createClient } from '@/lib/supabase/server'
import NotesClient from './NotesClient'
import { Project } from '@/lib/types'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: notes }, { data: projects }] = await Promise.all([
    supabase.from('notes').select('*, project:projects(name, color, icon)').eq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('projects').select('id, name, color, icon').eq('user_id', user.id).eq('status', 'active'),
  ])

  return <NotesClient notes={notes || []} projects={(projects || []) as unknown as Project[]} />
}
