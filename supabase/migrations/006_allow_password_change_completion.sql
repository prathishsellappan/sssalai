-- ====================================================================
-- Migration: 006_allow_password_change_completion.sql
-- Description: Allow users to clear must_change_password upon changing password
-- ====================================================================

-- 1. Create secure SECURITY DEFINER function to clear must_change_password for the caller
CREATE OR REPLACE FUNCTION public.complete_first_time_password_change()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET must_change_password = FALSE
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.complete_first_time_password_change() TO authenticated;

-- 2. Grant permission on column and configure RLS policy as fallback
GRANT UPDATE (must_change_password) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Users can clear their own must_change_password" ON public.profiles;
CREATE POLICY "Users can clear their own must_change_password"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
