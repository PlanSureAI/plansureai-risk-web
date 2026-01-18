-- Add beta_mode column to track testing phase
ALTER TABLE tier_features
ADD COLUMN IF NOT EXISTS beta_mode BOOLEAN DEFAULT false;

-- Set all paid tiers to beta mode
UPDATE tier_features
SET beta_mode = true
WHERE tier IN ('starter', 'pro');

-- Create function to block paid upgrades during beta
CREATE OR REPLACE FUNCTION prevent_paid_upgrades_during_beta()
RETURNS TRIGGER AS $$
DECLARE
  v_beta_mode BOOLEAN;
BEGIN
  -- Check if target tier is in beta mode
  SELECT beta_mode INTO v_beta_mode
  FROM tier_features
  WHERE tier = NEW.tier;

  -- Block if trying to upgrade to beta tier (unless coming from Stripe webhook)
  IF v_beta_mode = true AND NEW.tier != 'free' THEN
    -- Allow if this is a Stripe webhook update (has stripe_subscription_id)
    IF NEW.stripe_subscription_id IS NULL THEN
      RAISE EXCEPTION 'Paid subscriptions are not yet available. Please check back soon!';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_beta_mode ON user_subscriptions;
CREATE TRIGGER check_beta_mode
  BEFORE INSERT OR UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_paid_upgrades_during_beta();

-- When ready to go live, run this:
-- UPDATE tier_features SET beta_mode = false WHERE tier IN ('starter', 'pro');
