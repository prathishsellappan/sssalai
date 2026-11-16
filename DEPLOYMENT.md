# PRODUCTION DEPLOYMENT & FREE-TIER RUNBOOK

## 1. Zero-Cost Infrastructure Verification

| Service | Provider | Free Tier Limits | Inactivity / Caveats |
|---|---|---|---|
| **Frontend Hosting** | Cloudflare Pages | Unlimited bandwidth, 500 builds/mo | 100% Free, SSL included, Global CDN |
| **Database & Auth** | Supabase Free | 500 MB DB storage, 50,000 MAU | Paused after 7 days of inactivity (unpause with 1 click or periodic ping) |
| **File Storage** | Supabase Storage | 1 GB storage, 2 GB egress / mo | Sufficient for ~150 PDF/Word study guides |
| **Edge Functions** | Supabase Edge | 500,000 invocations / mo | Cold starts ~200ms; abundant for school lab use |

> **Note**: Verify terms before institutional production rollout. To ensure backups remain independent of cloud quotas, follow the backup procedure detailed below.

---

## 2. Supabase Setup Step-by-Step

### 1. Create Project
1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL**, **Anon Key**, and **Service Role Key**.

### 2. Run Database Migrations
Run the migration scripts in numerical sequence via the Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_storage_policies.sql`
4. `supabase/migrations/004_security_hardening.sql`
5. `supabase/migrations/005_seed_academic_data.sql`

### 3. Provision Initial Accounts
Execute the following in the SQL Editor to provision the master administrator and the shared student account:

```sql
-- 1. Create Initial Admin Auth User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@school.example',
  crypt('MasterAdminSecurePassword123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"System Administrator"}'
);

INSERT INTO public.profiles (id, email, display_name, role, is_active, must_change_password)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@school.example',
  'System Administrator',
  'admin',
  TRUE,
  FALSE
);

-- 2. Create Initial Shared Student Auth User
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'students@school.example',
  crypt('StudentLabAccess2026!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Student Lab Account"}'
);

INSERT INTO public.profiles (id, email, display_name, role, is_active, must_change_password)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'students@school.example',
  'School Student Laboratory',
  'student',
  TRUE,
  FALSE
);
```

### 4. Deploy Supabase Edge Functions
Install the Supabase CLI and deploy the 5 server-side functions:
```bash
supabase login
supabase link --project-ref <your-project-id>

# Set Edge Function Secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
supabase secrets set STUDENT_AUTH_USER_ID=b0000000-0000-0000-0000-000000000002

# Deploy Functions
supabase functions deploy create-teacher
supabase functions deploy update-teacher
supabase functions deploy deactivate-teacher
supabase functions deploy update-student-password
supabase functions deploy delete-material
```

---

## 3. Cloudflare Pages Frontend Deployment

1. Push your repository to GitHub.
2. In Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your repository.
4. Configure Build Settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: `https://your-project.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: `your-publishable-key`
   - `VITE_STUDENT_LOGIN_EMAIL`: `students@school.example`
6. Click **Save and Deploy**. Cloudflare automatically serves the SPA with SSL and applies the SPA fallback routing rules configured in `public/_redirects`.

---

## 4. Independent Backup & Disaster Recovery

Do not rely solely on the cloud host for school study materials.

### PostgreSQL Database Backup
Use `pg_dump` to export database tables and metadata:
```bash
pg_dump --clean --if-exists --no-owner --no-privileges \
  -h db.<your-project-id>.supabase.co \
  -U postgres \
  -d postgres > backup_$(date +%Y%m%d).sql
```

### Supabase Storage Backup
Download all uploaded files from the `study-materials` bucket:
```bash
# Using Supabase CLI or S3-compatible tool
supabase storage download-all study-materials ./local_backup_materials/
```

### Restoration Instructions
To restore onto a fresh Supabase instance:
```bash
psql -h db.<new-project-id>.supabase.co -U postgres -d postgres < backup_20261116.sql
```
And re-upload the files from `./local_backup_materials/` to the new project's `study-materials` bucket.
