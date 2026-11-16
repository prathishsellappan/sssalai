import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { materialService } from '@/services/materialService';
import { Material, ContentStatus } from '@/types/database';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { 
  FolderGit2, 
  UploadCloud, 
  Trash2, 
  Archive, 
  CheckCircle, 
  Search, 
  ExternalLink 
} from 'lucide-react';

export const TeacherMaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal state for delete confirmation
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMaterials = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await materialService.getMaterials({
        teacherId: user.id,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? (statusFilter as ContentStatus) : undefined,
      });
      setMaterials(data);
    } catch (err) {
      console.error('Error fetching teacher materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [user, statusFilter, searchQuery]);

  const handleStatusChange = async (materialId: string, newStatus: ContentStatus) => {
    try {
      await materialService.updateMaterial(materialId, { status: newStatus });
      fetchMaterials();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    if (!materialToDelete) return;
    setActionLoading(true);
    try {
      await materialService.deleteMaterial(materialToDelete.id);
      setMaterialToDelete(null);
      fetchMaterials();
    } catch (err: any) {
      alert('Failed to delete material: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manage Study Materials</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize, publish, archive, or remove your uploaded classroom materials.
          </p>
        </div>
        <Link to="/teacher/materials/upload">
          <Button variant="primary" className="bg-indigo-700 hover:bg-indigo-800 flex items-center space-x-2">
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Material</span>
          </Button>
        </Link>
      </div>

      {/* Filter and Search */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title..."
              className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
              <option value="archived">Archived Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Materials Table / List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : materials.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <FolderGit2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Materials Found</h3>
          <p className="text-sm text-slate-500 mt-1">Upload study materials to share them with your students.</p>
        </Card>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3">Document Title</th>
                  <th className="px-6 py-3">Class & Subject</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Size</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{mat.title}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{mat.file_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {mat.classes?.name} &bull; {mat.subjects?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        mat.status === 'published' ? 'bg-green-100 text-green-800' :
                        mat.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {mat.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {(mat.file_size / (1024 * 1024)).toFixed(2)} MB
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(mat.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {mat.status !== 'published' && (
                        <button
                          onClick={() => handleStatusChange(mat.id, 'published')}
                          className="text-xs text-green-700 hover:text-green-900 font-medium px-2 py-1 rounded bg-green-50"
                        >
                          Publish
                        </button>
                      )}
                      {mat.status === 'published' && (
                        <button
                          onClick={() => handleStatusChange(mat.id, 'archived')}
                          className="text-xs text-amber-700 hover:text-amber-900 font-medium px-2 py-1 rounded bg-amber-50"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => setMaterialToDelete(mat)}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(materialToDelete)}
        title="Delete Study Material?"
        message={`Are you sure you want to permanently delete "${materialToDelete?.title}"? Both the database metadata and the stored file in Supabase Storage will be purged.`}
        confirmText="Yes, Delete Material"
        variant="destructive"
        isLoading={actionLoading}
        onConfirm={confirmDelete}
        onCancel={() => setMaterialToDelete(null)}
      />
    </div>
  );
};
