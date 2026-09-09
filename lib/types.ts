// ─── Types ────────────────────────────────────────────────────────────────────

export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type ProjectStatus = 'active' | 'archived' | 'completed'
export type NoteType = 'note' | 'idea' | 'reference'
export type CaptureType = 'text' | 'voice' | 'file' | 'image'
export type SharePermission = 'view' | 'complete' | 'comment' | 'edit'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  icon: string
  status: ProjectStatus
  progress: number
  due_date: string | null
  created_at: string
  updated_at: string
  tasks?: Task[]
}

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  due_date: string | null
  due_time: string | null
  completed_at: string | null
  assignee_id: string | null
  recurrence_rule: string | null
  estimated_minutes: number | null
  actual_minutes: number | null
  sort_order: number
  ai_generated: boolean
  ai_suggestion: string | null
  created_at: string
  updated_at: string
  project?: Project
  subtasks?: Subtask[]
  tags?: Tag[]
  comments?: Comment[]
}

export interface Subtask {
  id: string
  task_id: string
  user_id: string
  title: string
  completed: boolean
  sort_order: number
  created_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  project_id: string | null
  title: string | null
  content: string
  note_type: NoteType
  converted_to_task_id: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  user_id: string
  task_id: string
  content: string
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface Share {
  id: string
  user_id: string
  task_id: string | null
  project_id: string | null
  token: string
  default_permission: SharePermission
  is_active: boolean
  expires_at: string | null
  created_at: string
}

export interface FocusSession {
  id: string
  user_id: string
  task_id: string | null
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  session_type: 'focus' | 'break'
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string | null
  type: 'info' | 'reminder' | 'mention' | 'share' | 'ai'
  read: boolean
  action_url: string | null
  created_at: string
}

// AI Extraction types
export interface AIExtractedTask {
  title: string
  project?: string
  priority: Priority
  due_date?: string
  due_time?: string
  tags?: string[]
  reminder?: string
  subtasks?: string[]
  notes?: string
}

export interface AIExtractionResult {
  tasks: AIExtractedTask[]
  notes: string[]
  summary: string
}

// Dashboard stats
export interface DashboardStats {
  todayTotal: number
  todayCompleted: number
  overdue: number
  weekCompleted: number
  completionRate: number
  focusMinutes: number
}
