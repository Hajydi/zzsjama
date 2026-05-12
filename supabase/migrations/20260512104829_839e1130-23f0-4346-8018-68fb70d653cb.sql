
-- Add lifetime access flag
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS has_lifetime_access BOOLEAN NOT NULL DEFAULT false;

-- Grant lifetime access to all currently existing users (you)
UPDATE public.subscriptions SET has_lifetime_access = true;

-- New signups: no trial. Create subscription row with status 'none'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, status, trial_ends_at)
  VALUES (NEW.id, 'none', NULL)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Update access check: lifetime users always have access; trialing removed for new flow but kept for backward-compat
CREATE OR REPLACE FUNCTION public.has_active_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND (
        has_lifetime_access = true
        OR (status = 'active' AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'trialing' AND trial_ends_at IS NOT NULL AND trial_ends_at > now())
      )
  );
$function$;
