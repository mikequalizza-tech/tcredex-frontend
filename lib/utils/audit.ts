import { getSupabaseAdmin } from '@/lib/supabase';

interface AuditEvent {
  action: string;
  userId?: string | null;
  orgId?: string | null;
  role?: string | null;
  projectId?: string | null;
}

export async function recordAuditEvent(event: AuditEvent) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('audit_log').insert({
      user_id: event.userId || null,
      org_id: event.orgId || null,
      role: event.role || null,
      project_id: event.projectId || null,
      action: event.action,
    } as never);
  } catch (error) {
    console.error('[Audit] Failed to record event', error);
  }
}
