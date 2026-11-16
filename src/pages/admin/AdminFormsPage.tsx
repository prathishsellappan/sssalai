import React, { useEffect, useState } from 'react';
import { formService } from '@/services/formService';
import { classService } from '@/services/academicService';
import { adminService } from '@/services/adminService';
import { FormLink, AcademicClass, Profile, ContentStatus } from '@/types/database';
import { Card, CardContent } from '@/components/common/Card';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { FileText, ExternalLink, Search } from 'lucide-react';

export const AdminFormsPage: React.FC = () => {
  const [forms, setForms] = useState<FormLink[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const [formToDelete, setFormToDelete] = useState<FormLink | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allForms, classList, teacherList] = await Promise.all([
        formService.getFormLinks({
          classId: selectedClassId || undefined,
          teacherId: selectedTeacherId || undefined,
          status: selectedStatus !== 'all' ? (selectedStatus as ContentStatus) : undefined,
        }),
        classService.getClasses(false),
        adminService.getTeachers(),
      ]);

      setForms(allForms);
      setClasses(classList);
      setTeachers(teacherList);
    } catch (err) {
      console.error('Error fetching admin forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId, selectedTeacherId, selectedStatus]);

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    try {
      await formService.updateFormLink(id, { status });
      loadData();
    } catch (err: any) {
      alert('Error updating form status: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!formToDelete) return;
    try {
      await formService.deleteFormLink(formToDelete.id);
      setFormToDelete(null);
      loadData();
    } catch (err: any) {
      alert('Error deleting form: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Google Forms Oversight</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, publish, archive, or delete Google Forms assignments posted by all teachers.
        </p>
      </div>

      {/* Filter Controls */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-slate-800"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Faculty</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-slate-800"
            >
              <option value="">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.display_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Forms Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : forms.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Google Forms</h3>
          <p className="text-sm text-slate-500 mt-1">No online forms match the selected filters.</p>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3">Assignment Title</th>
                  <th className="px-6 py-3">Class & Subject</th>
                  <th className="px-6 py-3">Faculty</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Form URL</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forms.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {f.title}
                      {f.description && <div className="text-xs text-slate-500 font-normal line-clamp-1">{f.description}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {f.classes?.name} &bull; {f.subjects?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700">
                      {f.profiles?.display_name || 'Faculty'}
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
                          className="text-xs text-green-700 font-medium px-2 py-1 rounded bg-green-50"
                        >
                          Publish
                        </button>
                      )}
                      {f.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(f.id, 'archived')}
                          className="text-xs text-amber-700 font-medium px-2 py-1 rounded bg-amber-50"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => setFormToDelete(f)}
                        className="text-xs text-red-600 font-medium px-2 py-1 rounded bg-red-50"
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
        title="Admin: Delete Google Form Assignment"
        message={`Are you sure you want to delete "${formToDelete?.title}"?`}
        confirmText="Confirm Deletion"
        variant="destructive"
        onConfirm={confirmDelete}
        onCancel={() => setFormToDelete(null)}
      />
    </div>
  );
};
