import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { classService, subjectService } from '@/services/academicService';
import { materialService } from '@/services/materialService';
import { AcademicClass, Subject, Material } from '@/types/database';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { BookOpen, Download, Search, Filter, FileText } from 'lucide-react';

export const StudentMaterialsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialClassId = searchParams.get('classId') || '';

  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Load classes on mount
  useEffect(() => {
    classService.getClasses().then(setClasses).catch(console.error);
  }, []);

  // Update subjects whenever class changes
  useEffect(() => {
    if (selectedClassId) {
      subjectService.getSubjectsForClass(selectedClassId).then(setSubjects).catch(console.error);
    } else {
      subjectService.getSubjects().then(setSubjects).catch(console.error);
    }
    setSelectedSubjectId('');
  }, [selectedClassId]);

  // Fetch materials whenever filters change
  useEffect(() => {
    async function loadMaterials() {
      setLoading(true);
      try {
        const data = await materialService.getMaterials({
          status: 'published',
          classId: selectedClassId || undefined,
          subjectId: selectedSubjectId || undefined,
          search: searchQuery || undefined,
        });
        setMaterials(data);
      } catch (err) {
        console.error('Failed to load materials:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMaterials();
  }, [selectedClassId, selectedSubjectId, searchQuery]);

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
      alert('Error downloading file: ' + (err.message || 'Access token expired'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Browse Study Materials</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select your class and subject to view and download study notes, question banks, and presentations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Class Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSearchParams(e.target.value ? { classId: e.target.value } : {});
              }}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Search Material</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title..."
                className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </Card>

      {/* Material Results */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : materials.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Materials Found</h3>
          <p className="text-sm text-slate-500 mt-1">Try selecting a different class or clearing your search filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => (
            <Card key={mat.id} className="flex flex-col justify-between hover:border-blue-400 transition-colors shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    {mat.classes?.name} &bull; {mat.subjects?.name}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                    {mat.file_name.split('.').pop()}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-2 line-clamp-1">{mat.title}</h3>
                {mat.description && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">{mat.description}</p>
                )}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Teacher: {mat.profiles?.display_name || 'Faculty'}</span>
                  <span>{new Date(mat.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {(mat.file_size / (1024 * 1024)).toFixed(2)} MB
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  isLoading={downloadingId === mat.id}
                  onClick={() => handleDownload(mat)}
                  className="flex items-center space-x-1"
                >
                  <Download className="w-4 h-4 mr-1" />
                  <span>Download</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
