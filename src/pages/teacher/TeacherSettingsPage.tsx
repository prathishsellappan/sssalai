import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { adminService } from '@/services/adminService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { KeyRound, Lock, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export const TeacherSettingsPage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();

  // Personal password change
  const [personalPass, setPersonalPass] = useState('');
  const [personalPassConfirm, setPersonalPassConfirm] = useState('');
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalMsg, setPersonalMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Student common password change
  const [studentPass, setStudentPass] = useState('');
  const [studentPassConfirm, setStudentPassConfirm] = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentMsg, setStudentMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handlePersonalPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (personalPass.length < 8) {
      setPersonalMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (personalPass !== personalPassConfirm) {
      setPersonalMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPersonalLoading(true);
    setPersonalMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: personalPass });
      if (error) throw error;

      setPersonalMsg({ type: 'success', text: 'Your password was successfully updated!' });
      setPersonalPass('');
      setPersonalPassConfirm('');
      await refreshProfile();
    } catch (err: any) {
      setPersonalMsg({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleStudentPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentPass.length < 12) {
      setStudentMsg({ type: 'error', text: 'Common student password must be at least 12 characters long.' });
      return;
    }
    if (studentPass !== studentPassConfirm) {
      setStudentMsg({ type: 'error', text: 'Student passwords do not match.' });
      return;
    }

    setStudentLoading(true);
    setStudentMsg(null);

    try {
      await adminService.updateStudentPassword(studentPass);
      setStudentMsg({
        type: 'success',
        text: 'Common student password updated! Active student sessions on laboratory computers have been revoked.',
      });
      setStudentPass('');
      setStudentPassConfirm('');
    } catch (err: any) {
      setStudentMsg({ type: 'error', text: err.message || 'Failed to update shared student password' });
    } finally {
      setStudentLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Settings & Security</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your individual faculty credentials or set a new common student laboratory password.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Password */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <span>Change Faculty Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {personalMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start space-x-2 ${
                  personalMsg.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}
              >
                {personalMsg.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{personalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePersonalPasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={personalPass}
                  onChange={(e) => setPersonalPass(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={personalPassConfirm}
                  onChange={(e) => setPersonalPassConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-600"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-indigo-700 hover:bg-indigo-800"
                isLoading={personalLoading}
              >
                Update My Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Common Student Password */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Change Student Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500">
              Teachers can rotate the shared student password used on laboratory computers. Setting a new password revokes existing lab sessions.
            </p>

            {studentMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start space-x-2 ${
                  studentMsg.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}
              >
                {studentMsg.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{studentMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleStudentPasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Student Password (Min 12 chars)</label>
                <input
                  type="password"
                  value={studentPass}
                  onChange={(e) => setStudentPass(e.target.value)}
                  placeholder="Minimum 12 characters"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Student Password</label>
                <input
                  type="password"
                  value={studentPassConfirm}
                  onChange={(e) => setStudentPassConfirm(e.target.value)}
                  placeholder="Re-enter student password"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-blue-700 hover:bg-blue-800"
                isLoading={studentLoading}
              >
                Update Student Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
