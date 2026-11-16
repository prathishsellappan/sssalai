import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

export function getAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function verifyCaller(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || '';
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    throw new Error('Invalid or expired authentication token');
  }

  // Fetch verified profile from database using admin client to prevent any tampering
  const adminClient = getAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found for authenticated user');
  }

  if (!profile.is_active) {
    throw new Error('User account is deactivated');
  }

  return { user, profile };
}

export async function logAuditEvent(actorId: string | null, action: string, details: Record<string, unknown> = {}) {
  try {
    const adminClient = getAdminClient();
    await adminClient.from('audit_logs').insert({
      actor_id: actorId,
      action,
      details,
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
