'use client'

import { useState } from 'react'
import { Settings, User, Bell, Palette, Shield, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ]
  const [activeSection, setActiveSection] = useState('profile')

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage your account and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '16px' }}>
        {/* Sidebar */}
        <div className="glass-card" style={{ padding: '8px', height: 'fit-content' }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`sidebar-link ${activeSection === s.id ? 'active' : ''}`}
              style={{ borderRadius: '8px', marginBottom: '2px' }}
              id={`settings-${s.id}`}
            >
              <s.icon size={15} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card" style={{ padding: '24px' }}>
          {activeSection === 'profile' && (
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Profile Settings</h2>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Full Name
                </label>
                <input
                  id="settings-full-name"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Mohammed Shams"
                  className="input"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={saving} className="btn-primary" id="save-profile-btn">
                  {saved ? <><Check size={14} /> Saved!</> : saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeSection === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Notification Preferences</h2>
              {[
                { label: 'Task reminders', sub: 'Get notified before task deadlines' },
                { label: 'AI suggestions', sub: 'Receive AI-powered task improvement tips' },
                { label: 'Daily planner', sub: 'Morning summary of your daily plan' },
                { label: 'Share activity', sub: 'When someone views or edits your shared items' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '10px', background: 'rgba(59,130,246,0.04)', border: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'white', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.sub}</p>
                  </div>
                  <div style={{
                    width: '40px', height: '22px', borderRadius: '11px',
                    background: i < 2 ? '#3b82f6' : 'rgba(59,130,246,0.2)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.2s'
                  }}>
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: i < 2 ? 'calc(100% - 18px)' : '3px',
                      width: '14px', height: '14px', borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'appearance' && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Appearance</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Taskora uses a premium dark theme by default. More themes coming soon.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { label: 'Dark (Default)', active: true, colors: ['#050d1a', '#3b82f6', '#8b5cf6'] },
                  { label: 'Midnight Blue', active: false, colors: ['#0a0f1e', '#2563eb', '#7c3aed'] },
                ].map(theme => (
                  <div key={theme.label} style={{
                    padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                    border: `1px solid ${theme.active ? 'rgba(59,130,246,0.5)' : 'var(--border)'}`,
                    background: theme.active ? 'rgba(59,130,246,0.08)' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                      {theme.colors.map(c => (
                        <div key={c} style={{ width: '16px', height: '16px', borderRadius: '50%', background: c }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '12px', color: theme.active ? 'var(--accent-blue-light)' : 'var(--text-secondary)', fontWeight: 500 }}>{theme.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '16px' }}>Security</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(59,130,246,0.04)', border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: 'white', marginBottom: '4px' }}>Change Password</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Update your account password</p>
                  <button className="btn-secondary" style={{ fontSize: '13px' }}>Change Password</button>
                </div>
                <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#fca5a5', marginBottom: '4px' }}>Delete Account</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Permanently delete your account and all data</p>
                  <button className="btn-danger" style={{ fontSize: '13px' }}>Delete Account</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
