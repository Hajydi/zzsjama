
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_activity_completion() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_reward_redemption() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_active_access(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_active_access(uuid) TO authenticated;
