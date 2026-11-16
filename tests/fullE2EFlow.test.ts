import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../src/lib/supabase';
import { classService, subjectService } from '../src/services/academicService';
import { materialService } from '../src/services/materialService';
import { formService } from '../src/services/formService';
import { adminService } from '../src/services/adminService';

describe('Comprehensive End-to-End Application Functionality', () => {
  beforeEach(async () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  // 1. AUTHENTICATION FLOWS
  describe('Authentication Flows', () => {
    it('authenticates student using common password and rejects invalid password', async () => {
      // Invalid
      const invalid = await supabase.auth.signInWithPassword({
        email: 'students@school.example',
        password: 'WrongPassword!',
      });
      expect(invalid.error).not.toBeNull();

      // Valid
      const valid = await supabase.auth.signInWithPassword({
        email: 'students@school.example',
        password: 'StudentLabAccess2026!',
      });
      expect(valid.error).toBeNull();
      expect(valid.data.user.email).toBe('students@school.example');

      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', valid.data.user.id)
        .single();
      expect(profile.role).toBe('student');
      expect(profile.is_active).toBe(true);
    });

    it('authenticates teacher with individual credentials', async () => {
      const valid = await supabase.auth.signInWithPassword({
        email: 'teacher@school.example',
        password: 'TeacherPassword123!',
      });
      expect(valid.error).toBeNull();
      expect(valid.data.user.email).toBe('teacher@school.example');

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', valid.data.user.id)
        .single();
      expect(profile.role).toBe('teacher');
    });

    it('authenticates admin and verifies administrative profile', async () => {
      const valid = await supabase.auth.signInWithPassword({
        email: 'admin@school.example',
        password: 'MasterAdminSecurePassword123!',
      });
      expect(valid.error).toBeNull();

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', valid.data.user.id)
        .single();
      expect(profile.role).toBe('admin');
    });
  });

  // 2. ACADEMIC STRUCTURES
  describe('Academic Management', () => {
    it('retrieves active classes and subjects', async () => {
      const classes = await classService.getClasses();
      expect(classes.length).toBeGreaterThan(0);
      expect(classes[0]).toHaveProperty('name');

      const subjects = await subjectService.getSubjects();
      expect(subjects.length).toBeGreaterThan(0);
    });

    it('creates a new class and creates a new subject', async () => {
      const newClass = await classService.createClass('Class 5 Special', 10);
      expect(newClass.name).toBe('Class 5 Special');

      const newSubject = await subjectService.createSubject('Astronomy');
      expect(newSubject.name).toBe('Astronomy');

      // Map subject to class
      await subjectService.mapSubjectToClass(newClass.id, newSubject.id);
      const classSubjects = await subjectService.getSubjectsForClass(newClass.id);
      expect(classSubjects.some((s) => s.name === 'Astronomy')).toBe(true);
    });
  });

  // 3. STUDY MATERIALS LIFECYCLE
  describe('Study Materials Operations', () => {
    it('uploads a document, lists it, and generates signed download URL', async () => {
      const classes = await classService.getClasses();
      const subjects = await subjectService.getSubjects();

      const fakePdfBlob = new Blob(['%PDF-1.4 sample content'], { type: 'application/pdf' });
      const fakeFile = new File([fakePdfBlob], 'Algebra_Unit1.pdf', { type: 'application/pdf' });

      // Upload
      const uploaded = await materialService.uploadMaterial({
        title: 'Class 10 Algebra Chapter 1',
        description: 'Complete notes and formulas',
        classId: classes[0].id,
        subjectId: subjects[0].id,
        file: fakeFile,
        status: 'published',
        teacherId: 't0000000-0000-0000-0000-000000000003',
      });

      expect(uploaded).toHaveProperty('id');
      expect(uploaded.title).toBe('Class 10 Algebra Chapter 1');

      // Fetch materials
      const allMaterials = await materialService.getMaterials({ search: 'Algebra' });
      expect(allMaterials.length).toBeGreaterThan(0);

      // Download URL
      const signedUrl = await materialService.getSignedDownloadUrl(uploaded.file_path);
      expect(signedUrl).toBeDefined();
      expect(signedUrl.length).toBeGreaterThan(10);

      // Status change to archived
      const updated = await materialService.updateMaterial(uploaded.id, { status: 'archived' });
      expect(updated.status).toBe('archived');

      // Deletion
      await materialService.deleteMaterial(uploaded.id);
      const afterDelete = await materialService.getMaterials({ search: 'Algebra' });
      expect(afterDelete.some((m) => m.id === uploaded.id)).toBe(false);
    });
  });

  // 4. GOOGLE FORMS ASSIGNMENTS LIFECYCLE
  describe('Google Forms Assignment Operations', () => {
    it('creates, lists, and removes a Google Forms assignment', async () => {
      const classes = await classService.getClasses();
      const subjects = await subjectService.getSubjects();

      const created = await formService.createFormLink({
        title: 'Weekly Chemistry Test',
        description: 'Periodic Table test',
        classId: classes[0].id,
        subjectId: subjects[0].id,
        formUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScChemicalTestForm/viewform',
        status: 'published',
        teacherId: 't0000000-0000-0000-0000-000000000003',
      });

      expect(created.title).toBe('Weekly Chemistry Test');

      const forms = await formService.getFormLinks({ status: 'published' });
      expect(forms.some((f) => f.title === 'Weekly Chemistry Test')).toBe(true);

      await formService.deleteFormLink(created.id);
      const afterDelete = await formService.getFormLinks();
      expect(afterDelete.some((f) => f.id === created.id)).toBe(false);
    });
  });

  // 5. ADMIN CONTROLS & SETTINGS
  describe('Admin Operations', () => {
    it('manages teacher provisioning, status toggles, and site settings', async () => {
      // Create teacher
      await adminService.createTeacher({
        email: 'newprof@school.example',
        displayName: 'Professor Charles',
        temporaryPassword: 'TempPassword123!',
      });

      const teachers = await adminService.getTeachers();
      const newProf = teachers.find((t) => t.email === 'newprof@school.example');
      expect(newProf).toBeDefined();

      // Deactivate
      if (newProf) {
        await adminService.deactivateTeacher(newProf.id, false);
        const updatedList = await adminService.getTeachers();
        const deactivatedProf = updatedList.find((t) => t.id === newProf.id);
        expect(deactivatedProf?.is_active).toBe(false);
      }

      // Site settings update
      const settings = await adminService.updateSiteSettings({
        announcement: 'School annual sports day next week!',
      });
      expect(settings.announcement).toBe('School annual sports day next week!');
    });
  });
});
