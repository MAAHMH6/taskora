import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Taskora — AI-Powered Task Manager',
  description: 'Tell Taskora what you need to do. Taskora organizes it. AI-first task management for modern teams.',
  keywords: 'task manager, AI tasks, productivity, project management, focus timer',
  openGraph: {
    title: 'Taskora — AI-Powered Task Manager',
    description: 'Tell Taskora what you need to do. Taskora organizes it.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="gradient-bg">{children}</body>
    </html>
  )
}
