import { createClient } from '@supabase/supabase-js';
import { Profile, AcademicClass, Subject, Material, FormLink, SiteSettings, AuditLog } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Detect if real Supabase keys are configured or if we are in demo/offline preview mode
export const isDemoMode = !supabaseUrl || 
  supabaseUrl.includes('placeholder') || 
  supabaseUrl.includes('your-project') || 
  !supabasePublishableKey || 
  supabasePublishableKey.includes('your-supabase');

// Standard Supabase client (used if real project is linked)
export const realSupabase = createClient(
  isDemoMode ? 'https://placeholder.supabase.co' : supabaseUrl,
  isDemoMode ? 'placeholder-key' : supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Safe storage access helper
const memoryStorage = new Map<string, string>();
const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        // fallback
      }
    }
    return memoryStorage.get(key) || null;
  },
  setItem(key: string, val: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, val);
        return;
      } catch {
        // fallback
      }
    }
    memoryStorage.set(key, val);
  },
  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch {
        // fallback
      }
    }
    memoryStorage.delete(key);
  },
};

// ==========================================
// PERSISTENT DEMO STORE IN LOCALSTORAGE
// ==========================================
const DEFAULT_DEMO_PASSWORDS: Record<string, string> = {
  'admin@school.example': 'MasterAdminSecurePassword123!',
  'sssalai@gmail.com': 'sssalai@1234',
  'students@school.example': 'StudentLabAccess2026!',
  'teacher@school.example': 'TeacherPassword123!',
};

function getPersistedPasswords(): Record<string, string> {
  const raw = safeStorage.getItem('school_portal_demo_passwords');
  if (!raw) return { ...DEFAULT_DEMO_PASSWORDS };
  try {
    return { ...DEFAULT_DEMO_PASSWORDS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DEMO_PASSWORDS };
  }
}

function savePersistedPasswords(passwords: Record<string, string>) {
  safeStorage.setItem('school_portal_demo_passwords', JSON.stringify(passwords));
}

export function setDemoTeacherPassword(email: string, pass: string) {
  const current = getPersistedPasswords();
  current[email.trim().toLowerCase()] = pass;
  savePersistedPasswords(current);
}

export function setDemoStudentPassword(newPassword: string) {
  const current = getPersistedPasswords();
  const studentEmail = (import.meta.env.VITE_STUDENT_LOGIN_EMAIL || 'students@school.example').trim().toLowerCase();
  current[studentEmail] = newPassword;
  current['students@school.example'] = newPassword;
  savePersistedPasswords(current);
}

const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@school.example',
    display_name: 'System Administrator',
    role: 'admin',
    is_active: true,
    must_change_password: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000009',
    email: 'sssalai@gmail.com',
    display_name: 'System Administrator',
    role: 'admin',
    is_active: true,
    must_change_password: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    email: 'students@school.example',
    display_name: 'School Student Laboratory',
    role: 'student',
    is_active: true,
    must_change_password: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 't0000000-0000-0000-0000-000000000003',
    email: 'teacher@school.example',
    display_name: 'Sarah Jenkins (Physics & Math)',
    role: 'teacher',
    is_active: true,
    must_change_password: false,
    created_at: new Date().toISOString(),
  },
];

function getPersistedProfiles(): Profile[] {
  const raw = safeStorage.getItem('school_portal_demo_profiles');
  if (!raw) return [...DEFAULT_PROFILES];
  try {
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_PROFILES];
  }
}

function savePersistedProfiles(profiles: Profile[]) {
  safeStorage.setItem('school_portal_demo_profiles', JSON.stringify(profiles));
}

export function getTeacherEmailById(id: string): string | null {
  const profiles = getPersistedProfiles();
  const profile = profiles.find((p) => p.id === id);
  return profile ? profile.email : null;
}

