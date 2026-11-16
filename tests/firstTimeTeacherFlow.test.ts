import { describe, it, expect } from 'vitest';
import { supabase } from '../src/lib/supabase';
import { adminService } from '../src/services/adminService';

describe('First Time Teacher Login and Password Change Flow', () => {
  it('enforces admin created temporary password, requires password change, and updates password successfully', async () => {
    // 1. Admin creates a new teacher with temporary password
    const temporaryPass = 'AdminGivenTemp2026!';
    const teacherEmail = 'newhire@school.example';

    await adminService.createTeacher({
      email: teacherEmail,
      displayName: 'Dr. Evelyn Carter',
      temporaryPassword: temporaryPass,
    });

    // 2. Reject incorrect password attempt
    const failedLogin = await supabase.auth.signInWithPassword({
      email: teacherEmail,
      password: 'RandomWrongPassword123!',
    });
    expect(failedLogin.error).not.toBeNull();

    // 3. Accept admin-created temporary password
    const successLogin = await supabase.auth.signInWithPassword({
      email: teacherEmail,
      password: temporaryPass,
    });
    expect(successLogin.error).toBeNull();
    expect(successLogin.data.user.email).toBe(teacherEmail);

    // 4. Verify user has must_change_password = true
    const { data: initialProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', teacherEmail)
      .single();
    expect(initialProfile.must_change_password).toBe(true);

    // 5. Teacher updates password to their personal password
    const personalPassword = 'MySecretNewPassword99!';
    await supabase.auth.updateUser({ password: personalPassword });
    await supabase
      .from('profiles')
      .update({ must_change_password: false })
      .eq('id', initialProfile.id);

    // 6. Verify must_change_password is now false
    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', initialProfile.id)
      .single();
    expect(updatedProfile.must_change_password).toBe(false);

    // 7. Sign out and verify old temporary password no longer works
    await supabase.auth.signOut();
    const oldPassAttempt = await supabase.auth.signInWithPassword({
      email: teacherEmail,
      password: temporaryPass,
    });
    expect(oldPassAttempt.error).not.toBeNull();

    // 8. Sign in with the new personal password succeeds
    const newPassAttempt = await supabase.auth.signInWithPassword({
      email: teacherEmail,
      password: personalPassword,
    });
    expect(newPassAttempt.error).toBeNull();
  });
});
