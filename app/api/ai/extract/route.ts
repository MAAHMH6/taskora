import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'meta-llama/llama-3.1-8b-instruct:free'

const EXTRACTION_PROMPT = `You are Taskora's AI assistant. Your job is to extract structured tasks from natural language input.

Extract all tasks, group them by project if mentioned, detect priorities and due dates.

Return ONLY valid JSON in this exact format:
{
  "tasks": [
    {
      "title": "Task title (clear and actionable)",
      "project": "Project name or null",
      "priority": "high" | "medium" | "low",
      "due_date": "YYYY-MM-DD or null",
      "due_time": "HH:MM or null",
      "tags": ["tag1", "tag2"],
      "reminder": "reminder note or null",
      "subtasks": ["subtask1", "subtask2"],
      "notes": "additional context or null"
    }
  ],
  "notes": ["any non-task information to save as notes"],
  "summary": "Brief summary of what was extracted"
}

Priority rules:
- "urgent", "ASAP", "high priority", "critical", "important" → high
- "should", "need to", "finish" + deadline → medium  
- "maybe", "eventually", "when possible" → low
- Default is medium

Date rules (today = ${new Date().toISOString().split('T')[0]}):
- "today" → today's date
- "tomorrow" → tomorrow's date
- "this week" → end of current week
- "next week" → start of next week
- specific dates → convert to YYYY-MM-DD

Return ONLY the JSON object, no markdown, no explanation.`

export async function POST(req: NextRequest) {
  try {
    const { text, captureType = 'text' } = await req.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Taskora AI Task Manager',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenRouter error:', errorData)
      return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 502 })
    }

    // Parse JSON from AI response
    let extracted
    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      extracted = JSON.parse(cleaned)
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content)
      // Attempt to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          extracted = JSON.parse(jsonMatch[0])
        } catch {
          return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 })
        }
      } else {
        return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 })
      }
    }

    return NextResponse.json({
      success: true,
      extraction: extracted,
      captureType,
      rawText: text,
    })

  } catch (error) {
    console.error('AI extract error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
