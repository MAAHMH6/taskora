'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Sparkles, CheckSquare, FolderKanban, Calendar,
  FileText, Files, Share2, Search, Target, BarChart2, Settings,
  LogOut, CheckCircle2, X, Menu
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ai-inbox', label: 'AI Inbox', icon: Sparkles, badge: 'AI' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/files', label: 'Files', icon: Files },
  { href: '/shared', label: 'Shared', icon: Share2 },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/focus', label: 'Focus', icon: Target },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  userName?: string
  userEmail?: string
}

export default function Sidebar({ open, onClose, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 49,
            display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      <aside
        className={`sidebar ${open ? 'open' : ''}`}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px 20px', borderBottom: '1px solid var(--border)'
        }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <CheckCircle2 size={18} color="white" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'white' }}>Taskora</span>
          </Link>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '4px', display: 'none' }}
            id="sidebar-close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', paddingTop: '8px', paddingBottom: '8px' }}>
          <div className="section-label" style={{ marginTop: '8px' }}>Main</div>

          {navItems.slice(0, 2).map(item => (
            <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href + '/')} onClose={onClose} />
          ))}

          <div className="section-label" style={{ marginTop: '12px' }}>Workspace</div>

          {navItems.slice(2, 8).map(item => (
            <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href + '/')} onClose={onClose} />
          ))}

          <div className="section-label" style={{ marginTop: '12px' }}>Tools</div>

          {navItems.slice(8).map(item => (
            <NavLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(item.href + '/')} onClose={onClose} />
          ))}
        </nav>

        {/* AI Capture CTA */}
        <div style={{ padding: '12px 14px', margin: '0 10px 12px' }}>
          <Link
            href="/ai-inbox"
            style={{ textDecoration: 'none' }}
            onClick={onClose}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))',
              border: '1px solid rgba(139,92,246,0.25)',
              borderRadius: '12px', padding: '12px 14px', cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={14} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa' }}>Let AI organize</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Just type or speak — Taskora will turn it into real tasks.
              </p>
            </div>
          </Link>
        </div>

        {/* User profile */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userName || 'User'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </p>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="btn-ghost"
            style={{ padding: '6px', flexShrink: 0 }}
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  )
}

function NavLink({ item, active, onClose }: {
  item: typeof navItems[0], active: boolean, onClose: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`sidebar-link ${active ? 'active' : ''}`}
      style={{ textDecoration: 'none' }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && (
        <span style={{
          fontSize: '9px', fontWeight: 700, padding: '2px 6px',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))',
          border: '1px solid rgba(139,92,246,0.4)',
          borderRadius: '4px', color: '#c4b5fd', letterSpacing: '0.5px'
        }}>
          {item.badge}
        </span>
      )}
    </Link>
  )
}
