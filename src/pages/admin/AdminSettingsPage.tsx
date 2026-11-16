import React, { useEffect, useState } from 'react';
import { adminService } from '@/services/adminService';
import { SiteSettings } from '@/types/database';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Settings, Shield, Megaphone, AlertCircle, CheckCircle } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [studentAccessEnabled, setStudentAccessEnabled] = useState(true);
  const [announcement, setAnnouncement] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Common Student Password State
  const [studentPassword, setStudentPassword] = useState('');
  const [studentPasswordConfirm, setStudentPasswordConfirm] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const s = await adminService.getSiteSettings();
        setSettings(s);
        setStudentAccessEnabled(s.student_access_enabled);
        setAnnouncement(s.announcement || '');
      } catch (err) {
        console.error('Failed to load site settings:', err);
      }
    }

    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg(null);
    try {
      const updated = await adminService.updateSiteSettings({
        student_access_enabled: studentAccessEnabled,
        announcement: announcement.trim() || undefined,
      });
      setSettings(updated);
      setSettingsMsg({ type: 'success', text: 'Site settings updated successfully!' });
    } catch (err: any) {
      setSettingsMsg({ type: 'error', text: err.message || 'Failed to update site settings' });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleUpdateStudentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentPassword.length < 12) {
      setPasswordMsg({ type: 'error', text: 'Common student password must be at least 12 characters long.' });
      return;
    }
    if (studentPassword !== studentPasswordConfirm) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await adminService.updateStudentPassword(studentPassword);
      setPasswordMsg({
        type: 'success',
        text: 'Common student password updated! Active student sessions across school laboratory computers have been revoked.',
      });
      setStudentPassword('');
      setStudentPasswordConfirm('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update student password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Portal Configuration & Security</h1>
        <p className="text-sm text-slate-500 mt-1">
          Control global student portal accessibility, laboratory announcements, and shared student credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Site Settings & Announcement */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Megaphone className="w-5 h-5 text-emerald-600" />
              <span>Portal Access & Announcements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {settingsMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start space-x-2 ${
                  settingsMsg.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}
              >
                {settingsMsg.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{settingsMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">Student Portal Access</span>
                  <span className="text-xs text-slate-500">
                    When disabled, students cannot log in or view materials.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studentAccessEnabled}
                    onChange={(e) => setStudentAccessEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Global Dashboard Announcement
                </label>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Broadcast message displayed to all students on laboratory computers..."
                  rows={4}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                isLoading={settingsLoading}
              >
                Save Portal Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Common Student Password Rotation */}
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Rotate Student Password</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Updating the shared student password invalidates existing sessions across all school laboratory computers.
            </p>

            {passwordMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start space-x-2 ${
                  passwordMsg.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}
              >
                {passwordMsg.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStudentPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Student Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Min 12 characters"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={studentPasswordConfirm}
                  onChange={(e) => setStudentPasswordConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-blue-700 hover:bg-blue-800"
                isLoading={passwordLoading}
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
