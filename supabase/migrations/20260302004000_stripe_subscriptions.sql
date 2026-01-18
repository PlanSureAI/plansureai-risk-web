-- Stripe Subscriptions Schema
-- Manages user tiers, subscriptions, and payment tracking

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,

    -- Stripe details
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,

    -- Tier & status
    tier TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',

    -- Subscription dates
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,

    -- Usage limits
    projects_limit INTEGER DEFAULT 1,
    projects_used INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_tier CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete'))
);

-- Payment history table
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_subscriptions(user_id),

    -- Stripe details
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT,

    -- Payment info
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    status TEXT NOT NULL,

    -- Metadata
    description TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded'))
);

-- Tier features configuration (for easy feature gating)
CREATE TABLE IF NOT EXISTS tier_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier TEXT NOT NULL UNIQUE,

    -- Project limits
    projects_limit INTEGER NOT NULL,

    -- Feature access
    full_mitigation_plans BOOLEAN DEFAULT false,
    full_comparable_analysis BOOLEAN DEFAULT false,
    policy_citations BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    api_access BOOLEAN DEFAULT false,

    -- Monthly price in pence
    price_monthly INTEGER NOT NULL,
    stripe_price_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_tier CHECK (tier IN ('free', 'starter', 'pro', 'enterprise'))
);

-- Insert tier configurations
INSERT INTO tier_features (
  tier,
  projects_limit,
  full_mitigation_plans,
  full_comparable_analysis,
  policy_citations,
  priority_support,
  api_access,
  price_monthly,
  stripe_price_id
) VALUES
('free', 1, false, false, true, false, false, 0, NULL),
('starter', 10, true, true, true, false, false, 4900, NULL),
('pro', -1, true, true, true, true, true, 14900, NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON user_subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history(created_at DESC);

-- Function to create subscription for new user
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_subscriptions (user_id, tier, status, projects_limit)
    VALUES (NEW.id, 'free', 'active', 1);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create FREE subscription for new users
CREATE TRIGGER create_subscription_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_subscription();

-- Function to check if user can create project
CREATE OR REPLACE FUNCTION can_create_project(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_limit INTEGER;
    v_used INTEGER;
BEGIN
    SELECT projects_limit, projects_used
    INTO v_limit, v_used
    FROM user_subscriptions
    WHERE user_id = p_user_id;

    IF v_limit = -1 THEN
        RETURN true;
    END IF;

    RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to increment project usage
CREATE OR REPLACE FUNCTION increment_project_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE user_subscriptions
    SET projects_used = projects_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's current tier features
CREATE OR REPLACE FUNCTION get_user_tier_features(p_user_id UUID)
RETURNS tier_features AS $$
DECLARE
    v_tier TEXT;
    v_features tier_features;
BEGIN
    SELECT tier INTO v_tier
    FROM user_subscriptions
    WHERE user_id = p_user_id;

    SELECT * INTO v_features
    FROM tier_features
    WHERE tier = v_tier;

    RETURN v_features;
END;
$$ LANGUAGE plpgsql;

-- Function to handle Stripe webhook events
CREATE OR REPLACE FUNCTION handle_stripe_webhook(
    p_user_id UUID,
    p_event_type TEXT,
    p_subscription_id TEXT,
    p_customer_id TEXT,
    p_price_id TEXT,
    p_status TEXT,
    p_current_period_start TIMESTAMPTZ,
    p_current_period_end TIMESTAMPTZ
)
RETURNS VOID AS $$
DECLARE
    v_tier TEXT;
    v_projects_limit INTEGER;
BEGIN
    SELECT tier, projects_limit INTO v_tier, v_projects_limit
    FROM tier_features
    WHERE stripe_price_id = p_price_id;

    IF v_tier IS NULL THEN
        v_tier := 'free';
        v_projects_limit := 1;
    END IF;

    INSERT INTO user_subscriptions (
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        tier,
        status,
        current_period_start,
        current_period_end,
        projects_limit,
        updated_at
    ) VALUES (
        p_user_id,
        p_customer_id,
        p_subscription_id,
        p_price_id,
        v_tier,
        p_status,
        p_current_period_start,
        p_current_period_end,
        v_projects_limit,
        NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        stripe_customer_id = EXCLUDED.stripe_customer_id,
        stripe_subscription_id = EXCLUDED.stripe_subscription_id,
        stripe_price_id = EXCLUDED.stripe_price_id,
        tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        projects_limit = EXCLUDED.projects_limit,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users read own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users read own payments" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public read tier features" ON tier_features
    FOR SELECT USING (true);

CREATE POLICY "Service manage subscriptions" ON user_subscriptions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service manage payments" ON payment_history
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON user_subscriptions TO postgres, service_role;
GRANT SELECT ON user_subscriptions TO anon, authenticated;
GRANT ALL ON payment_history TO postgres, service_role;
GRANT SELECT ON payment_history TO authenticated;
GRANT SELECT ON tier_features TO anon, authenticated;

-- IMPORTANT: Update these Stripe Price IDs after creating products in Stripe
-- UPDATE tier_features SET stripe_price_id = 'price_xxx' WHERE tier = 'starter';
-- UPDATE tier_features SET stripe_price_id = 'price_yyy' WHERE tier = 'pro';
