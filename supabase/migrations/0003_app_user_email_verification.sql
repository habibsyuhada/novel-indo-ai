-- Email verification: registration no longer logs the user in immediately.
-- A verification link (token) must be clicked before login is allowed.

ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token text,
  ADD COLUMN IF NOT EXISTS verification_token_expires timestamp,
  ADD COLUMN IF NOT EXISTS verification_sent_at timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS app_user_verification_token_key
  ON app_user (verification_token)
  WHERE verification_token IS NOT NULL;
