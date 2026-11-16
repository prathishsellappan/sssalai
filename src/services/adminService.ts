import { supabase, isDemoMode } from '@/lib/supabase';
import { Profile, AuditLog, SiteSettings } from '@/types/database';

export const adminService = {
  async getTeachers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Profile[];
  },

  async createTeacher(payload: { email: string; displayName: string; temporaryPassword: string }) {
    if (isDemoMode) {
      const email = payload.email.trim().toLowerCase();
      // Store temporary password created by admin
      supabase.from('profiles').insert({
        email,
        display_name: payload.displayName,
        role: 'teacher',
        is_active: true,
        must_change_password: true,
      });
      // Register password into mock auth
      const { setDemoTeacherPassword } = await import('@/lib/supabase');
      setDemoTeacherPassword(email, payload.temporaryPassword);
      return { success: true };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const res = await response.json();
    if (!response.ok) {
      throw new Error(res.error || 'Failed to create teacher account');
    }
    return res;
  },

  async updateTeacher(payload: { teacherId: string; displayName?: string; newPassword?: string; resetPasswordFlag?: boolean }) {
    if (isDemoMode) {
      if (payload.newPassword) {
        const { getTeacherEmailById, setDemoTeacherPassword } = await import('@/lib/supabase');
        const email = getTeacherEmailById(payload.teacherId);
        if (email) {
          setDemoTeacherPassword(email, payload.newPassword);
        }
      }
      return supabase.from('profiles').update({
        display_name: payload.displayName,
        must_change_password: payload.resetPasswordFlag,
      }).eq('id', payload.teacherId);
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const res = await response.json();
    if (!response.ok) {
      throw new Error(res.error || 'Failed to update teacher');
    }
    return res;
  },

  async deactivateTeacher(teacherId: string, isActive: boolean) {
    if (isDemoMode) {
      return supabase.from('profiles').update({ is_active: isActive }).eq('id', teacherId);
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deactivate-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ teacherId, isActive }),
    });

    const res = await response.json();
    if (!response.ok) {
      throw new Error(res.error || 'Failed to change teacher active status');
    }
    return res;
  },

  async updateStudentPassword(newPassword: string) {
    if (isDemoMode) {
      const { setDemoStudentPassword } = await import('@/lib/supabase');
      setDemoStudentPassword(newPassword);
      return { success: true, message: 'Student password updated successfully in local storage' };
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-student-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });

    const res = await response.json();
    if (!response.ok) {
      throw new Error(res.error || 'Failed to update student shared password');
    }
    return res;
  },

  async getSiteSettings(): Promise<SiteSettings> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return data as SiteSettings;
  },

  async updateSiteSettings(updates: Partial<{ student_access_enabled: boolean; announcement: string }>): Promise<SiteSettings> {
    const { data, error } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return data as SiteSettings;
  },

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles (display_name, email, role)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as AuditLog[];
  },
};
