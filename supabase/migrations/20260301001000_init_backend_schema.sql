CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS embeddings vector(384);
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_site_id ON documents(site_id);

ALTER TABLE IF EXISTS sites ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 50;
ALTER TABLE IF EXISTS sites ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'amber' CHECK(risk_level IN ('low', 'amber', 'red'));
ALTER TABLE IF EXISTS sites ADD COLUMN IF NOT EXISTS risk_assessment JSONB;
ALTER TABLE IF EXISTS sites ADD COLUMN IF NOT EXISTS estimated_units INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS sites ADD COLUMN IF NOT EXISTS estimated_gdv NUMERIC DEFAULT 0;
ALTER TABLE IF EXISTS sites ADD COLUMN IF NOT EXISTS floor_area_sqm INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS sites ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'rejected', 'pending'));

CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_risk_level ON sites(risk_level);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);

CREATE TABLE IF NOT EXISTS shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  recipient_email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);
CREATE INDEX IF NOT EXISTS idx_shares_site_id ON shares(site_id);
CREATE INDEX IF NOT EXISTS idx_shares_expires_at ON shares(expires_at);

CREATE TABLE IF NOT EXISTS share_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_share_views_share_id ON share_views(share_id);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_site_id ON activity_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan_tier TEXT DEFAULT 'free' CHECK(plan_tier IN ('free', 'starter', 'pro', 'enterprise')),
  status TEXT CHECK(status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  usage_documents INTEGER DEFAULT 0,
  usage_sites INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_tier ON user_subscriptions(plan_tier);

CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK(alert_type IN ('new_applications', 'policy_changes', 'deadline_alerts')),
  frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')),
  regions TEXT[] NOT NULL,
  email TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_user_id ON alert_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_enabled ON alert_subscriptions(enabled);

CREATE TABLE IF NOT EXISTS preapp_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'ready', 'archived')),
  version INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_preapp_packs_site_id ON preapp_packs(site_id);
CREATE INDEX IF NOT EXISTS idx_preapp_packs_status ON preapp_packs(status);

CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);

ALTER TABLE IF EXISTS planning_constraints ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium' CHECK(severity IN ('high', 'medium', 'low'));

CREATE INDEX IF NOT EXISTS idx_planning_constraints_site_id ON planning_constraints(site_id);
CREATE INDEX IF NOT EXISTS idx_planning_constraints_type ON planning_constraints(type);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE preapp_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shares are public via token" ON shares
  FOR SELECT USING (TRUE);

CREATE POLICY "Users can create shares for their sites" ON shares
  FOR INSERT WITH CHECK (EXISTS(
    SELECT 1 FROM sites WHERE sites.id = site_id AND sites.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own alerts" ON alert_subscriptions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view packs for their sites" ON preapp_packs
  FOR SELECT USING (EXISTS(
    SELECT 1 FROM sites WHERE sites.id = site_id AND sites.user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own activity logs" ON activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
  FOR SELECT USING (user_id = auth.uid());
