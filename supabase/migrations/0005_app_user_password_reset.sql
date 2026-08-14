-- Forgot password: lets a user request a reset link and set a new password via a
-- time-limited token, mirroring the email-verification-token pattern.

ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS password_reset_token text,
  ADD COLUMN IF NOT EXISTS password_reset_token_expires timestamp,
  ADD COLUMN IF NOT EXISTS password_reset_sent_at timestamp;

CREATE UNIQUE INDEX IF NOT EXISTS app_user_password_reset_token_key
  ON app_user (password_reset_token)
  WHERE password_reset_token IS NOT NULL;
