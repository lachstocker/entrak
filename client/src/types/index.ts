export interface Document {
  id: number;
  title: string;
  description?: string;
  file_path: string;
  file_type: 'pdf' | 'docx' | 'txt';
  upload_date: string;
  last_modified: string;
  version: number;
  user_id?: number;
  project_id?: number;
  project?: Project;
  extracted: boolean;
  extraction_date?: string;
}

export interface Obligation {
  id: number;
  document_id: number;
  text: string;
  responsible_party?: string;
  status: 'pending' | 'completed' | 'overdue';
  original_text?: string;
  clause_number?: string;
  section_name?: string;
  page_number?: number;
  is_recurring?: boolean;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'ongoing';
  recurrence_interval?: number;
  recurrence_day?: number;
  recurrence_month?: number;
  recurrence_custom_text?: string;
  created_at: string;
  last_modified: string;
  created_by?: number;
  modified_by?: number;
  document?: Document;
}

export interface Reminder {
  id: number;
  obligation_id: number;
  user_id: number;
  reminder_date: string;
  notification_method: 'email' | 'in-app' | 'both';
  message?: string;
  active: boolean;
  obligation?: Obligation;
}

export interface User {
  id: number;
  username: string;
  email: string;
  organization?: string;
  role: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  last_modified: string;
  user_id?: number;
  document_count?: number;
  obligation_count?: number;
}

export interface StatsData {
  totalDocuments: number;
  activeObligations: number;
  upcomingDeadlines: number;
  processingSuccess: number;
}

export interface ProcessingStep {
  id: string;
  name: string;
  status: 'completed' | 'processing' | 'pending';
  progress: number;
}

export interface FileUploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  processingSteps: ProcessingStep[];
}

export interface FilterState {
  status: string;
  type?: string;
  responsibleParty?: string;
  documentId?: number;
  projectId?: number;
  isRecurring?: boolean;
  dueDateStart?: string;
  dueDateEnd?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  obligationId: number;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  includeCompleted: boolean;
  dateRange: {
    start?: Date;
    end?: Date;
  };
}

export interface ResponsiblePartyWithInitials {
  name: string;
  initials: string;
  color?: string;
}
