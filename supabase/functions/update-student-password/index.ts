import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../shared/cors.ts';
import { getAdminClient, verifyCaller, logAuditEvent } from '../shared/auth.ts';

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { user: callerUser, profile: callerProfile } = await verifyCaller(req);

    // Only admin or teacher can update student password
    if (callerProfile.role !== 'admin' && callerProfile.role !== 'teacher') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin or Teacher access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 12) {
      return new Response(
        JSON.stringify({ error: 'New password is required and must be at least 12 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClient = getAdminClient();

    // Find the single shared student user account
    let studentUserId = Deno.env.get('STUDENT_AUTH_USER_ID');

    if (!studentUserId) {
      // Look up student user id from profiles table
      const { data: studentProfile, error: profileErr } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('role', 'student')
        .maybeSingle();

      if (profileErr || !studentProfile) {
        return new Response(
          JSON.stringify({ error: 'Shared student account not configured in profiles' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      studentUserId = studentProfile.id;
    }

    // 1. Update password using Auth Admin API
    const { error: updateAuthErr } = await adminClient.auth.admin.updateUserById(studentUserId, {
      password: newPassword,
    });

    if (updateAuthErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to update student password: ' + updateAuthErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Revoke/invalidate old student sessions so all lab PCs must re-authenticate with new password
    await adminClient.auth.admin.signOut(studentUserId).catch((err) => {
      console.warn('Session revocation notice:', err);
    });

    // 3. Audit log (Never log the actual password!)
    await logAuditEvent(callerUser.id, 'student_password_changed', {
      student_user_id: studentUserId,
      changed_by_role: callerProfile.role,
      changed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Shared student password updated successfully and active sessions invalidated',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
