'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, CheckSquare, FolderKanban, FileText, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ResultType = 'task' | 'project' | 'note'
interface SearchResult {
  id: string
  title: string
  type: ResultType
  sub?: string
  href: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const supabase = createClient()

  const doSearch = async (q: string) => {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setSearching(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: tasks }, { data: projects }, { data: notes }] = await Promise.all([
      supabase.from('tasks').select('id, title, status, priority').eq('user_id', user.id).ilike('title', `%${q}%`).limit(10),
      supabase.from('projects').select('id, name, icon').eq('user_id', user.id).ilike('name', `%${q}%`).limit(5),
      supabase.from('notes').select('id, title, content').eq('user_id', user.id).or(`title.ilike.%${q}%,content.ilike.%${q}%`).limit(5),
    ])

    const combined: SearchResult[] = [
      ...(tasks || []).map(t => ({ id: t.id, title: t.title, type: 'task' as ResultType, sub: `${t.priority} · ${t.status}`, href: `/tasks/${t.id}` })),
      ...(projects || []).map(p => ({ id: p.id, title: `${p.icon} ${p.name}`, type: 'project' as ResultType, href: `/projects/${p.id}` })),
      ...(notes || []).map(n => ({ id: n.id, title: n.title || n.content.slice(0, 50), type: 'note' as ResultType, href: '/notes' })),
    ]

    setResults(combined)
    setSearching(false)
  }

  const icons = { task: CheckSquare, project: FolderKanban, note: FileText }
  const colors = { task: '#3b82f6', project: '#8b5cf6', note: '#f59e0b' }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '20px' }}>Search</h1>

      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          id="global-search-input"
          type="text"
          value={query}
          onChange={e => doSearch(e.target.value)}
          placeholder="Search tasks, projects, notes..."
          className="input"
          autoFocus
          style={{ paddingLeft: '44px', paddingRight: searching ? '44px' : '14px', fontSize: '15px', height: '48px' }}
        />
        {searching && <Loader2 size={16} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', animation: 'spin 0.8s linear infinite' }} />}
      </div>

      {query && results.length === 0 && !searching && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <Search size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No results found for &quot;{query}&quot;</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {results.map((r, i) => {
            const Icon = icons[r.type]
            const color = colors[r.type]
            return (
              <Link key={r.id} href={r.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 20px',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(59,130,246,0.06)' : 'none',
                  cursor: 'pointer', transition: 'background 0.15s'
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: `${color}15`, border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13.5px', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.title}
                    </p>
                    {r.sub && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{r.sub}</p>}
                  </div>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: `${color}15`, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {r.type}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {!query && (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Search across all your tasks, projects, notes, and files
          </p>
        </div>
      )}
    </div>
  )
}
