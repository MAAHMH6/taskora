export default function FilesPage() {
  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', marginBottom: '4px' }}>Files</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Attachments from your tasks and projects</p>
      </div>
      <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📎</div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>File Manager</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
          All file attachments from your tasks will appear here. Upload files from within any task detail view.
        </p>
      </div>
    </div>
  )
}
