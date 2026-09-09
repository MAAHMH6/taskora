'use client'

import { useState } from 'react'
import { Share2, Link2, Copy, Check, ExternalLink, Trash2, Eye, Edit3, MessageSquare, CheckSquare, Plus } from 'lucide-react'
import { Share } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'

interface SharedClientProps {
  shares: (Share & {
    task?: { id: string; title: string; status: string; priority: string } | null
    project?: { id: string; name: string; icon: string } | null
  })[]
}

export default function SharedClient({ shares: initialShares }: SharedClientProps) {
  const [shares, setShares] = useState(initialShares)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const supabase = createClient()

  const copyLink = async (token: string, shareId: string) => {
    const url = `${window.location.origin}/share/${token}`
    await navigator.clipboard.writeText(url)
    setCopiedId(shareId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const deactivateShare = async (shareId: string) => {
    if (!confirm('Deactivate this share link?')) return
    setShares(prev => prev.filter(s => s.id !== shareId))
    await supabase.from('shares').update({ is_active: false }).eq('id', shareId)
  }

  const permissionIcons = {
    view: { icon: Eye, label: 'View only' },
    complete: { icon: CheckSquare, label: 'Can complete' },
    comment: { icon: MessageSquare, label: 'Can comment' },
    edit: { icon: Edit3, label: 'Can edit' },
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Shared</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Share tasks and projects with anyone — no account required to view
        </p>
      </div>

      {/* How it works */}
      <div className="glass-card" style={{
        padding: '16px 20px', marginBottom: '20px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
        borderColor: 'rgba(139,92,246,0.2)'
      }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          <strong style={{ color: 'white' }}>How sharing works:</strong> Open any task or project → click the Share button → copy the link → send it anywhere.
          Recipients can view (and optionally complete/comment/edit) without creating an account.
        </p>
      </div>

      {shares.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <Share2 size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            No shared links yet
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Open a task or project and click Share to get started
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {shares.map(share => {
            const PermIcon = permissionIcons[share.default_permission]?.icon || Eye
            return (
              <div key={share.id} className="glass-card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Share2 size={14} style={{ color: 'var(--accent-blue-light)', flexShrink: 0 }} />
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {share.task?.title || share.project?.name || 'Shared item'}
                      </span>
                      <span style={{
                        fontSize: '10px', padding: '2px 7px', borderRadius: '6px', flexShrink: 0,
                        background: share.task ? 'rgba(59,130,246,0.15)' : 'rgba(139,92,246,0.15)',
                        color: share.task ? '#93c5fd' : '#c4b5fd',
                        border: `1px solid ${share.task ? 'rgba(59,130,246,0.25)' : 'rgba(139,92,246,0.25)'}`,
                      }}>
                        {share.task ? 'Task' : 'Project'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <PermIcon size={11} />
                        {permissionIcons[share.default_permission]?.label}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Created {format(parseISO(share.created_at), 'MMM d, yyyy')}
                      </span>
                      <span style={{
                        fontSize: '10px', padding: '2px 7px', borderRadius: '6px',
                        background: share.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: share.is_active ? '#6ee7b7' : '#fca5a5',
                        border: `1px solid ${share.is_active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      }}>
                        {share.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={() => copyLink(share.token, share.id)}
                      className="btn-secondary"
                      style={{ padding: '7px 12px', fontSize: '12px' }}
                      id={`copy-link-${share.id}`}
                    >
                      {copiedId === share.id ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Link</>}
                    </button>
                    <a href={`/share/${share.token}`} target="_blank" rel="noopener noreferrer">
                      <button className="btn-ghost" style={{ padding: '7px 10px' }} title="Open share link">
                        <ExternalLink size={14} />
                      </button>
                    </a>
                    <button
                      onClick={() => deactivateShare(share.id)}
                      className="btn-ghost"
                      style={{ padding: '7px 10px', color: 'rgba(239,68,68,0.6)' }}
                      title="Deactivate share"
                      id={`deactivate-${share.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
