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

    const { email, displayName, temporaryPassword } = await req.json();

    if (!email || !displayName || !temporaryPassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, displayName, temporaryPassword' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof temporaryPassword !== 'string' || temporaryPassword.length < 8) {
      return new Response(JSON.stringify({ error: 'Temporary password must be at least 8 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = getAdminClient();

    // 1. Create Auth User
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { display_name: displayName.trim() },
    });

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: authError?.message || 'Failed to create auth user' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = authData.user.id;

    // 2. Insert into profiles table with role=teacher, must_change_password=true
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: newUserId,
      email: email.trim().toLowerCase(),
      display_name: displayName.trim(),
      role: 'teacher',
      is_active: true,
      must_change_password: true,
    });

    if (profileError) {
      // Compensating action: delete the created auth user
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: 'Failed to create teacher profile: ' + profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Log Audit Record
    await logAuditEvent(callerUser.id, 'teacher_created', {
      teacher_id: newUserId,
      email: email.trim().toLowerCase(),
      display_name: displayName.trim(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        teacher: {
          id: newUserId,
          email: email.trim().toLowerCase(),
          displayName: displayName.trim(),
          role: 'teacher',
          must_change_password: true,
        },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
