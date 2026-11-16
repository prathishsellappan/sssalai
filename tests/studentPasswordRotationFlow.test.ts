import { describe, it, expect } from 'vitest';
import { supabase } from '../src/lib/supabase';
import { adminService } from '../src/services/adminService';

describe('Student Password Rotation from Teacher or Admin Portal', () => {
  it('updates the shared student password and allows student login with new password while rejecting old password', async () => {
    const studentEmail = 'students@school.example';
    const oldPassword = 'StudentLabAccess2026!';
    const newPassword = 'NewLabPassword2026!Updated';

    // 1. Initial login with default password succeeds
    const initialLogin = await supabase.auth.signInWithPassword({
      email: studentEmail,
      password: oldPassword,
    });
    expect(initialLogin.error).toBeNull();
    await supabase.auth.signOut();

    // 2. Teacher or Admin updates student password
    await adminService.updateStudentPassword(newPassword);

    // 3. Old student password must be rejected
    const oldAttempt = await supabase.auth.signInWithPassword({
      email: studentEmail,
      password: oldPassword,
    });
    expect(oldAttempt.error).not.toBeNull();

    // 4. New student password must succeed
    const newAttempt = await supabase.auth.signInWithPassword({
      email: studentEmail,
      password: newPassword,
    });
    expect(newAttempt.error).toBeNull();
    expect(newAttempt.data.user.email).toBe(studentEmail);
  });
});
