'use client'

import { useState, useEffect, useRef } from 'react'
import { Target, Play, Pause, RotateCcw, Coffee, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const FOCUS_DURATION = 25 * 60 // 25 minutes
const SHORT_BREAK = 5 * 60
const LONG_BREAK = 15 * 60

export default function FocusPage() {
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus')
  const [completedSessions, setCompletedSessions] = useState(0)
  const [sessionStart, setSessionStart] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const supabase = createClient()

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            handleSessionEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  const handleSessionEnd = async () => {
    if (sessionType === 'focus' && sessionStart) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('focus_sessions').insert({
          user_id: user.id,
          started_at: sessionStart.toISOString(),
          ended_at: new Date().toISOString(),
          duration_minutes: 25,
          session_type: 'focus',
        })
      }
      setCompletedSessions(prev => prev + 1)
    }
  }

  const start = () => {
    setIsRunning(true)
    if (!sessionStart) setSessionStart(new Date())
  }

  const pause = () => setIsRunning(false)

  const reset = (type: 'focus' | 'break' = 'focus', duration = FOCUS_DURATION) => {
    setIsRunning(false)
    setSessionType(type)
    setTimeLeft(duration)
    setSessionStart(null)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = sessionType === 'focus'
    ? ((FOCUS_DURATION - timeLeft) / FOCUS_DURATION) * 100
    : ((SHORT_BREAK - timeLeft) / SHORT_BREAK) * 100

  const circumference = 2 * Math.PI * 100
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Focus Timer</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pomodoro technique — 25 min focus, 5 min break</p>
      </div>

      {/* Session type buttons */}
      <div className="tab-bar" style={{ width: 'fit-content', margin: '0 auto 32px' }}>
        <button onClick={() => reset('focus', FOCUS_DURATION)} className={`tab-btn ${sessionType === 'focus' ? 'active' : ''}`} id="focus-mode-btn">
          🎯 Focus (25m)
        </button>
        <button onClick={() => reset('break', SHORT_BREAK)} className={`tab-btn ${sessionType === 'break' ? 'active' : ''}`} id="short-break-btn">
          ☕ Short Break (5m)
        </button>
        <button onClick={() => reset('break', LONG_BREAK)} className={`tab-btn`} id="long-break-btn">
          😴 Long Break (15m)
        </button>
      </div>

      {/* Timer circle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', width: '240px', height: '240px' }}>
          <svg width="240" height="240" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="120" cy="120" r="100" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="8" />
            <circle
              cx="120" cy="120" r="100" fill="none"
              stroke={sessionType === 'focus' ? 'url(#timer-gradient)' : '#10b981'}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
            <defs>
              <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '52px', fontWeight: 800, color: 'white', letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums' }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {sessionType === 'focus' ? 'Focus time' : 'Break time'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => reset()}
          className="btn-secondary"
          style={{ padding: '12px 20px' }}
          id="reset-timer-btn"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={isRunning ? pause : start}
          className="btn-primary"
          style={{ padding: '12px 40px', fontSize: '15px' }}
          id="start-pause-btn"
        >
          {isRunning ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {timeLeft === FOCUS_DURATION ? 'Start' : 'Resume'}</>}
        </button>
        <button
          onClick={() => reset('break', SHORT_BREAK)}
          className="btn-secondary"
          style={{ padding: '12px 20px' }}
          id="break-btn"
        >
          <Coffee size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '32px', justifyContent: 'center' }}>
          <div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>{completedSessions}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sessions today</p>
          </div>
          <div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>{completedSessions * 25}m</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Focus time</p>
          </div>
          <div>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'white' }}>{completedSessions * 5}m</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Break time</p>
          </div>
        </div>
      </div>
    </div>
  )
}
