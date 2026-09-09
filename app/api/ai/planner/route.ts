import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, addHours } from 'date-fns'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')

    // Fetch today's tasks and overdue tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('title, priority, due_date, status, project:projects(name)')
      .eq('user_id', user.id)
      .lte('due_date', todayStr)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('priority')
      .limit(20)

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({
        plan: [],
        message: "You have no pending tasks for today. Add some tasks using AI Inbox!"
      })
    }

    const taskList = tasks.map(t => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proj = t.project as any
      const projectName = proj?.name ? `[Project: ${proj.name}]` : ''
      return `- "${t.title}" [${t.priority} priority] ${projectName}`
    }).join('\n')

    const prompt = `You are a productivity AI. Create a realistic time-blocked daily plan for these tasks.

Today is ${format(today, 'EEEE, MMMM d, yyyy')} and it's currently ${format(today, 'h:mm a')}.

Tasks to schedule:
${taskList}

Rules:
- High priority tasks first (unless marked for later)
- Work blocks: 30-90 minutes
- Include short breaks between sessions
- Start scheduling from the current time if it's morning/afternoon, or suggest tomorrow if it's evening
- Be realistic about how long tasks take

Return ONLY valid JSON:
{
  "plan": [
    {
      "time": "9:00 AM",
      "end_time": "10:30 AM",
      "task": "Task title",
      "priority": "high",
      "duration": "1h 30m"
    }
  ],
  "total_focus_time": "4h 30m",
  "message": "Motivational message about today's plan"
}`

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Taskora',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 1024,
      }),
    })

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      const match = content.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : { plan: [], message: 'Could not generate plan' }
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Planner error:', error)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
