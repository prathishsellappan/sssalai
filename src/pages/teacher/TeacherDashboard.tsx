import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { materialService } from '@/services/materialService';
import { formService } from '@/services/formService';
import { Material, FormLink } from '@/types/database';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { 
  FolderGit2, 
  UploadCloud, 
  FileText, 
  PlusCircle, 
  CheckCircle, 
  Clock, 
  Archive 
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { profile, user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [forms, setForms] = useState<FormLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const [myMaterials, myForms] = await Promise.all([
          materialService.getMaterials({ teacherId: user.id }),
          formService.getFormLinks({ teacherId: user.id }),
        ]);
        setMaterials(myMaterials);
        setForms(myForms);
      } catch (err) {
        console.error('Failed to load teacher dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const totalMaterials = materials.length;
  const publishedMaterials = materials.filter((m) => m.status === 'published').length;
  const draftMaterials = materials.filter((m) => m.status === 'draft').length;
  const totalForms = forms.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {profile?.display_name || 'Faculty Member'}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your study materials, lecture presentations, and online assignments.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/teacher/materials/upload">
            <Button variant="primary" className="bg-indigo-700 hover:bg-indigo-800 flex items-center space-x-2">
              <UploadCloud className="w-4 h-4" />
              <span>Upload Material</span>
            </Button>
          </Link>
          <Link to="/teacher/forms/create">
            <Button variant="outline" className="flex items-center space-x-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <PlusCircle className="w-4 h-4" />
              <span>New Google Form</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Uploads</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{totalMaterials}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">Published Notes</span>
              <div className="text-2xl font-bold text-green-700 mt-1">{publishedMaterials}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Drafts</span>
              <div className="text-2xl font-bold text-amber-600 mt-1">{draftMaterials}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Google Forms</span>
              <div className="text-2xl font-bold text-purple-700 mt-1">{totalForms}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Materials & Forms Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Materials */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Recent Study Materials</h2>
            <Link to="/teacher/materials" className="text-xs font-semibold text-indigo-700 hover:underline">
              View All
            </Link>
          </div>

          {materials.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm">You haven't uploaded any study materials yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {materials.slice(0, 5).map((mat) => (
                <Card key={mat.id} className="p-4 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {mat.classes?.name} &bull; {mat.subjects?.name}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          mat.status === 'published' ? 'bg-green-100 text-green-800' :
                          mat.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {mat.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm">{mat.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(mat.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Forms */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Google Forms</h2>
            <Link to="/teacher/forms" className="text-xs font-semibold text-indigo-700 hover:underline">
              View All
            </Link>
          </div>

          {forms.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm">You haven't posted any Google Forms links yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {forms.slice(0, 5).map((f) => (
                <Card key={f.id} className="p-4 hover:border-indigo-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {f.classes?.name} &bull; {f.subjects?.name}
                        </span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          f.status === 'published' ? 'bg-green-100 text-green-800' :
                          f.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {f.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm">{f.title}</h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
