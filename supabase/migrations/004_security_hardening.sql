-- ====================================================================
-- Migration: 004_security_hardening.sql
-- Description: Security hardening, search_path isolation, grants and revocations
-- ====================================================================

-- 1. Ensure public schema security
REVOKE ALL ON SCHEMA public FROM public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.form_links TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;

-- Prevent anonymous user access to study portal data
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Explicitly revoke profile modifications from ordinary authenticated role
REVOKE UPDATE, INSERT, DELETE ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Function to safely log audit events from database actions
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_actor_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (actor_id, action, details)
    VALUES (p_actor_id, p_action, p_details)
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to log material status changes
CREATE OR REPLACE FUNCTION public.audit_material_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.log_audit_event('material_created', jsonb_build_object('material_id', NEW.id, 'title', NEW.title, 'status', NEW.status), NEW.created_by);
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status <> NEW.status) THEN
            PERFORM public.log_audit_event('material_status_changed', jsonb_build_object('material_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status), auth.uid());
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.log_audit_event('material_deleted', jsonb_build_object('material_id', OLD.id, 'title', OLD.title), auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_audit_materials
AFTER INSERT OR UPDATE OR DELETE ON public.materials
FOR EACH ROW EXECUTE FUNCTION public.audit_material_changes();

-- Trigger to log form link changes
CREATE OR REPLACE FUNCTION public.audit_form_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        PERFORM public.log_audit_event('form_created', jsonb_build_object('form_id', NEW.id, 'title', NEW.title, 'status', NEW.status), NEW.created_by);
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.status <> NEW.status) THEN
            PERFORM public.log_audit_event('form_status_changed', jsonb_build_object('form_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status), auth.uid());
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        PERFORM public.log_audit_event('form_deleted', jsonb_build_object('form_id', OLD.id, 'title', OLD.title), auth.uid());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_audit_forms
AFTER INSERT OR UPDATE OR DELETE ON public.form_links
FOR EACH ROW EXECUTE FUNCTION public.audit_form_changes();
