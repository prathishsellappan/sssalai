import { describe, it, expect } from 'vitest';
import { supabase } from '../src/lib/supabase';
import { materialService } from '../src/services/materialService';
import { formService } from '../src/services/formService';
import { classService, subjectService } from '../src/services/academicService';

describe('Cross-Tab Persistence (Teacher Upload -> Student View)', () => {
  it('persists a new teacher upload and makes it visible across tabs for students', async () => {
    const classes = await classService.getClasses();
    const subjects = await subjectService.getSubjects();

    const fakePdf = new File([new Blob(['%PDF-1.4 mock'])], 'Exam_Revision_Notes.pdf', { type: 'application/pdf' });

    // 1. Teacher uploads a new material
    const uploaded = await materialService.uploadMaterial({
      title: 'Final Exam Complete Revision Notes 2026',
      description: 'Important formulas and solved papers',
      classId: classes[0].id,
      subjectId: subjects[0].id,
      file: fakePdf,
      status: 'published',
      teacherId: 't0000000-0000-0000-0000-000000000003',
    });

    expect(uploaded).toHaveProperty('id');

    // 2. Simulate opening another tab as student (queries materials table)
    const studentMaterials = await materialService.getMaterials({
      status: 'published',
      search: 'Revision Notes 2026',
    });

    expect(studentMaterials.length).toBeGreaterThan(0);
    expect(studentMaterials[0].title).toBe('Final Exam Complete Revision Notes 2026');

    // 3. Teacher posts a new Google Form
    const createdForm = await formService.createFormLink({
      title: 'Class 10 Revision Quiz 2026',
      description: 'Self-assessment quiz',
      classId: classes[0].id,
      subjectId: subjects[0].id,
      formUrl: 'https://forms.gle/DemoRevisionQuiz2026',
      status: 'published',
      teacherId: 't0000000-0000-0000-0000-000000000003',
    });

    expect(createdForm).toHaveProperty('id');

    // 4. In another tab (student view), the Google Form must be present
    const studentForms = await formService.getFormLinks({ status: 'published' });
    expect(studentForms.some((f) => f.title === 'Class 10 Revision Quiz 2026')).toBe(true);
  });
});
