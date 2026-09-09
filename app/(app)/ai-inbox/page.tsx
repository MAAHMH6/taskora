'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AIExtractedTask, AIExtractionResult } from '@/lib/types'
import { format, addDays, parseISO } from 'date-fns'
import {
  Sparkles, Mic, MicOff, FileText, Upload, Send, Check, X,
  ChevronDown, ChevronUp, AlertCircle, Loader2, Volume2,
  FolderKanban, Calendar, Tag, Flag, Plus, Trash2, CheckCircle2
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type CaptureTab = 'text' | 'voice' | 'file'

export default function AIInboxPage() {
  const [activeTab, setActiveTab] = useState<CaptureTab>('text')
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [extraction, setExtraction] = useState<AIExtractionResult | null>(null)
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [error, setError] = useState('')

  // Voice
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [recordingError, setRecordingError] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const router = useRouter()
  const supabase = createClient()

  // Voice recording
  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setRecordingError('Voice input is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let fullTranscript = ''
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript
      }
      setTranscript(fullTranscript)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setRecordingError(`Recording error: ${event.error}`)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
    setRecordingError('')
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
    if (transcript) {
      setInputText(transcript)
    }
  }

  const processText = async () => {
    const text = inputText.trim() || transcript.trim()
    if (!text) {
      setError('Please enter or speak some text first.')
      return
    }

    setIsProcessing(true)
    setError('')
    setExtraction(null)

    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, captureType: activeTab }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        setError(data.error || 'Failed to process text')
        return
      }

      setExtraction(data.extraction)
      // Select all tasks by default
      setSelectedTasks(new Set(data.extraction.tasks.map((_: AIExtractedTask, i: number) => i)))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleTaskSelection = (index: number) => {
    setSelectedTasks(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const saveTasks = async () => {
    if (!extraction || selectedTasks.size === 0) return
    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tasksToSave = extraction.tasks.filter((_, i) => selectedTasks.has(i))
    let saved = 0

    for (const task of tasksToSave) {
      // Find or create project
      let projectId: string | null = null
      if (task.project) {
        const { data: existing } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', user.id)
          .ilike('name', task.project)
          .single()

        if (existing) {
          projectId = existing.id
        } else {
          const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']
          const icons = ['📁', '🚀', '💼', '🎯', '⚡', '🔧']
          const idx = Math.floor(Math.random() * colors.length)
          const { data: newProject } = await supabase.from('projects').insert({
            user_id: user.id,
            name: task.project,
            color: colors[idx],
            icon: icons[idx],
          }).select('id').single()
          if (newProject) projectId = newProject.id
        }
      }

      // Create the task
      const { data: newTask } = await supabase.from('tasks').insert({
        user_id: user.id,
        project_id: projectId,
        title: task.title,
        priority: task.priority,
        due_date: task.due_date || null,
        due_time: task.due_time || null,
        notes: task.notes || null,
        ai_generated: true,
        status: 'pending',
      }).select('id').single()

      if (newTask && task.subtasks?.length) {
        await supabase.from('subtasks').insert(
          task.subtasks.map((st, idx) => ({
            task_id: newTask.id,
            user_id: user.id,
            title: st,
            sort_order: idx,
          }))
        )
      }

      saved++
    }

    // Save notes
    const notesToSave = extraction.notes || []
    for (const noteContent of notesToSave) {
      await supabase.from('notes').insert({
        user_id: user.id,
        content: noteContent,
        note_type: 'note',
      })
    }

    setSavedCount(saved)
    setIsSaving(false)
    setExtraction(null)
    setInputText('')
    setTranscript('')
    setTimeout(() => router.push('/tasks'), 1500)
  }

  const getRelativeDateLabel = (dateStr: string | undefined) => {
    if (!dateStr) return null
    try {
      const date = parseISO(dateStr)
      const today = new Date()
      const tomorrow = addDays(today, 1)
      if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) return 'Today'
      if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) return 'Tomorrow'
      return format(date, 'MMM d')
    } catch { return dateStr }
  }

  const priorityDot: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={18} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>AI Inbox</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Just speak or type — Taskora will organize it into real tasks
            </p>
          </div>
        </div>
      </div>

      {/* Success state */}
      {savedCount > 0 && (
        <div className="animate-fade-in glass-card" style={{
          padding: '20px', marginBottom: '20px', textAlign: 'center',
          borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)'
        }}>
          <CheckCircle2 size={32} style={{ color: '#10b981', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
            ✅ {savedCount} task{savedCount > 1 ? 's' : ''} saved!
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Redirecting to your tasks...</p>
        </div>
      )}

      {/* Capture Area */}
      {!extraction && !savedCount && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
          {/* Tab selector */}
          <div className="tab-bar" style={{ marginBottom: '20px', width: 'fit-content' }}>
            {([
              { key: 'text', label: 'Text', icon: FileText },
              { key: 'voice', label: 'Voice', icon: Mic },
              { key: 'file', label: 'File', icon: Upload },
            ] as { key: CaptureTab; label: string; icon: React.ElementType }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                id={`ai-inbox-tab-${tab.key}`}
              >
                <tab.icon size={14} style={{ display: 'inline', marginRight: '5px' }} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Text tab */}
          {activeTab === 'text' && (
            <div>
              <textarea
                id="ai-inbox-text-input"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="textarea"
                style={{ minHeight: '140px', fontSize: '14px', lineHeight: '1.7' }}
                placeholder={`Just tell Taskora what you need to do, naturally...\n\nExample: "Tomorrow I need to finish the LevelHub curriculum and make 10 Instagram posts. Remind me about SmartReturns WhatsApp integration — that should be high priority because I need it done this week."`}
              />
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', borderRadius: '8px', marginTop: '10px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5', fontSize: '13px'
                }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  onClick={processText}
                  disabled={isProcessing || !inputText.trim()}
                  className="btn-primary"
                  id="ai-process-text-btn"
                  style={{ padding: '11px 24px', fontSize: '14px' }}
                >
                  {isProcessing ? (
                    <><Loader2 size={15} className="animate-spin" /> Processing...</>
                  ) : (
                    <><Sparkles size={15} /> Let AI Organize</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Voice tab */}
          {activeTab === 'voice' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  id="voice-record-btn"
                  style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: isRecording
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none', cursor: 'pointer', margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isRecording
                      ? '0 0 0 12px rgba(239,68,68,0.15), 0 0 0 24px rgba(239,68,68,0.08)'
                      : '0 0 0 12px rgba(59,130,246,0.15)',
                    animation: isRecording ? 'recording-pulse 1s ease infinite' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isRecording ? <MicOff size={28} color="white" /> : <Mic size={28} color="white" />}
                </button>
              </div>

              <p style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '8px' }}>
                {isRecording ? '🔴 Recording... Speak naturally' : '🎤 Press to start recording'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 20px' }}>
                {isRecording
                  ? 'Taskora is listening. Talk about everything you need to do.'
                  : 'Speak your thoughts. AI will extract tasks, projects, priorities, and dates.'}
              </p>

              {recordingError && (
                <div style={{
                  padding: '10px 16px', borderRadius: '8px', marginBottom: '16px',
                  background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: '13px'
                }}>
                  {recordingError}
                </div>
              )}

              {transcript && (
                <div style={{
                  background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
                  borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Volume2 size={13} style={{ color: 'var(--accent-blue-light)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-blue-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Transcription
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{transcript}</p>
                </div>
              )}

              {transcript && !isRecording && (
                <button
                  onClick={processText}
                  disabled={isProcessing}
                  className="btn-primary"
                  id="process-voice-btn"
                  style={{ padding: '11px 28px', fontSize: '14px' }}
                >
                  {isProcessing ? (
                    <><Loader2 size={15} className="animate-spin" /> Processing...</>
                  ) : (
                    <><Sparkles size={15} /> AI Organize This</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* File tab */}
          {activeTab === 'file' && (
            <div style={{
              border: '2px dashed rgba(59,130,246,0.25)', borderRadius: '12px',
              padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}>
              <Upload size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: 'white', marginBottom: '6px' }}>
                Drop a file or click to browse
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Supports .txt, .pdf, .docx — AI will extract tasks from the content
              </p>
              <button className="btn-secondary" style={{ marginTop: '16px' }}>
                <Upload size={14} /> Browse Files
              </button>
            </div>
          )}
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="glass-card animate-fade-in" style={{ padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
          }}>
            <Sparkles size={22} style={{ color: '#a78bfa' }} className="animate-spin" />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
            AI is analyzing your text...
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Extracting tasks, projects, priorities, and dates
          </p>
        </div>
      )}

      {/* Review Modal */}
      {extraction && !savedCount && (
        <div className="animate-fade-in">
          {/* Header banner */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderRadius: '12px', marginBottom: '16px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
            border: '1px solid rgba(139,92,246,0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} style={{ color: '#a78bfa' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>
                  ✨ AI Organized {extraction.tasks.length} task{extraction.tasks.length !== 1 ? 's' : ''}
                  {extraction.notes?.length ? ` + ${extraction.notes.length} note${extraction.notes.length !== 1 ? 's' : ''}` : ''}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{extraction.summary}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setExtraction(null)}
                className="btn-ghost"
                style={{ fontSize: '13px' }}
              >
                <X size={14} /> Redo
              </button>
              <button
                onClick={saveTasks}
                disabled={isSaving || selectedTasks.size === 0}
                className="btn-primary"
                id="save-ai-tasks-btn"
                style={{ fontSize: '13px' }}
              >
                {isSaving ? (
                  <><Loader2 size={13} className="animate-spin" /> Saving...</>
                ) : (
                  <><Check size={13} /> Add {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </div>

          {/* Task cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {extraction.tasks.map((task, index) => (
              <div
                key={index}
                className="glass-card"
                style={{
                  padding: '16px 20px',
                  borderColor: selectedTasks.has(index) ? 'rgba(59,130,246,0.3)' : 'var(--border)',
                  background: selectedTasks.has(index) ? 'rgba(59,130,246,0.05)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => toggleTaskSelection(index)}
                id={`extracted-task-${index}`}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* Checkbox */}
                  <div className={`task-checkbox ${selectedTasks.has(index) ? 'checked' : ''}`} style={{ marginTop: '2px', flexShrink: 0 }}>
                    {selectedTasks.has(index) && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{task.title}</span>
                      <span className={`badge-${task.priority}`}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: priorityDot[task.priority], display: 'inline-block' }} />
                        {task.priority}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      {task.project && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <FolderKanban size={12} style={{ color: 'var(--accent-blue-light)' }} />
                          {task.project}
                        </span>
                      )}
                      {task.due_date && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <Calendar size={12} style={{ color: 'var(--accent-green)' }} />
                          {getRelativeDateLabel(task.due_date)}
                        </span>
                      )}
                      {task.tags?.map(tag => (
                        <span key={tag} style={{
                          display: 'flex', alignItems: 'center', gap: '3px',
                          fontSize: '11px', color: 'var(--text-muted)',
                          background: 'rgba(59,130,246,0.08)', padding: '2px 8px', borderRadius: '6px'
                        }}>
                          <Tag size={10} /> {tag}
                        </span>
                      ))}
                    </div>

                    {task.subtasks && task.subtasks.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {task.subtasks.map((st, si) => (
                          <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(59,130,246,0.5)', flexShrink: 0 }} />
                            {st}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes section */}
          {extraction.notes && extraction.notes.length > 0 && (
            <div className="glass-card" style={{ padding: '16px 20px', marginTop: '12px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                📝 Notes (saved automatically)
              </p>
              {extraction.notes.map((note, i) => (
                <p key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '6px' }}>
                  • {note}
                </p>
              ))}
            </div>
          )}

          {/* Bottom action bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderRadius: '12px', marginTop: '12px',
            background: 'rgba(10,20,45,0.8)', border: '1px solid var(--border)'
          }}>
            <button
              onClick={() => {
                if (selectedTasks.size === extraction.tasks.length) {
                  setSelectedTasks(new Set())
                } else {
                  setSelectedTasks(new Set(extraction.tasks.map((_, i) => i)))
                }
              }}
              className="btn-ghost"
              style={{ fontSize: '13px' }}
            >
              {selectedTasks.size === extraction.tasks.length ? 'Deselect all' : 'Select all'}
            </button>
            <button
              onClick={saveTasks}
              disabled={isSaving || selectedTasks.size === 0}
              className="btn-primary"
              style={{ fontSize: '14px', padding: '11px 28px' }}
            >
              {isSaving ? (
                <><Loader2 size={15} className="animate-spin" /> Saving...</>
              ) : (
                <><Check size={15} /> Add {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''} to Taskora</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
