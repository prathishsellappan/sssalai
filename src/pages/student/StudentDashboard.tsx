import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { classService } from '@/services/academicService';
import { materialService } from '@/services/materialService';
import { formService } from '@/services/formService';
import { adminService } from '@/services/adminService';
import { AcademicClass, Material, FormLink, SiteSettings } from '@/types/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { BookOpen, FileText, ArrowRight, Download, ExternalLink, Megaphone } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);
  const [recentForms, setRecentForms] = useState<FormLink[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [loadedClasses, loadedMaterials, loadedForms, settings] = await Promise.all([
          classService.getClasses(),
          materialService.getMaterials({ status: 'published' }),
          formService.getFormLinks({ status: 'published' }),
          adminService.getSiteSettings().catch(() => null),
        ]);

        setClasses(loadedClasses);
        setRecentMaterials(loadedMaterials.slice(0, 6));
        setRecentForms(loadedForms.slice(0, 4));
        if (settings) setSiteSettings(settings);
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleDownload = async (material: Material) => {
    try {
      setDownloadingId(material.id);
      const signedUrl = await materialService.getSignedDownloadUrl(material.file_path);
      const link = document.createElement('a');
      link.href = signedUrl;
      link.setAttribute('download', material.file_name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (signedUrl.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(signedUrl), 10000);
      }
    } catch (err: any) {
      alert('Error downloading material: ' + (err.message || 'File access expired'));
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* School Announcement Banner */}
      {siteSettings?.announcement && (
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-5 text-white shadow-sm flex items-start space-x-4">
          <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-200">School Announcement</h2>
            <p className="mt-1 text-sm text-slate-100 leading-relaxed">{siteSettings.announcement}</p>
          </div>
        </div>
      )}

      {/* Available Classes Quick Navigation */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">Explore by Class</h2>
          <Link to="/student/materials" className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center">
            View All Materials <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              to={`/student/materials?classId=${cls.id}`}
              className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl p-4 text-center transition-all group shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                {cls.name.replace(/[^0-9]/g, '') || cls.name.charAt(0)}
              </div>
              <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 block">
                {cls.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Study Materials (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-700" />
              <span>Recently Uploaded Materials</span>
            </h2>
            <Link to="/student/materials" className="text-xs font-semibold text-blue-700 hover:underline">
              Browse All
            </Link>
          </div>

          {recentMaterials.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">No study materials published yet.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentMaterials.map((mat) => (
                <Card key={mat.id} className="hover:border-blue-300 transition-colors flex flex-col justify-between">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {mat.classes?.name || 'Class'} &bull; {mat.subjects?.name || 'Subject'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono uppercase">
                        {mat.file_name.split('.').pop()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm line-clamp-1">{mat.title}</h3>
                    {mat.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mat.description}</p>
                    )}
                    <div className="mt-3 text-[11px] text-slate-400">
                      Uploaded by {mat.profiles?.display_name || 'Faculty'}
                    </div>
                  </CardContent>
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{(mat.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                    <Button
                      size="sm"
                      variant="primary"
                      isLoading={downloadingId === mat.id}
                      onClick={() => handleDownload(mat)}
                      className="text-xs flex items-center space-x-1 py-1"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      <span>Download</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recently Posted Google Forms (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-700" />
              <span>Google Forms</span>
            </h2>
            <Link to="/student/forms" className="text-xs font-semibold text-blue-700 hover:underline">
              View All
            </Link>
          </div>

          {recentForms.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">No Google Forms posted yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentForms.map((form) => (
                <Card key={form.id} className="p-4 hover:border-indigo-300 transition-colors">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 mb-2">
                    {form.classes?.name} &bull; {form.subjects?.name}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">{form.title}</h3>
                  {form.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{form.description}</p>
                  )}
                  <div className="mt-3">
                    <a
                      href={form.form_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      <span>Open Form in New Tab</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
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
