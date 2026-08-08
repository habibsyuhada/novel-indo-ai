-- Username (app_user.name) must be unique once the register form starts collecting it.
-- Existing rows (if any) have name = NULL, which is allowed multiple times under a
-- standard unique index in Postgres (NULLs are not considered equal to each other).

CREATE UNIQUE INDEX IF NOT EXISTS app_user_name_key ON app_user (name);
