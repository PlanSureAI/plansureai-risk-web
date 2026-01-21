-- Reconcile legacy user_subscriptions schema with Stripe-based columns.

ALTER TABLE user_subscriptions
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS projects_limit INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS projects_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
      AND column_name = 'plan_tier'
  ) THEN
    UPDATE user_subscriptions
    SET tier = COALESCE(tier, plan_tier)
    WHERE tier IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
      AND column_name = 'usage_sites'
  ) THEN
    UPDATE user_subscriptions
    SET projects_used = COALESCE(projects_used, usage_sites)
    WHERE projects_used IS NULL;
  END IF;
END $$;

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'user_subscriptions'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'user_subscriptions'
      AND con.contype = 'c'
      AND con.conname = 'user_subscriptions_status_check'
  ) THEN
    ALTER TABLE user_subscriptions
      ADD CONSTRAINT user_subscriptions_status_check
      CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