const DEFAULT_CLASSES: AcademicClass[] = [
  { id: 'c-6', name: 'Class 6', display_order: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'c-7', name: 'Class 7', display_order: 2, is_active: true, created_at: new Date().toISOString() },
  { id: 'c-8', name: 'Class 8', display_order: 3, is_active: true, created_at: new Date().toISOString() },
  { id: 'c-9', name: 'Class 9', display_order: 4, is_active: true, created_at: new Date().toISOString() },
  { id: 'c-10', name: 'Class 10', display_order: 5, is_active: true, created_at: new Date().toISOString() },
  { id: 'c-11', name: 'Class 11', display_order: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'c-12', name: 'Class 12', display_order: 7, is_active: true, created_at: new Date().toISOString() },
];

function getPersistedClasses(): AcademicClass[] {
  const raw = safeStorage.getItem('school_portal_demo_classes');
  if (!raw) return [...DEFAULT_CLASSES];
  try {
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_CLASSES];
  }
}

function savePersistedClasses(classes: AcademicClass[]) {
  safeStorage.setItem('school_portal_demo_classes', JSON.stringify(classes));
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 's-math', name: 'Mathematics', is_active: true, created_at: new Date().toISOString() },
  { id: 's-phy', name: 'Physics', is_active: true, created_at: new Date().toISOString() },
  { id: 's-chem', name: 'Chemistry', is_active: true, created_at: new Date().toISOString() },
  { id: 's-bio', name: 'Biology', is_active: true, created_at: new Date().toISOString() },
  { id: 's-eng', name: 'English', is_active: true, created_at: new Date().toISOString() },
  { id: 's-cs', name: 'Computer Science', is_active: true, created_at: new Date().toISOString() },
  { id: 's-soc', name: 'Social Studies', is_active: true, created_at: new Date().toISOString() },
];

function getPersistedSubjects(): Subject[] {
  const raw = safeStorage.getItem('school_portal_demo_subjects');
  if (!raw) return [...DEFAULT_SUBJECTS];
  try {
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_SUBJECTS];
  }
}

function savePersistedSubjects(subjects: Subject[]) {
  safeStorage.setItem('school_portal_demo_subjects', JSON.stringify(subjects));
}

function getPersistedMappings(): { class_id: string; subject_id: string }[] {
  const raw = safeStorage.getItem('school_portal_demo_mappings');
  if (raw) {
    try { return JSON.parse(raw); } catch { /* ignore */ }
  }
  const mappings: { class_id: string; subject_id: string }[] = [];
  DEFAULT_CLASSES.forEach((c) => {
    DEFAULT_SUBJECTS.forEach((s) => {
      mappings.push({ class_id: c.id, subject_id: s.id });
    });
  });
  return mappings;
}

function savePersistedMappings(mappings: { class_id: string; subject_id: string }[]) {
  safeStorage.setItem('school_portal_demo_mappings', JSON.stringify(mappings));
}

const DEFAULT_MATERIALS: Material[] = [
  {
    id: 'm-1',
    title: 'Unit 4: Classical Mechanics & Force Laws',
    description: 'Comprehensive lecture presentation and solved practice questions for Class 10 Physics.',
    class_id: 'c-10',
    subject_id: 's-phy',
    file_name: 'Mechanics_Lecture_Unit4.pdf',
    file_path: 't0000000-0000-0000-0000-000000000003/m-1/Mechanics_Lecture_Unit4.pdf',
    file_size: 4200000,
    mime_type: 'application/pdf',
    created_by: 't0000000-0000-0000-0000-000000000003',
    status: 'published',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    classes: DEFAULT_CLASSES.find((c) => c.id === 'c-10'),
    subjects: DEFAULT_SUBJECTS.find((s) => s.id === 's-phy'),
    profiles: { display_name: 'Sarah Jenkins', email: 'teacher@school.example' },
  },
  {
    id: 'm-2',
    title: 'Calculus: Derivatives and Limit Theorems',
    description: 'Study notes, formula cheat sheet, and model questions for high school mathematics.',
    class_id: 'c-12',
    subject_id: 's-math',
    file_name: 'Calculus_Study_Guide.pdf',
    file_path: 't0000000-0000-0000-0000-000000000003/m-2/Calculus_Study_Guide.pdf',
    file_size: 2800000,
    mime_type: 'application/pdf',
    created_by: 't0000000-0000-0000-0000-000000000003',
    status: 'published',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
    classes: DEFAULT_CLASSES.find((c) => c.id === 'c-12'),
    subjects: DEFAULT_SUBJECTS.find((s) => s.id === 's-math'),
    profiles: { display_name: 'Sarah Jenkins', email: 'teacher@school.example' },
  },
];

