import React, { useEffect, useState } from 'react';
import { classService, subjectService } from '@/services/academicService';
import { AcademicClass, Subject } from '@/types/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Layers, Plus, BookOpen, Check, X, AlertCircle } from 'lucide-react';

export const AdminAcademicPage: React.FC = () => {
  const [classes, setClasses] = useState<AcademicClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mappings, setMappings] = useState<{ class_id: string; subject_id: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // New Class state
  const [newClassName, setNewClassName] = useState('');
  const [newClassOrder, setNewClassOrder] = useState<number>(1);
  const [classSubmitting, setClassSubmitting] = useState(false);

  // New Subject state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [subjectSubmitting, setSubjectSubmitting] = useState(false);

  const [selectedClassForMapping, setSelectedClassForMapping] = useState<string>('');

  const loadAcademicData = async () => {
    try {
      setLoading(true);
      const [allClasses, allSubjects, allMappings] = await Promise.all([
        classService.getClasses(false),
        subjectService.getSubjects(false),
        subjectService.getClassSubjectMappings(),
      ]);

      setClasses(allClasses);
      setSubjects(allSubjects);
      setMappings(allMappings);
      if (allClasses.length > 0 && !selectedClassForMapping) {
        setSelectedClassForMapping(allClasses[0].id);
      }
    } catch (err) {
      console.error('Failed to load academic data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setClassSubmitting(true);
    try {
      await classService.createClass(newClassName.trim(), newClassOrder);
      setNewClassName('');
      setNewClassOrder((prev) => prev + 1);
      loadAcademicData();
    } catch (err: any) {
      alert('Error creating class: ' + err.message);
    } finally {
      setClassSubmitting(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setSubjectSubmitting(true);
    try {
      await subjectService.createSubject(newSubjectName.trim());
      setNewSubjectName('');
      loadAcademicData();
    } catch (err: any) {
      alert('Error creating subject: ' + err.message);
    } finally {
      setSubjectSubmitting(false);
    }
  };

  const toggleMapping = async (classId: string, subjectId: string) => {
    const isMapped = mappings.some((m) => m.class_id === classId && m.subject_id === subjectId);
    try {
      if (isMapped) {
        await subjectService.unmapSubjectFromClass(classId, subjectId);
      } else {
        await subjectService.mapSubjectToClass(classId, subjectId);
      }
      loadAcademicData();
    } catch (err: any) {
      alert('Error updating subject mapping: ' + err.message);
    }
  };

  const toggleClassActive = async (cls: AcademicClass) => {
    try {
      await classService.updateClass(cls.id, { is_active: !cls.is_active });
      loadAcademicData();
    } catch (err: any) {
      alert('Error toggling class active state: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Structure Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage school classes, academic subjects, and map which subjects belong to each class level.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Card */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Layers className="w-5 h-5 text-purple-600" />
              <span>Classes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateClass} className="flex gap-2">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. Class 10"
                className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-600"
                required
              />
              <input
                type="number"
                value={newClassOrder}
                onChange={(e) => setNewClassOrder(Number(e.target.value))}
                placeholder="Order"
                className="w-20 text-sm border border-slate-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-purple-600"
                title="Display Order"
              />
              <Button type="submit" variant="primary" className="bg-purple-600 hover:bg-purple-700" isLoading={classSubmitting}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </form>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {classes.map((cls) => (
                <div key={cls.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm text-slate-900">{cls.name}</span>
                    <span className="text-xs text-slate-400 ml-2">Order: {cls.display_order}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleClassActive(cls)}
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        cls.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {cls.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subjects Card */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Subjects</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleCreateSubject} className="flex gap-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                placeholder="e.g. Environmental Science"
                className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600"
                required
              />
              <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-blue-700" isLoading={subjectSubmitting}>
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </form>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {subjects.map((sub) => (
                <div key={sub.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">{sub.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    sub.is_active ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {sub.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class-to-Subject Mapping Matrix */}
      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Subject Mapping per Class</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Class to Configure</label>
            <select
              value={selectedClassForMapping}
              onChange={(e) => setSelectedClassForMapping(e.target.value)}
              className="max-w-xs text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-purple-600"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
            {subjects.map((sub) => {
              const isMapped = mappings.some(
                (m) => m.class_id === selectedClassForMapping && m.subject_id === sub.id
              );
              return (
                <button
                  key={sub.id}
                  onClick={() => toggleMapping(selectedClassForMapping, sub.id)}
                  type="button"
                  className={`flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                    isMapped
                      ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{sub.name}</span>
                  {isMapped ? (
                    <Check className="w-4 h-4 text-purple-700 ml-1 flex-shrink-0" />
                  ) : (
                    <span className="text-xs text-slate-300">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
