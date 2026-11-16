import React, { useEffect, useState } from 'react';
import { classService, subjectService } from '@/services/academicService';
import { formService } from '@/services/formService';
import { AcademicClass, Subject, FormLink } from '@/types/database';
import { Card, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { FileText, ExternalLink, Search } from 'lucide-react';

export const StudentFormsPage: React.FC = () => {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [forms, setForms] = useState<FormLink[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classService.getClasses().then(setClasses).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      subjectService.getSubjectsForClass(selectedClassId).then(setSubjects).catch(console.error);
    } else {
      subjectService.getSubjects().then(setSubjects).catch(console.error);
    }
    setSelectedSubjectId('');
  }, [selectedClassId]);

  useEffect(() => {
    async function loadForms() {
      setLoading(true);
      try {
        const data = await formService.getFormLinks({
          status: 'published',
          classId: selectedClassId || undefined,
          subjectId: selectedSubjectId || undefined,
        });
        setForms(data);
      } catch (err) {
        console.error('Failed to load forms:', err);
      } finally {
        setLoading(false);
      }
    }

    loadForms();
  }, [selectedClassId, selectedSubjectId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Google Forms</h1>
        <p className="text-sm text-slate-500 mt-1">
          Open online quizzes, homework forms, and tests assigned by your teachers.
        </p>
      </div>

      {/* Filter Header */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Subject</label>
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
        </div>
      </Card>

      {/* Forms Listing */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : forms.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Google Forms Available</h3>
          <p className="text-sm text-slate-500 mt-1">Check back later or choose another class filter.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="flex flex-col justify-between hover:border-indigo-400 transition-colors shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {form.classes?.name} &bull; {form.subjects?.name}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{form.title}</h3>
                {form.description && (
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{form.description}</p>
                )}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Assigned by {form.profiles?.display_name || 'Faculty'}</span>
                  <span>{new Date(form.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                <a
                  href={form.form_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center font-medium rounded-lg text-sm px-4 py-2 bg-indigo-700 text-white hover:bg-indigo-800 transition-colors"
                >
                  <span>Open Assignment Form</span>
                  <ExternalLink className="w-4 h-4 ml-1.5" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
