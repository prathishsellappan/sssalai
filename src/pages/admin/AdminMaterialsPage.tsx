import React, { useEffect, useState } from 'react';
import { materialService } from '@/services/materialService';
import { classService } from '@/services/academicService';
import { adminService } from '@/services/adminService';
import { Material, AcademicClass, Profile, ContentStatus } from '@/types/database';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { BookOpen, Search, Trash2, Archive, CheckCircle, Download } from 'lucide-react';

export const AdminMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matList, classList, teacherList] = await Promise.all([
        materialService.getMaterials({
          classId: selectedClassId || undefined,
          teacherId: selectedTeacherId || undefined,
          status: selectedStatus !== 'all' ? (selectedStatus as ContentStatus) : undefined,
          search: search || undefined,
        }),
        classService.getClasses(false),
        adminService.getTeachers(),
      ]);

      setMaterials(matList);
      setClasses(classList);
      setTeachers(teacherList);
    } catch (err) {
      console.error('Error fetching admin materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId, selectedTeacherId, selectedStatus, search]);

  const handleStatusChange = async (id: string, status: ContentStatus) => {
    try {
      await materialService.updateMaterial(id, { status });
      loadData();
    } catch (err: any) {
      alert('Error changing status: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;
    setActionLoading(true);
    try {
      await materialService.deleteMaterial(materialToDelete.id);
      setMaterialToDelete(null);
      loadData();
    } catch (err: any) {
      alert('Error deleting material: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Materials Oversight</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, publish, archive, or remove study materials uploaded across all classes and faculty members.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title..."
                className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </Card>

      {/* Materials Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : materials.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Study Materials</h3>
          <p className="text-sm text-slate-500 mt-1">No uploaded materials match the current filters.</p>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3">Document</th>
                  <th className="px-6 py-3">Class & Subject</th>
                  <th className="px-6 py-3">Faculty</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{m.title}</div>
                      <div className="text-xs text-slate-400 font-mono">{m.file_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {m.classes?.name} &bull; {m.subjects?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700">
                      {m.profiles?.display_name || 'Teacher'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        m.status === 'published' ? 'bg-green-100 text-green-800' :
                        m.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {(m.file_size / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {m.status !== 'published' && (
                        <button
                          onClick={() => handleStatusChange(m.id, 'published')}
                          className="text-xs text-green-700 font-medium px-2 py-1 rounded bg-green-50"
                        >
                          Publish
                        </button>
                      )}
                      {m.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(m.id, 'archived')}
                          className="text-xs text-amber-700 font-medium px-2 py-1 rounded bg-amber-50"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => setMaterialToDelete(m)}
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

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(materialToDelete)}
        title="Admin: Delete Study Material"
        message={`As administrator, are you sure you want to permanently delete "${materialToDelete?.title}"? Both the database record and the storage file will be removed.`}
        confirmText="Confirm Permanent Deletion"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={confirmDelete}
        onCancel={() => setMaterialToDelete(null)}
      />
    </div>
  );
};
