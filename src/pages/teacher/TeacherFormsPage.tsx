import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { classService, subjectService } from '@/services/academicService';
import { formService } from '@/services/formService';
import { AcademicClass, Subject, FormLink, ContentStatus } from '@/types/database';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { FileText, Plus, Trash2, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

export const TeacherFormsPage: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<FormLink[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Creation form state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [status, setStatus] = useState<ContentStatus>('published');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formToDelete, setFormToDelete] = useState<FormLink | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [allForms, allClasses] = await Promise.all([
        formService.getFormLinks({ teacherId: user.id }),
        classService.getClasses(),
      ]);
      setForms(allForms);
      setClasses(allClasses);
    } catch (err) {
      console.error('Failed to load forms data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      setSelectedSubjectId('');
      return;
    }
    subjectService.getSubjectsForClass(selectedClassId).then(setSubjects).catch(console.error);
  }, [selectedClassId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title.trim() || !formUrl.trim() || !selectedClassId || !selectedSubjectId) {
      setError('Please provide title, Google Forms URL, class, and subject.');
      return;
    }

    if (!formService.isValidGoogleFormsUrl(formUrl)) {
      setError('Invalid link. Only Google Forms URLs (docs.google.com/forms/ or forms.gle/) are permitted.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await formService.createFormLink({
        title: title.trim(),
        description: description.trim() || undefined,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        formUrl: formUrl.trim(),
        status,
        teacherId: user.id,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setFormUrl('');
      setSelectedClassId('');
      setSelectedSubjectId('');
      setIsCreating(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create Google Form assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ContentStatus) => {
    try {
      await formService.updateFormLink(id, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!formToDelete) return;
    try {
      await formService.deleteFormLink(formToDelete.id);
      setFormToDelete(null);
      loadData();
    } catch (err: any) {
      alert('Failed to delete form link: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Google Forms</h1>
          <p className="text-sm text-slate-500 mt-1">
            Post and assign online evaluations, homework Google Forms, and quizzes.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreating(!isCreating)}
          className="bg-indigo-700 hover:bg-indigo-800 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel Creation' : 'New Google Form'}</span>
        </Button>
      </div>

      {/* Creation Box */}
      {isCreating && (
        <Card className="border-2 border-indigo-200 shadow-sm animate-in fade-in">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Post a Google Forms Assignment</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Assignment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Unit 3 Quiz: Optics"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Google Forms URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/e/... or https://forms.gle/..."
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Must begin with <span className="font-mono">https://docs.google.com/forms/</span> or <span className="font-mono">https://forms.gle/</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructions (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions for students regarding due dates or submission format..."
                  rows={2}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

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
                    disabled={!selectedClassId}
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-100"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center text-sm text-slate-700">
                    <input
                      type="radio"
                      name="formStatus"
                      value="published"
                      checked={status === 'published'}
                      onChange={() => setStatus('published')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Publish Now</span>
                  </label>
                  <label className="inline-flex items-center text-sm text-slate-700">
                    <input
                      type="radio"
                      name="formStatus"
                      value="draft"
                      checked={status === 'draft'}
                      onChange={() => setStatus('draft')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2">Save as Draft</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="bg-indigo-700 hover:bg-indigo-800" isLoading={submitting}>
                  Post Form Link
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Forms Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : forms.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Google Forms</h3>
          <p className="text-sm text-slate-500 mt-1">Post your first online test or quiz link above.</p>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3">Assignment Title</th>
                  <th className="px-6 py-3">Class & Subject</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Form Link</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forms.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {f.title}
                      {f.description && <div className="text-xs text-slate-500 font-normal mt-0.5 line-clamp-1">{f.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {f.classes?.name} &bull; {f.subjects?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        f.status === 'published' ? 'bg-green-100 text-green-800' :
                        f.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={f.form_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-indigo-700 hover:text-indigo-900 font-medium"
                      >
                        <span>Open Form</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {f.status !== 'published' && (
                        <button
                          onClick={() => handleStatusChange(f.id, 'published')}
                          className="text-xs text-green-700 hover:text-green-900 font-medium px-2 py-1 rounded bg-green-50"
                        >
                          Publish
                        </button>
                      )}
                      {f.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(f.id, 'archived')}
                          className="text-xs text-amber-700 hover:text-amber-900 font-medium px-2 py-1 rounded bg-amber-50"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => setFormToDelete(f)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(formToDelete)}
        title="Delete Google Form Assignment?"
        message={`Are you sure you want to delete "${formToDelete?.title}"? Students will no longer see this assignment link.`}
        confirmText="Delete Form"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setFormToDelete(null)}
      />
    </div>
  );
};
