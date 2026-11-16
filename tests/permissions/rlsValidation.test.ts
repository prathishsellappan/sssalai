import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Database Security & RLS Policy Verification', () => {
  const rlsMigrationPath = path.resolve(__dirname, '../../supabase/migrations/002_rls_policies.sql');
  const schemaMigrationPath = path.resolve(__dirname, '../../supabase/migrations/001_initial_schema.sql');
  const storageMigrationPath = path.resolve(__dirname, '../../supabase/migrations/003_storage_policies.sql');

  const rlsSql = fs.readFileSync(rlsMigrationPath, 'utf-8');
  const schemaSql = fs.readFileSync(schemaMigrationPath, 'utf-8');
  const storageSql = fs.readFileSync(storageMigrationPath, 'utf-8');

  it('enforces RLS on all exposed application tables', () => {
    const requiredTables = [
      'profiles',
      'classes',
      'subjects',
      'class_subjects',
      'materials',
      'form_links',
      'site_settings',
      'audit_logs',
    ];

    for (const table of requiredTables) {
      expect(rlsSql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it('guarantees that students can only read published materials when student access is enabled', () => {
    expect(rlsSql).toContain("public.get_auth_role() = 'student'");
    expect(rlsSql).toContain("status = 'published'");
    expect(rlsSql).toContain('public.student_access_is_enabled()');
  });

  it('guarantees teachers can only insert, update, or delete their own materials', () => {
    expect(rlsSql).toContain("created_by = auth.uid()");
  });

  it('enforces private storage bucket and restricts uploads to teacher owned folders', () => {
    expect(storageSql).toContain("public = FALSE");
    expect(storageSql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
  });

  it('enforces maximum 20MB file size limit in database constraint', () => {
    expect(schemaSql).toContain('file_size <= 20971520');
  });
});
