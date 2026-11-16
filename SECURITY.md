# SECURITY ARCHITECTURE & THREAT MODEL

## 1. Principles of Least Privilege

1. **Database Row Level Security (RLS)**:
   - Every exposed table has RLS explicitly enabled.
   - Ordinary client tokens cannot alter roles or account statuses in `public.profiles`.
   - Security helper functions (`public.get_auth_role()`, `public.is_admin()`, `public.is_teacher()`) use `SECURITY DEFINER` with fixed `search_path = public` to prevent schema hijack attacks.

2. **Supabase Storage Security**:
   - The bucket `study-materials` is strictly **private** (`public = FALSE`).
   - File download tokens are temporary signed URLs with a **600-second (10-minute) TTL**.
   - Storage upload path convention is enforced: `{teacher_uuid}/{material_uuid}/{sanitized_filename}`. Teachers can only upload or delete files within their own UUID folder.

3. **Authentication Boundary**:
   - Roles are stored exclusively in the protected database table `public.profiles`. The frontend role is only used for UI routing convenience; all queries and mutations are filtered and validated by PostgreSQL RLS.
   - Teachers are forced to change temporary passwords upon first login.
   - Deactivated users are blocked from querying the database via RLS and rejected at the route barrier.

---

## 2. Shared Student Account Security

In a school laboratory environment with 20 student machines, having individual student accounts poses high administrative overhead and privacy compliance burdens.

- **Internal Email Identifier**: The frontend supplies a public identifier (`students@school.example`) and only prompts the student for the common password.
- **Rotation & Invalidation**: When a teacher or administrator rotates the shared password:
  1. The new password is validated (&ge; 12 characters).
  2. The Supabase Auth Admin API updates the credential.
  3. `admin.signOut(studentUserId)` is executed, immediately revoking active JWT sessions across all school laboratory computers.
  4. An audit event is created (`student_password_changed`) without logging the password.

---

## 3. Defense Against File & Injection Attacks

1. **File Type Validation**: Only `.pdf`, `.docx`, and `.pptx` MIME types are permitted. Validated on both client and database check constraints.
2. **File Size Capping**: Strict 20 MB ceiling enforced in the client, storage bucket metadata, and database table check constraints (`file_size <= 20971520`).
3. **Google Forms Link Validation**: Regular expression enforces `https://docs.google.com/forms/` or `https://forms.gle/` with `rel="noopener noreferrer"` attributes when opening in new tabs.
4. **Secret Credentials Protection**: The Supabase Service Role Key is never exposed in frontend code. It is only utilized in server-side Supabase Edge Functions.
