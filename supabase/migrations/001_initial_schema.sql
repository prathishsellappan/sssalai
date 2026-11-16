-- ====================================================================
-- Migration: 001_initial_schema.sql
-- Description: Core tables, enums, triggers, and indices for School Study Portal
-- ====================================================================

-- 1. App Roles & Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');

-- 2. Profiles Table
-- Linked 1-to-1 with auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    role public.app_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    must_change_password BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index on role & active status
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);

-- 3. Classes Table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_classes_active_order ON public.classes(is_active, display_order);

-- 4. Subjects Table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subjects_active ON public.subjects(is_active);

-- 5. Class Subjects Mapping Table
CREATE TABLE public.class_subjects (
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, subject_id)
);

CREATE INDEX idx_class_subjects_subject ON public.class_subjects(subject_id);

-- 6. Materials Table
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT UNIQUE NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.content_status DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_materials_class_subject FOREIGN KEY (class_id, subject_id)
        REFERENCES public.class_subjects(class_id, subject_id) ON DELETE RESTRICT,
    CONSTRAINT check_material_file_size CHECK (file_size <= 20971520), -- 20MB max
    CONSTRAINT check_material_mime_type CHECK (
        mime_type IN (
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        )
    )
);

CREATE INDEX idx_materials_class_subject ON public.materials(class_id, subject_id);
CREATE INDEX idx_materials_status ON public.materials(status);
CREATE INDEX idx_materials_created_by ON public.materials(created_by);

-- 7. Google Forms Table
CREATE TABLE public.form_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    form_url TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.content_status DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_form_links_class_subject FOREIGN KEY (class_id, subject_id)
        REFERENCES public.class_subjects(class_id, subject_id) ON DELETE RESTRICT,
    CONSTRAINT check_google_form_url CHECK (
        form_url ~* '^https://(docs\.google\.com/forms/|forms\.gle/)'
    )
);

CREATE INDEX idx_form_links_class_subject ON public.form_links(class_id, subject_id);
CREATE INDEX idx_form_links_status ON public.form_links(status);
CREATE INDEX idx_form_links_created_by ON public.form_links(created_by);

-- 8. Site Settings Table (Singleton)
CREATE TABLE public.site_settings (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    student_access_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    announcement TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_id);

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_materials
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_form_links
BEFORE UPDATE ON public.form_links
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_timestamp_site_settings
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
