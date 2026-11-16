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

    const { materialId } = await req.json();

    if (!materialId) {
      return new Response(JSON.stringify({ error: 'Missing materialId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = getAdminClient();

    // 1. Fetch material metadata
    const { data: material, error: fetchErr } = await adminClient
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (fetchErr || !material) {
      return new Response(JSON.stringify({ error: 'Material not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check permission: must be admin OR the teacher who created it
    const isOwner = material.created_by === callerUser.id;
    const isAdmin = callerProfile.role === 'admin';

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to delete this material' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Delete file from Supabase Storage
    if (material.file_path) {
      const { error: storageErr } = await adminClient.storage
        .from('study-materials')
        .remove([material.file_path]);

      if (storageErr) {
        console.warn('Storage deletion warning (file might already be removed):', storageErr.message);
      }
    }

    // 4. Delete material record from database
    const { error: deleteDbErr } = await adminClient
      .from('materials')
      .delete()
      .eq('id', materialId);

    if (deleteDbErr) {
      return new Response(JSON.stringify({ error: 'Failed to delete material record: ' + deleteDbErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Audit log
    await logAuditEvent(callerUser.id, 'material_deleted', {
      material_id: materialId,
      title: material.title,
      file_path: material.file_path,
      deleted_by_role: callerProfile.role,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Material and storage file deleted successfully' }),
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
