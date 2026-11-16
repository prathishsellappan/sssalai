-- ====================================================================
-- Migration: 003_storage_policies.sql
-- Description: Private Supabase Storage bucket 'study-materials' and RLS
-- ====================================================================

-- 1. Create storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'study-materials',
    'study-materials',
    FALSE,
    20971520, -- 20MB limit
    ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Storage Policies
-- Helper to extract top folder name (which is teacher's user id)
-- Path format: {teacher_uuid}/{material_uuid}/{filename}

-- Select (Download):
-- Admin can read all
-- Students can read if corresponding material is published and student access is enabled
-- Teacher can read if published or if they are the owner
CREATE POLICY "Download study materials policy"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'study-materials'
  AND (
    public.is_admin()
    OR (
      public.get_auth_role() = 'student'
      AND public.student_access_is_enabled()
      AND EXISTS (
        SELECT 1 FROM public.materials m
        WHERE m.file_path = storage.objects.name
        AND m.status = 'published'
      )
    )
    OR (
      public.get_auth_role() = 'teacher'
      AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM public.materials m
          WHERE m.file_path = storage.objects.name
          AND m.status = 'published'
        )
      )
    )
  )
);

-- Insert (Upload):
-- Only authenticated teachers or admin can upload
-- Enforce that teacher can only upload into their own root folder: {auth.uid()}/*
CREATE POLICY "Upload study materials policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'study-materials'
  AND (
    public.is_admin()
    OR (
      public.is_teacher()
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

-- Update:
CREATE POLICY "Update study materials policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'study-materials'
  AND (
    public.is_admin()
    OR (
      public.is_teacher()
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);

-- Delete:
CREATE POLICY "Delete study materials policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'study-materials'
  AND (
    public.is_admin()
    OR (
      public.is_teacher()
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
  )
);
