import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { Profile } from '@/types/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { ConfirmationModal } from '@/components/common/ConfirmationModal';
import { 
  Users, 
  UserPlus, 
  KeyRound, 
  UserCheck, 
  UserX, 
  Search, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';

export const AdminTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Creation Drawer/Modal state
  const [isCreating, setIsCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Password Reset state
  const [teacherToReset, setTeacherToReset] = useState<Profile | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Deactivate/Activate state
  const [teacherToToggle, setTeacherToToggle] = useState<Profile | null>(null);
  const [toggleSubmitting, setToggleSubmitting] = useState(false);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTeachers();
      setTeachers(data);
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newDisplayName || !newPassword) {
      setCreateError('All fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setCreateError('Temporary password must be at least 8 characters long.');
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    try {
      await adminService.createTeacher({
        email: newEmail.trim(),
        displayName: newDisplayName.trim(),
        temporaryPassword: newPassword,
      });

      setNewEmail('');
      setNewDisplayName('');
      setNewPassword('');
      setIsCreating(false);
      loadTeachers();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create teacher account');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherToReset || resetPasswordVal.length < 8) {
      setResetError('Password must be at least 8 characters long.');
      return;
    }

    setResetSubmitting(true);
    setResetError(null);

    try {
      await adminService.updateTeacher({
        teacherId: teacherToReset.id,
        newPassword: resetPasswordVal,
        resetPasswordFlag: true,
      });

      setTeacherToReset(null);
      setResetPasswordVal('');
      loadTeachers();
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!teacherToToggle) return;
    setToggleSubmitting(true);
    try {
      await adminService.deactivateTeacher(teacherToToggle.id, !teacherToToggle.is_active);
      setTeacherToToggle(null);
      loadTeachers();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    } finally {
      setToggleSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter(
    (t) =>
      t.display_name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Account Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision faculty logins, reset temporary passwords, or toggle account activation.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreating(!isCreating)}
          className="bg-emerald-600 hover:bg-emerald-700 flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isCreating ? 'Cancel' : 'Create Teacher'}</span>
        </Button>
      </div>

      {/* Creation Box */}
      {isCreating && (
        <Card className="border-2 border-emerald-300 shadow-md animate-in fade-in">
          <CardHeader>
            <CardTitle className="text-base">Create New Faculty Account</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teacher Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder="e.g. John Doe, M.Sc."
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="john.doe@school.example"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Teacher will be forced to change this temporary password upon first login.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700" isLoading={createSubmitting}>
                  Provision Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Teachers List */}
      <Card className="border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-sm">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search faculty by name or email..."
              className="w-full text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No faculty members found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-6 py-3">Faculty Member</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Security Flag</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{t.display_name}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{t.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        t.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {t.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {t.must_change_password ? (
                        <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded">
                          First Login Pending
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Standard</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setTeacherToReset(t)}
                        className="text-xs text-indigo-700 hover:text-indigo-900 font-medium px-2 py-1 rounded bg-indigo-50"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => setTeacherToToggle(t)}
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          t.is_active
                            ? 'text-red-700 hover:text-red-900 bg-red-50'
                            : 'text-green-700 hover:text-green-900 bg-green-50'
                        }`}
                      >
                        {t.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Password Reset Modal */}
      {teacherToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Reset Password for {teacherToReset.display_name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Provide a new temporary password. The teacher will be forced to update it on their next login.
            </p>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
              {resetError && (
                <div className="p-2.5 rounded bg-red-50 text-red-700 text-xs">
                  {resetError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Temporary Password
                </label>
                <input
                  type="password"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setTeacherToReset(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-700" isLoading={resetSubmitting}>
                  Save & Require Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Activation/Deactivation */}
      <ConfirmationModal
        isOpen={Boolean(teacherToToggle)}
        title={teacherToToggle?.is_active ? 'Deactivate Faculty Account?' : 'Activate Faculty Account?'}
        message={
          teacherToToggle?.is_active
            ? `Deactivating ${teacherToToggle?.display_name} will revoke their active sessions and immediately prevent them from logging in or uploading study materials.`
            : `Are you sure you want to reactivate ${teacherToToggle?.display_name}? They will regain access to their teacher portal.`
        }
        confirmText={teacherToToggle?.is_active ? 'Yes, Deactivate' : 'Yes, Activate'}
        variant={teacherToToggle?.is_active ? 'destructive' : 'primary'}
        isLoading={toggleSubmitting}
        onConfirm={handleToggleStatus}
        onCancel={() => setTeacherToToggle(null)}
      />
    </div>
  );
};
