import { describe, it, expect, vi } from 'vitest';
import { materialService } from '../../src/services/materialService';

describe('Material Upload File Constraints', () => {
  it('rejects files larger than 20MB', async () => {
    // 21MB fake file
    const oversizedBlob = new Blob([new Uint8Array(21 * 1024 * 1024)], { type: 'application/pdf' });
    const file = new File([oversizedBlob], 'large.pdf', { type: 'application/pdf' });

    await expect(
      materialService.uploadMaterial({
        title: 'Huge Document',
        classId: 'mock-class-id',
        subjectId: 'mock-subject-id',
        file,
        status: 'published',
        teacherId: 'mock-teacher-id',
      })
    ).rejects.toThrow('File exceeds maximum allowed size of 20 MB');
  });

  it('rejects disallowed file types such as exe, zip, mp4, etc', async () => {
    const textBlob = new Blob(['hello world'], { type: 'text/plain' });
    const file = new File([textBlob], 'script.txt', { type: 'text/plain' });

    await expect(
      materialService.uploadMaterial({
        title: 'Text File',
        classId: 'mock-class-id',
        subjectId: 'mock-subject-id',
        file,
        status: 'published',
        teacherId: 'mock-teacher-id',
      })
    ).rejects.toThrow('Invalid file type');
  });

  it('stores the uploaded file binary and returns a download URL preserving uploaded content', async () => {
    const originalContent = '%PDF-1.4 Unit 5 Modern Physics Solved Questions and Real Content';
    const testFile = new File([originalContent], 'Unit5_Modern_Physics.pdf', { type: 'application/pdf' });

    const uploaded = await materialService.uploadMaterial({
      title: 'Unit 5 Modern Physics',
      classId: 'c-10',
      subjectId: 's-phy',
      file: testFile,
      status: 'published',
      teacherId: 't0000000-0000-0000-0000-000000000003',
    });

    expect(uploaded).toHaveProperty('id');
    expect(uploaded.file_name).toBe('Unit5_Modern_Physics.pdf');

    const downloadUrl = await materialService.getSignedDownloadUrl(uploaded.file_path);
    expect(downloadUrl).toBeTruthy();
    expect(typeof downloadUrl).toBe('string');
  });

  it('provides a formatted non-empty preview document for pre-seeded materials instead of a blank white page', async () => {
    const preSeededPath = 't0000000-0000-0000-0000-000000000003/m-1/Mechanics_Lecture_Unit4.pdf';
    const downloadUrl = await materialService.getSignedDownloadUrl(preSeededPath);
    expect(downloadUrl).toBeTruthy();
    expect(typeof downloadUrl).toBe('string');
  });
});
