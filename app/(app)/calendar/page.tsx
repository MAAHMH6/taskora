export default function CalendarPage() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Calendar</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>View your tasks and deadlines in calendar format</p>
      </div>
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>Calendar View</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          Full day/week/month/agenda views coming in the next update. Tasks with deadlines will appear here automatically.
        </p>
      </div>
    </div>
  )
}
