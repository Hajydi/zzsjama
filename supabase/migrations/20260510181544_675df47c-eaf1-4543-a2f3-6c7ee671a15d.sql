
-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- =========================
-- SUBSCRIPTIONS (with 3-day trial)
-- =========================
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'expired');

CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  plan TEXT NOT NULL DEFAULT 'monthly_39_dkk',
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '3 days'),
  current_period_end TIMESTAMPTZ,
  paddle_subscription_id TEXT,
  paddle_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Helper: has active access (trial or active)
CREATE OR REPLACE FUNCTION public.has_active_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND (
        (status = 'trialing' AND trial_ends_at > now())
        OR (status = 'active' AND (current_period_end IS NULL OR current_period_end > now()))
      )
  );
$$;

-- =========================
-- CHILDREN
-- =========================
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  color TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_children_parent ON public.children(parent_user_id);

CREATE POLICY "Parents view own children" ON public.children FOR SELECT USING (auth.uid() = parent_user_id);
CREATE POLICY "Parents insert own children" ON public.children FOR INSERT WITH CHECK (auth.uid() = parent_user_id);
CREATE POLICY "Parents update own children" ON public.children FOR UPDATE USING (auth.uid() = parent_user_id);
CREATE POLICY "Parents delete own children" ON public.children FOR DELETE USING (auth.uid() = parent_user_id);

-- =========================
-- ACTIVITIES
-- =========================
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  duration_minutes INTEGER,
  points_reward INTEGER NOT NULL DEFAULT 10,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  scheduled_for DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activities_child ON public.activities(child_id);
CREATE INDEX idx_activities_parent ON public.activities(parent_user_id);

CREATE POLICY "Parents view own activities" ON public.activities FOR SELECT USING (auth.uid() = parent_user_id);
CREATE POLICY "Parents insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = parent_user_id);
CREATE POLICY "Parents update own activities" ON public.activities FOR UPDATE USING (auth.uid() = parent_user_id);
CREATE POLICY "Parents delete own activities" ON public.activities FOR DELETE USING (auth.uid() = parent_user_id);

-- =========================
-- REWARDS
-- =========================
CREATE TABLE public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  cost_points INTEGER NOT NULL CHECK (cost_points > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_rewards_parent ON public.rewards(parent_user_id);

CREATE POLICY "Parents view own rewards" ON public.rewards FOR SELECT USING (auth.uid() = parent_user_id);
CREATE POLICY "Parents insert own rewards" ON public.rewards FOR INSERT WITH CHECK (auth.uid() = parent_user_id);
CREATE POLICY "Parents update own rewards" ON public.rewards FOR UPDATE USING (auth.uid() = parent_user_id);
CREATE POLICY "Parents delete own rewards" ON public.rewards FOR DELETE USING (auth.uid() = parent_user_id);

-- =========================
-- REWARD REDEMPTIONS
-- =========================
CREATE TABLE public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_redemptions_child ON public.reward_redemptions(child_id);
CREATE INDEX idx_redemptions_parent ON public.reward_redemptions(parent_user_id);

CREATE POLICY "Parents view own redemptions" ON public.reward_redemptions FOR SELECT USING (auth.uid() = parent_user_id);
CREATE POLICY "Parents insert own redemptions" ON public.reward_redemptions FOR INSERT WITH CHECK (auth.uid() = parent_user_id);
CREATE POLICY "Parents delete own redemptions" ON public.reward_redemptions FOR DELETE USING (auth.uid() = parent_user_id);

-- =========================
-- TIMESTAMP TRIGGER
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_children_updated BEFORE UPDATE ON public.children FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_activities_updated BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rewards_updated BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- AUTO-CREATE PROFILE + TRIAL ON SIGNUP
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, status, trial_ends_at)
  VALUES (NEW.id, 'trialing', now() + INTERVAL '3 days')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- POINTS AUTOMATION
-- =========================
-- Add points when activity gets completed
CREATE OR REPLACE FUNCTION public.handle_activity_completion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.completed = true AND COALESCE(OLD.completed, false) = false THEN
    NEW.completed_at := now();
    UPDATE public.children SET total_points = total_points + NEW.points_reward WHERE id = NEW.child_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.completed = false AND OLD.completed = true THEN
    NEW.completed_at := NULL;
    UPDATE public.children SET total_points = GREATEST(0, total_points - OLD.points_reward) WHERE id = NEW.child_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_activity_completion
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_activity_completion();

-- Deduct points when reward is redeemed; block if insufficient
CREATE OR REPLACE FUNCTION public.handle_reward_redemption()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_points INTEGER;
BEGIN
  SELECT total_points INTO current_points FROM public.children WHERE id = NEW.child_id FOR UPDATE;
  IF current_points IS NULL THEN
    RAISE EXCEPTION 'Child not found';
  END IF;
  IF current_points < NEW.points_spent THEN
    RAISE EXCEPTION 'Ikke nok point: barnet har % point, men belønningen koster %', current_points, NEW.points_spent;
  END IF;
  UPDATE public.children SET total_points = total_points - NEW.points_spent WHERE id = NEW.child_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reward_redemption
  BEFORE INSERT ON public.reward_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_reward_redemption();
