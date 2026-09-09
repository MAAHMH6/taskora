import { createClient } from '@/lib/supabase/server'
import SharedClient from './SharedClient'

export default async function SharedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: shares } = await supabase
    .from('shares')
    .select('*, task:tasks(id, title, status, priority), project:projects(id, name, icon)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <SharedClient shares={shares || []} />
}
