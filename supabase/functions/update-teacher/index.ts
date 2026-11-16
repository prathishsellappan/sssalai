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

    if (callerProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { teacherId, displayName, newPassword, resetPasswordFlag } = await req.json();

    if (!teacherId) {
      return new Response(JSON.stringify({ error: 'Missing teacherId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = getAdminClient();

    // Verify teacher exists and is teacher role
    const { data: targetProfile, error: targetError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single();

    if (targetError || !targetProfile) {
      return new Response(JSON.stringify({ error: 'Teacher not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updates: Record<string, unknown> = {};

    if (displayName && typeof displayName === 'string') {
      updates.display_name = displayName.trim();
    }

    if (resetPasswordFlag !== undefined) {
      updates.must_change_password = Boolean(resetPasswordFlag);
    }

    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 8) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(teacherId, {
        password: newPassword,
      });

      if (authUpdateError) {
        return new Response(JSON.stringify({ error: 'Failed to update auth password: ' + authUpdateError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      updates.must_change_password = true; // Force password change upon admin reset
    }

    if (Object.keys(updates).length > 0) {
      const { error: profileUpdateError } = await adminClient
        .from('profiles')
        .update(updates)
        .eq('id', teacherId);

      if (profileUpdateError) {
        return new Response(JSON.stringify({ error: profileUpdateError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    await logAuditEvent(callerUser.id, 'teacher_updated', {
      teacher_id: teacherId,
      updated_fields: Object.keys(updates),
      password_reset: Boolean(newPassword),
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Teacher profile updated successfully' }),
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
