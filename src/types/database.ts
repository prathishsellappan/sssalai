export type AppRole = 'admin' | 'teacher' | 'student';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: AppRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export interface AcademicClass {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface ClassSubjectMapping {
  class_id: string;
  subject_id: string;
  classes?: AcademicClass;
  subjects?: Subject;
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  class_id: string;
  subject_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_by: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  classes?: AcademicClass;
  subjects?: Subject;
  profiles?: {
    display_name: string;
    email: string;
  };
}

export interface FormLink {
  id: string;
  title: string;
  description: string | null;
  class_id: string;
  subject_id: string;
  form_url: string;
  created_by: string;
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  classes?: AcademicClass;
  subjects?: Subject;
  profiles?: {
    display_name: string;
    email: string;
  };
}

export interface SiteSettings {
  id: number;
  student_access_enabled: boolean;
  announcement: string | null;
  updated_by: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  profiles?: {
    email: string;
    display_name: string;
    role: AppRole;
  };
}
