import { describe, it, expect } from 'vitest';
import { supabase } from '../src/lib/supabase';
import { adminService } from '../src/services/adminService';

describe('Admin Password Reset and First Time Teacher Flow', () => {
  it('resets teacher password from admin panel and verifies teacher can login and change password', async () => {
    // 1. Get existing teacher
    const teachers = await adminService.getTeachers();
    const teacher = teachers[0];
    expect(teacher).toBeDefined();

    // 2. Admin resets teacher password
    const adminGivenTemp = 'AdminResetPass987!';
    await adminService.updateTeacher({
      teacherId: teacher.id,
      newPassword: adminGivenTemp,
      resetPasswordFlag: true,
    });

    // 3. Verify teacher must_change_password is true
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', teacher.id)
      .single();
    expect(updatedProfile.must_change_password).toBe(true);

    // 4. Teacher signs in with admin temporary password
    const loginRes = await supabase.auth.signInWithPassword({
      email: teacher.email,
      password: adminGivenTemp,
    });
    expect(loginRes.error).toBeNull();

    // 5. Teacher changes password to personal password
    const teacherNewPersonal = 'TeacherOwnPermanent123!';
    await supabase.auth.updateUser({ password: teacherNewPersonal });
    await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', teacher.id);

    // 6. Verify must_change_password is false
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', teacher.id)
      .single();
    expect(finalProfile.must_change_password).toBe(false);

    // 7. Verify subsequent login with new permanent password works
    await supabase.auth.signOut();
    const finalLogin = await supabase.auth.signInWithPassword({
      email: teacher.email,
      password: teacherNewPersonal,
    });
    expect(finalLogin.error).toBeNull();
  });
});
