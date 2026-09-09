'use client'

import { useState } from 'react'
import { FileText, Plus, Lightbulb, BookOpen, ArrowRight, Trash2, X, Loader2 } from 'lucide-react'
import { Note, Project } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'
import CreateTaskModal from '@/components/CreateTaskModal'

interface NotesClientProps {
  notes: (Note & { project?: { name: string; color: string; icon: string } | null })[]
  projects: Project[]
}

const NOTE_ICONS = { note: FileText, idea: Lightbulb, reference: BookOpen }
const NOTE_COLORS = { note: '#3b82f6', idea: '#f59e0b', reference: '#8b5cf6' }

export default function NotesClient({ notes: initialNotes, projects }: NotesClientProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [showCreate, setShowCreate] = useState(false)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [noteType, setNoteType] = useState<Note['note_type']>('note')
  const [projectId, setProjectId] = useState('')
  const [creating, setCreating] = useState(false)
  const [convertNote, setConvertNote] = useState<Note | null>(null)
  const supabase = createClient()

  const createNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: note } = await supabase.from('notes').insert({
      user_id: user.id,
      title: title.trim() || null,
      content: content.trim(),
      note_type: noteType,
      project_id: projectId || null,
    }).select('*, project:projects(name, color, icon)').single()

    if (note) setNotes(prev => [note, ...prev])
    setContent('')
    setTitle('')
    setShowCreate(false)
    setCreating(false)
  }

  const deleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return
    setNotes(prev => prev.filter(n => n.id !== noteId))
    await supabase.from('notes').delete().eq('id', noteId)
  }

  const typeFilters = ['all', 'note', 'idea', 'reference']
  const [typeFilter, setTypeFilter] = useState('all')
  const filtered = notes.filter(n => typeFilter === 'all' || n.note_type === typeFilter)

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Notes</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Capture ideas without turning them into tasks immediately
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} id="new-note-btn" style={{ fontSize: '13px' }}>
          <Plus size={14} /> New Note
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div className="tab-bar">
          {typeFilters.map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} className={`tab-btn ${typeFilter === f ? 'active' : ''}`}>
              {f === 'all' ? `All (${notes.length})` :
               f === 'idea' ? `💡 Ideas (${notes.filter(n => n.note_type === 'idea').length})` :
               f === 'reference' ? `📚 References (${notes.filter(n => n.note_type === 'reference').length})` :
               `📝 Notes (${notes.filter(n => n.note_type === 'note').length})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>No notes yet</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Capture ideas, references, and thoughts here
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: '13px' }}>
            <Plus size={14} /> Write Your First Note
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtered.map(note => {
            const Icon = NOTE_ICONS[note.note_type]
            const color = NOTE_COLORS[note.note_type]
            return (
              <div key={note.id} className="glass-card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '7px',
                      background: `${color}20`, border: `1px solid ${color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, color }}>
                      {note.note_type}
                    </span>
                  </div>
                  <button onClick={() => deleteNote(note.id)} className="btn-ghost" style={{ padding: '3px', opacity: 0.5 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {note.title && (
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>{note.title}</h3>
                )}
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px',
                  display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {note.content}
                </p>
                {note.project && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                    {(note.project as { icon: string; name: string }).icon} {(note.project as { icon: string; name: string }).name}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {format(parseISO(note.updated_at), 'MMM d, h:mm a')}
                  </span>
                  <button
                    onClick={() => setConvertNote(note)}
                    className="btn-ghost"
                    style={{ fontSize: '11px', padding: '4px 8px', color: 'var(--accent-blue-light)' }}
                    id={`convert-note-${note.id}`}
                  >
                    <ArrowRight size={12} /> Convert to Task
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Note Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal animate-fade-in" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>New Note</h2>
              <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ padding: '6px' }}><X size={18} /></button>
            </div>
            <form onSubmit={createNote} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="tab-bar" style={{ width: 'fit-content' }}>
                {(['note','idea','reference'] as Note['note_type'][]).map(t => (
                  <button key={t} type="button" onClick={() => setNoteType(t)} className={`tab-btn ${noteType === t ? 'active' : ''}`}>
                    {t === 'note' ? '📝 Note' : t === 'idea' ? '💡 Idea' : '📚 Reference'}
                  </button>
                ))}
              </div>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)" className="input" style={{ fontSize: '15px', fontWeight: 500 }} />
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your thoughts..." className="textarea" style={{ minHeight: '120px', fontSize: '14px' }} autoFocus />
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input" style={{ fontSize: '13px' }}>
                <option value="">No project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.icon} {p.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={creating || !content.trim()} className="btn-primary">
                  {creating ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert to Task */}
      {convertNote && (
        <CreateTaskModal
          projects={projects}
          onClose={() => setConvertNote(null)}
          onCreated={async (task) => {
            await supabase.from('notes').update({ converted_to_task_id: task.id }).eq('id', convertNote.id)
            setConvertNote(null)
          }}
        />
      )}
    </div>
  )
}
