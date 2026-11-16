import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import { materialService } from '@/services/materialService';
import { formService } from '@/services/formService';
import { classService } from '@/services/academicService';
import { Profile, AuditLog } from '@/types/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { 
  Users, 
  BookOpen, 
  FileText, 
  Layers, 
  ShieldAlert, 
  UserPlus, 
  Settings, 
  Activity 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [materialsCount, setMaterialsCount] = useState(0);
  const [formsCount, setFormsCount] = useState(0);
  const [classesCount, setClassesCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [teacherList, materialsList, formsList, classesList, auditLogs] = await Promise.all([
          adminService.getTeachers(),
          materialService.getMaterials(),
          formService.getFormLinks(),
          classService.getClasses(),
          adminService.getAuditLogs(10),
        ]);

        setTeachers(teacherList);
        setMaterialsCount(materialsList.length);
        setFormsCount(formsList.length);
        setClassesCount(classesList.length);
        setRecentLogs(auditLogs);
      } catch (err) {
        console.error('Error fetching admin dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, []);

  const activeTeachers = teachers.filter((t) => t.is_active).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Administrator Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Global school platform controls, security oversight, and academic structures.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/teachers/create">
            <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700 flex items-center space-x-1">
              <UserPlus className="w-4 h-4 mr-1" />
              <span>Create Teacher</span>
            </Button>
          </Link>
          <Link to="/admin/settings">
            <Button variant="outline" className="flex items-center space-x-1">
              <Settings className="w-4 h-4 mr-1 text-slate-600" />
              <span>Portal Settings</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Faculty Accounts</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{teachers.length}</div>
              <span className="text-[11px] text-emerald-600 font-medium">{activeTeachers} active</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Study Materials</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{materialsCount}</div>
              <span className="text-[11px] text-blue-600 font-medium">Uploaded files</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Google Forms</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{formsCount}</div>
              <span className="text-[11px] text-indigo-600 font-medium">Assignment links</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Configured Classes</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{classesCount}</div>
              <span className="text-[11px] text-purple-600 font-medium">Academic levels</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Security Activity & Audit Stream */}
      <Card className="border border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            <span>Recent System Activity & Audit Trail</span>
          </CardTitle>
          <Link to="/admin/audit-logs" className="text-xs font-semibold text-emerald-700 hover:underline">
            View All Audit Logs &rarr;
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No recent audit logs available.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-500">
                        by {log.profiles?.display_name || log.profiles?.email || 'System Operation'}
                      </span>
                    </div>
                    {log.details && (
                      <div className="text-xs text-slate-600 font-mono">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
