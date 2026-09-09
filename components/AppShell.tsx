'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu, Bell, Search, Sun } from 'lucide-react'
import Link from 'next/link'

interface AppShellProps {
  children: React.ReactNode
  userName: string
  userEmail: string
}

export default function AppShell({ children, userName, userEmail }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content */}
      <div style={{
        marginLeft: '220px',
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} className="main-content">
        {/* Top Header */}
        <header style={{
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(5, 13, 26, 0.9)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn-ghost"
              style={{ padding: '6px', display: 'none' }}
              id="mobile-menu-btn"
            >
              <Menu size={18} />
            </button>

            {/* Search bar */}
            <Link href="/search" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(10, 20, 45, 0.8)',
                border: '1px solid var(--border)',
                borderRadius: '10px', padding: '7px 16px',
                cursor: 'pointer', transition: 'border-color 0.2s',
                minWidth: '280px'
              }}>
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Search tasks, projects, notes...
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)',
                  background: 'rgba(59,130,246,0.1)', border: '1px solid var(--border)',
                  padding: '1px 6px', borderRadius: '4px'
                }}>⌘K</span>
              </div>
            </Link>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn-ghost" style={{ padding: '8px', position: 'relative' }} id="notifications-btn">
              <Bell size={17} />
              <span style={{
                position: 'absolute', top: '6px', right: '6px',
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#ef4444', border: '1px solid var(--bg-primary)'
              }} />
            </button>
            <button className="btn-ghost" style={{ padding: '8px' }} id="theme-btn">
              <Sun size={17} />
            </button>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'white', cursor: 'pointer',
              flexShrink: 0
            }}>
              {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .main-content { margin-left: 0 !important; }
          #mobile-menu-btn { display: flex !important; }
          #sidebar-close { display: flex !important; }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  )
}