function getPersistedMaterials(): Material[] {
  const raw = safeStorage.getItem('school_portal_demo_materials');
  if (!raw) return [...DEFAULT_MATERIALS];
  try {
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_MATERIALS];
  }
}

function savePersistedMaterials(materials: Material[]) {
  safeStorage.setItem('school_portal_demo_materials', JSON.stringify(materials));
}

const DEFAULT_FORMS: FormLink[] = [
  {
    id: 'f-1',
    title: 'Class 10 Physics Weekly Quiz: Energy & Work',
    description: 'Complete all 15 multiple-choice questions before Friday 4:00 PM.',
    class_id: 'c-10',
    subject_id: 's-phy',
    form_url: 'https://docs.google.com/forms/d/e/1FAIpQLScDemoPhysicsTestForm/viewform',
    created_by: 't0000000-0000-0000-0000-000000000003',
    status: 'published',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    classes: DEFAULT_CLASSES.find((c) => c.id === 'c-10'),
    subjects: DEFAULT_SUBJECTS.find((s) => s.id === 's-phy'),
    profiles: { display_name: 'Sarah Jenkins', email: 'teacher@school.example' },
  },
];

function getPersistedForms(): FormLink[] {
  const raw = safeStorage.getItem('school_portal_demo_forms');
  if (!raw) return [...DEFAULT_FORMS];
  try {
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_FORMS];
  }
}

function savePersistedForms(forms: FormLink[]) {
  safeStorage.setItem('school_portal_demo_forms', JSON.stringify(forms));
}

const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  student_access_enabled: true,
  announcement: 'Welcome to the School Study Material Management Portal. Access study notes, presentations, and online assignments directly from your class dashboard.',
  updated_by: 'a0000000-0000-0000-0000-000000000001',
  updated_at: new Date().toISOString(),
};

function getPersistedSettings(): SiteSettings {
  const raw = safeStorage.getItem('school_portal_demo_settings');
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function savePersistedSettings(settings: SiteSettings) {
  safeStorage.setItem('school_portal_demo_settings', JSON.stringify(settings));
}

let DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    actor_id: 'a0000000-0000-0000-0000-000000000001',
    action: 'portal_initialized',
    details: { environment: 'local_preview_mode' },
    created_at: new Date().toISOString(),
    profiles: { display_name: 'System Administrator', email: 'admin@school.example', role: 'admin' },
  },
];

const DB_NAME = 'school_portal_storage_db';
const DB_VERSION = 1;
const STORE_NAME = 'files';

function openStorageDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'path' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

const inMemoryFileStore = new Map<string, Blob | File>();

export async function storeDemoFile(path: string, file: Blob | File): Promise<void> {
  inMemoryFileStore.set(path, file);
  try {
    const db = await openStorageDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ path, blob: file, updatedAt: Date.now() });
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  } catch {
    try {
      const db = await openStorageDB();
      if (db) {
        const buf = await file.arrayBuffer();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put({ path, buffer: buf, type: file.type, updatedAt: Date.now() });
      }
    } catch {
      // inMemoryFileStore is populated
    }
  }
}

export async function getDemoFile(path: string): Promise<Blob | null> {
  if (inMemoryFileStore.has(path)) {
    return inMemoryFileStore.get(path)!;
  }

  try {
    const db = await openStorageDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(path);
      const record = await new Promise<any>((resolve) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
      });
      if (record) {
        if (record.blob) {
          inMemoryFileStore.set(path, record.blob);
          return record.blob;
        } else if (record.buffer) {
          const blob = new Blob([record.buffer], { type: record.type || 'application/octet-stream' });
          inMemoryFileStore.set(path, blob);
          return blob;
        }
      }
    }
  } catch {
    // fallback
  }

  return null;
}

