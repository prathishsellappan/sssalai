import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { classService, subjectService } from '@/services/academicService';
import { materialService } from '@/services/materialService';
import { AcademicClass, Subject, ContentStatus } from '@/types/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { UploadCloud, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export const TeacherUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ContentStatus>('published');
  const [file, setFile] = useState<File | null>(null);
  
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load Classes
  useEffect(() => {
    classService.getClasses().then(setClasses).catch(console.error);
  }, []);

  // Dynamically load mapped subjects when class changes
  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      setSelectedSubjectId('');
      return;
    }

    setLoadingSubjects(true);
    subjectService
      .getSubjectsForClass(selectedClassId)
      .then((data) => {
        setSubjects(data);
        setSelectedSubjectId('');
      })
      .catch(console.error)
      .finally(() => setLoadingSubjects(false));
  }, [selectedClassId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate size (20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError('Selected file exceeds the maximum 20 MB size limit.');
        setFile(null);
        return;
      }

      // Validate allowed formats: PDF, DOCX, PPTX
      const allowedExts = ['.pdf', '.docx', '.pptx'];
      const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
      if (!allowedExts.includes(fileExt)) {
        setError('Invalid file format. Only PDF (.pdf), Word (.docx), and PowerPoint (.pptx) documents are supported.');
        setFile(null);
        return;
      }

      setError(null);
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim() || !selectedClassId || !selectedSubjectId || !file) {
      setError('Please fill in all required fields and select a valid file.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await materialService.uploadMaterial({
        title: title.trim(),
        description: description.trim() || undefined,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        file,
        status,
        teacherId: user.id,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/teacher/materials');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to upload study material');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Upload Study Material</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload classroom presentations, notes, and question banks for student access.
        </p>
      </div>

      <Card className="border border-slate-200">
        <CardContent className="p-6">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900">Study Material Uploaded!</h3>
              <p className="text-sm text-slate-500 mt-1">Redirecting to your materials manager...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chapter 4: Thermodynamics Notes"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide brief context, instructions, or chapter summary..."
                  rows={3}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {/* Class & Subject Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    disabled={!selectedClassId || loadingSubjects}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-100 disabled:opacity-75"
                    required
                  >
                    <option value="">
                      {loadingSubjects ? 'Loading mapped subjects...' : 'Select Subject'}
                    </option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload Component */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Upload Document <span className="text-red-500">*</span> (Max 20 MB)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">
                    Supported formats: <span className="font-semibold text-slate-800">PDF (.pdf), DOCX (.docx), PPTX (.pptx)</span>
                  </p>
                  <input
                    type="file"
                    id="fileUpload"
                    accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="fileUpload"
                    className="mt-3 inline-block cursor-pointer px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Browse File
                  </label>
                  {file && (
                    <div className="mt-3 text-xs text-indigo-700 font-semibold flex items-center justify-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Radio / Select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Publication Status</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center text-sm text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={status === 'published'}
                      onChange={() => setStatus('published')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Publish Immediately</span>
                  </label>
                  <label className="inline-flex items-center text-sm text-slate-700">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={status === 'draft'}
                      onChange={() => setStatus('draft')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Save as Draft</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/teacher/materials')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-indigo-700 hover:bg-indigo-800"
                  isLoading={submitting}
                >
                  Upload & Save
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
