import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card, CardContent } from '@/components/common/Card';

export const TeacherChangePasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { user, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Update password using client auth
      const { error: updateAuthErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateAuthErr) throw updateAuthErr;

      // 2. Clear must_change_password flag on profile
      const targetUserId = user?.id || (await supabase.auth.getSession()).data.session?.user?.id;
      if (targetUserId) {
        await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', targetUserId);
      }

      const updatedProfile = await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        // Direct browser location change to ensure clean React Router state transition
        window.location.href = '/teacher/dashboard';
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto shadow-md">
          <KeyRound className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">Change Temporary Password</h2>
        <p className="mt-1 text-sm text-slate-500">
          For your account security, you must set a new personal password before accessing the faculty portal.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="border border-slate-200 shadow-md">
          <CardContent className="p-6">
            {success ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900">Password Changed!</h3>
                <p className="text-sm text-slate-600 mt-1">Entering Faculty Portal...</p>
                <div className="mt-4">
                  <Button
                    variant="primary"
                    className="bg-indigo-700 hover:bg-indigo-800"
                    onClick={() => { window.location.href = '/teacher/dashboard'; }}
                  >
                    Enter Dashboard Now
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="block w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                    required
                  />
                </div>

                <div className="pt-2 flex flex-col space-y-2">
                  <Button type="submit" variant="primary" className="w-full bg-indigo-700 hover:bg-indigo-800" isLoading={loading}>
                    Save and Continue
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => signOut()} className="w-full text-slate-500 text-xs">
                    Cancel and Sign Out
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