export async function deleteDemoFile(path: string): Promise<void> {
  inMemoryFileStore.delete(path);
  try {
    const db = await openStorageDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(path);
    }
  } catch {
    // ignore
  }
}

function generateFallbackPdf(fileName: string): Uint8Array {
  const cleanName = fileName.replace(/[()\\/]/g, ' ');
  const content = `BT
/F1 18 Tf
50 720 Td
(School Study Material Management Portal) Tj
0 -36 Td
/F1 14 Tf
(Document: ${cleanName}) Tj
0 -30 Td
/F1 11 Tf
(Status: Verified Demo Material) Tj
0 -24 Td
(This is sample study material provided for demonstration and student review.) Tj
0 -20 Td
(Teachers can upload real PDF, DOCX, or PPTX documents via the Faculty Portal.) Tj
ET`;

  const streamLength = content.length;
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
5 0 obj
<< /Length ${streamLength} >>
stream
${content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000323 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
450
%%EOF`;

  return new TextEncoder().encode(pdfString);
}

export const mockSupabase = {
  auth: {
    async getSession() {
      const stored = safeStorage.getItem('school_portal_demo_user');
      let user = null;
      if (stored) {
        try { user = JSON.parse(stored); } catch { /* ignore */ }
      }
      return {
        data: {
          session: user ? { user, access_token: 'demo-token' } : null,
        },
        error: null,
      };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const normalizedEmail = email.trim().toLowerCase();
      const profiles = getPersistedProfiles();
      const profile = profiles.find((p) => p.email.toLowerCase() === normalizedEmail);

      if (!profile) {
        return { data: { user: null }, error: new Error('Invalid email or password.') };
      }

      const passwords = getPersistedPasswords();
      const expectedPassword = passwords[normalizedEmail] || (profile.role === 'teacher' ? 'TeacherPassword123!' : null);

      if (expectedPassword && password !== expectedPassword) {
        if (profile.role === 'student') {
          return { data: { user: null }, error: new Error('Incorrect student password. Please verify with your lab teacher.') };
        }
        if (profile.role === 'admin') {
          return { data: { user: null }, error: new Error('Invalid administrator password.') };
        }
        return { data: { user: null }, error: new Error('Invalid teacher password. Please use the temporary password created by the administrator.') };
      }

      const user = { id: profile.id, email: profile.email };
      safeStorage.setItem('school_portal_demo_user', JSON.stringify(user));
      return { data: { user }, error: null };
    },
    async signOut() {
      safeStorage.removeItem('school_portal_demo_user');
      return { error: null };
    },
    async updateUser({ password }: { password?: string }) {
      const stored = safeStorage.getItem('school_portal_demo_user');
      if (stored && password) {
        try {
          const user = JSON.parse(stored);
          const passwords = getPersistedPasswords();
          passwords[user.email.toLowerCase()] = password;
          savePersistedPasswords(passwords);
        } catch {
          // ignore
        }
      }
      return { data: {}, error: null };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  },
  from(tableName: string) {
    function getStore() {
      if (tableName === 'profiles') return getPersistedProfiles();
      if (tableName === 'classes') return getPersistedClasses();
      if (tableName === 'subjects') return getPersistedSubjects();
      if (tableName === 'class_subjects') return getPersistedMappings();
      if (tableName === 'materials') return getPersistedMaterials();
      if (tableName === 'form_links') return getPersistedForms();
      if (tableName === 'site_settings') return [getPersistedSettings()];
      if (tableName === 'audit_logs') return DEMO_AUDIT_LOGS;
      return [];
    }

    const filters: ((item: any) => boolean)[] = [];
    let orderCol: string | null = null;
    let orderAsc = true;
    let limitVal: number | null = null;

    function applyFilters() {
      const raw = getStore();
      const currentClasses = getPersistedClasses();
      const currentSubjects = getPersistedSubjects();
      let data: any[] = [];
      if (tableName === 'class_subjects') {
        data = raw.map((item: any) => ({
          ...item,
          subjects: currentSubjects.find((s) => s.id === item.subject_id),
          classes: currentClasses.find((c) => c.id === item.class_id),
        }));
      } else {
        data = [...raw];
      }

      for (const f of filters) {
        data = data.filter(f);
      }
      if (orderCol) {
        data.sort((a, b) => {
          if (a[orderCol!] < b[orderCol!]) return orderAsc ? -1 : 1;
          if (a[orderCol!] > b[orderCol!]) return orderAsc ? 1 : -1;
          return 0;
        });
      }
      if (limitVal !== null) {
        data = data.slice(0, limitVal);
      }
      return data;
    }

    const queryObj: any = {
      select(cols?: string) {
        return queryObj;
      },
      eq(col: string, val: any) {
        filters.push((item: any) => item[col] === val);
        return queryObj;
      },
      ilike(col: string, val: string) {
        const clean = val.replace(/%/g, '').toLowerCase();
        filters.push((item: any) => (item[col] || '').toLowerCase().includes(clean));
        return queryObj;
      },
      order(col: string, opts?: any) {
        orderCol = col;
        orderAsc = opts?.ascending ?? true;
        return queryObj;
      },
      limit(n: number) {
        limitVal = n;
        return queryObj;
      },
      async single() {
        const res = applyFilters();
        return { data: res[0] || null, error: res[0] ? null : new Error('Row not found') };
      },
      async maybeSingle() {
        const res = applyFilters();
        return { data: res[0] || null, error: null };
      },
      insert(payload: any) {
        const record = { id: payload.id || crypto.randomUUID(), created_at: new Date().toISOString(), ...payload };
        const currentClasses = getPersistedClasses();
        const currentSubjects = getPersistedSubjects();

        if (tableName === 'profiles') {
          const profiles = getPersistedProfiles();
          profiles.push(record);
          savePersistedProfiles(profiles);
        }
        if (tableName === 'classes') {
          const classes = getPersistedClasses();
          classes.push(record);
          savePersistedClasses(classes);
        }
        if (tableName === 'subjects') {
          const subjects = getPersistedSubjects();
          subjects.push(record);
          savePersistedSubjects(subjects);
        }
        if (tableName === 'class_subjects') {
          const mappings = getPersistedMappings();
          mappings.push(record);
          savePersistedMappings(mappings);
        }
        if (tableName === 'materials') {
          const materials = getPersistedMaterials();
          record.classes = currentClasses.find((c) => c.id === record.class_id);
          record.subjects = currentSubjects.find((s) => s.id === record.subject_id);
          record.profiles = { display_name: 'Faculty Member', email: 'teacher@school.example' };
          materials.unshift(record);
          savePersistedMaterials(materials);
        }
        if (tableName === 'form_links') {
          const forms = getPersistedForms();
          record.classes = currentClasses.find((c) => c.id === record.class_id);
          record.subjects = currentSubjects.find((s) => s.id === record.subject_id);
          record.profiles = { display_name: 'Faculty Member', email: 'teacher@school.example' };
          forms.unshift(record);
          savePersistedForms(forms);
        }
        if (tableName === 'audit_logs') DEMO_AUDIT_LOGS.unshift(record);

        const chain: any = {
          data: record,
          error: null,
          select: () => ({
            single: async () => ({ data: record, error: null }),
            then: (resolve: any) => resolve({ data: [record], error: null }),
          }),
          then: (resolve: any) => resolve({ data: record, error: null }),
        };
        return chain;
      },
      update(payload: any) {
        const updateChain: any = {
          eq(col: string, val: any) {
            if (tableName === 'site_settings') {
              const settings = { ...getPersistedSettings(), ...payload };
              savePersistedSettings(settings);
              return {
                select: () => ({ single: async () => ({ data: settings, error: null }) }),
                then: (resolve: any) => resolve({ data: settings, error: null }),
              };
            }
            if (tableName === 'materials') {
              const materials = getPersistedMaterials();
              const target = materials.find((m: any) => m[col] === val);
              if (target) {
                Object.assign(target, payload);
                savePersistedMaterials(materials);
              }
              return {
                select: () => ({ single: async () => ({ data: target, error: null }) }),
                then: (resolve: any) => resolve({ data: target, error: null }),
              };
            }
            if (tableName === 'form_links') {
              const forms = getPersistedForms();
              const target = forms.find((f: any) => f[col] === val);
              if (target) {
                Object.assign(target, payload);
                savePersistedForms(forms);
              }
              return {
                select: () => ({ single: async () => ({ data: target, error: null }) }),
                then: (resolve: any) => resolve({ data: target, error: null }),
              };
            }
            if (tableName === 'profiles') {
              const profiles = getPersistedProfiles();
              const target = profiles.find((p: any) => p[col] === val);
              if (target) {
                Object.assign(target, payload);
                savePersistedProfiles(profiles);
              }
              return {
                select: () => ({ single: async () => ({ data: target, error: null }) }),
                then: (resolve: any) => resolve({ data: target, error: null }),
              };
            }
            if (tableName === 'classes') {
              const classes = getPersistedClasses();
              const target = classes.find((c: any) => c[col] === val);
              if (target) {
                Object.assign(target, payload);
                savePersistedClasses(classes);
              }
              return {
                select: () => ({ single: async () => ({ data: target, error: null }) }),
                then: (resolve: any) => resolve({ data: target, error: null }),
              };
            }
            return {
              select: () => ({ single: async () => ({ data: null, error: null }) }),
              then: (resolve: any) => resolve({ data: null, error: null }),
            };
          },
          then(resolve: any) {
            resolve({ data: null, error: null });
          },
        };
        return updateChain;
      },
      delete() {
        return {
          eq(col: string, val: any) {
            if (tableName === 'materials') {
              const materials = getPersistedMaterials().filter((m: any) => m[col] !== val);
              savePersistedMaterials(materials);
            }
            if (tableName === 'form_links') {
              const forms = getPersistedForms().filter((f: any) => f[col] !== val);
              savePersistedForms(forms);
            }
            return { error: null, then: (resolve: any) => resolve({ error: null }) };
          },
          match(filtersMap: Record<string, any>) {
            if (tableName === 'class_subjects') {
              const mappings = getPersistedMappings().filter(
                (m) => !(m.class_id === filtersMap.class_id && m.subject_id === filtersMap.subject_id)
              );
              savePersistedMappings(mappings);
            }
            return { error: null, then: (resolve: any) => resolve({ error: null }) };
          },
        };
      },
      then(resolve: any) {
        resolve({ data: applyFilters(), error: null });
      },
    };

    return queryObj;
  },
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File | Blob) {
          await storeDemoFile(path, file);
          return { data: { path }, error: null };
        },
        async remove(paths: string[]) {
          for (const p of paths) {
            await deleteDemoFile(p);
          }
          return { data: paths, error: null };
        },
        async createSignedUrl(filePath: string, expiresIn: number) {
          let blob = await getDemoFile(filePath);
          if (!blob) {
            const fileName = filePath.split('/').pop() || 'study-material.pdf';
            const fallbackBytes = generateFallbackPdf(fileName);
            blob = new Blob([fallbackBytes], { type: 'application/pdf' });
          }

          let signedUrl = '';
          if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            try {
              signedUrl = URL.createObjectURL(blob);
            } catch {
              // fallback
            }
          }

          if (!signedUrl) {
            const buffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            signedUrl = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
          }

          return {
            data: { signedUrl },
            error: null,
          };
        },
      };
    },
  },
};

export const supabase = isDemoMode ? (mockSupabase as any) : realSupabase;
