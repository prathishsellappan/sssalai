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

    const { teacherId, isActive } = await req.json();

    if (!teacherId || typeof isActive !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Missing teacherId or isActive boolean flag' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = getAdminClient();

    // Verify target is teacher
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

    // Update active status
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', teacherId);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If deactivating, ban or invalidate sessions
    if (!isActive) {
      // Invalidate sessions via admin signOut / banUser
      await adminClient.auth.admin.signOut(teacherId).catch(() => {});
    }

    await logAuditEvent(callerUser.id, isActive ? 'teacher_activated' : 'teacher_deactivated', {
      teacher_id: teacherId,
      email: targetProfile.email,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Teacher ${isActive ? 'activated' : 'deactivated'} successfully`,
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
