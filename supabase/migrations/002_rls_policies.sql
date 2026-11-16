-- ====================================================================
-- Migration: 002_rls_policies.sql
-- Description: Row Level Security for all application tables
-- ====================================================================

-- Enable RLS on all exposed tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions to avoid recursive policy checks and cache results
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.app_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = TRUE;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher' AND is_active = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_active = TRUE
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.student_access_is_enabled()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT student_access_enabled FROM public.site_settings WHERE id = 1), TRUE);
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- --------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- --------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_admin());

-- Ordinary clients cannot modify profiles directly (role, status, email protected)
-- Only service role / Edge Functions or Admins
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 2. CLASSES POLICIES
-- --------------------------------------------------------------------
-- Active users can read active classes (or admin can read all classes)
CREATE POLICY "Active users can view active classes"
ON public.classes FOR SELECT
USING (
  public.is_admin() OR (public.is_active_user() AND is_active = TRUE)
);

-- Only Admin can insert, update, delete classes
CREATE POLICY "Admin can insert classes"
ON public.classes FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update classes"
ON public.classes FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete classes"
ON public.classes FOR DELETE
USING (public.is_admin());

-- --------------------------------------------------------------------
-- 3. SUBJECTS POLICIES
-- --------------------------------------------------------------------
-- Active users can view active subjects (or admin views all)
CREATE POLICY "Active users can view active subjects"
ON public.subjects FOR SELECT
USING (
  public.is_admin() OR (public.is_active_user() AND is_active = TRUE)
);

-- Admin can manage subjects
CREATE POLICY "Admin can insert subjects"
ON public.subjects FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update subjects"
ON public.subjects FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete subjects"
ON public.subjects FOR DELETE
USING (public.is_admin());

-- --------------------------------------------------------------------
-- 4. CLASS_SUBJECTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Active users can view class subjects"
ON public.class_subjects FOR SELECT
USING (public.is_active_user());

CREATE POLICY "Admin can insert class subjects"
ON public.class_subjects FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete class subjects"
ON public.class_subjects FOR DELETE
USING (public.is_admin());

-- --------------------------------------------------------------------
-- 5. MATERIALS POLICIES
-- --------------------------------------------------------------------
-- Select:
-- Students can view published materials IF student access is enabled
-- Teachers can view published materials AND their own drafts/archived
-- Admin can view all materials
CREATE POLICY "Materials select policy"
ON public.materials FOR SELECT
USING (
  public.is_admin()
  OR (
    public.get_auth_role() = 'student' 
    AND status = 'published' 
    AND public.student_access_is_enabled()
  )
  OR (
    public.get_auth_role() = 'teacher' 
    AND (status = 'published' OR created_by = auth.uid())
  )
);

-- Insert:
-- Teachers can insert materials they own (created_by = auth.uid())
-- Admin can insert
CREATE POLICY "Teachers and admins can insert materials"
ON public.materials FOR INSERT
WITH CHECK (
  public.is_admin() 
  OR (public.is_teacher() AND created_by = auth.uid())
);

-- Update:
-- Teachers can update their own materials
-- Admin can update any material
CREATE POLICY "Teachers update own materials, admins update all"
ON public.materials FOR UPDATE
USING (
  public.is_admin() 
  OR (public.is_teacher() AND created_by = auth.uid())
)
WITH CHECK (
  public.is_admin() 
  OR (public.is_teacher() AND created_by = auth.uid())
);

-- Delete:
-- Teachers can delete their own materials
-- Admin can delete any material
CREATE POLICY "Teachers delete own materials, admins delete all"
ON public.materials FOR DELETE
USING (
  public.is_admin() 
  OR (public.is_teacher() AND created_by = auth.uid())
);

-- --------------------------------------------------------------------
-- 6. FORM_LINKS POLICIES
-- --------------------------------------------------------------------
-- Select:
CREATE POLICY "Form links select policy"
ON public.form_links FOR SELECT
USING (
  public.is_admin()
  OR (
    public.get_auth_role() = 'student' 
    AND status = 'published' 
    AND public.student_access_is_enabled()
  )
  OR (
    public.get_auth_role() = 'teacher' 
    AND (status = 'published' OR created_by = auth.uid())
  )
);

-- Insert:
CREATE POLICY "Teachers and admins can insert form links"
ON public.form_links FOR INSERT
WITH CHECK (
  public.is_admin() 
  OR (public.is_teacher() AND created_by = auth.uid())
);

-- Update:
CREATE POLICY "Teachers update own forms, admins update all"
ON public.form_links FOR UPDATE
USING (
  public.is_admin() 
  OR (public.is_teacher() AND created_by = auth.uid())
)
WITH CHECK (
  public.is_admin() 
  OR (public.is_teacher() AND created_by = auth.uid())
);

-- Delete:
CREATE POLICY "Teachers delete own forms, admins delete all"
ON public.form_links FOR DELETE
USING (
  public.is_admin() 
  OR (public.is_teacher() AND created_by = auth.uid())
);

-- --------------------------------------------------------------------
-- 7. SITE_SETTINGS POLICIES
-- --------------------------------------------------------------------
-- Active users can view site settings
CREATE POLICY "Active users can view site settings"
ON public.site_settings FOR SELECT
USING (public.is_active_user());

-- Admin can update site settings
CREATE POLICY "Admin can update site settings"
ON public.site_settings FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- --------------------------------------------------------------------
-- 8. AUDIT_LOGS POLICIES
-- --------------------------------------------------------------------
-- Admin can view audit logs
CREATE POLICY "Admin can view audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

-- Insert is done by service role (Edge Functions) or authorized SECURITY DEFINER triggers
CREATE POLICY "Allow server insertion into audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (public.is_admin() OR auth.uid() IS NOT NULL);
