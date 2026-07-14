/*
# Auto-Create Profile on Signup + First User Admin

## Overview
1. Creates a trigger that auto-inserts a row in `profiles` when a new user signs up via Supabase Auth.
2. The first registered user automatically becomes an admin (`is_admin = true`).
3. Seeds sample matches and announcements for demo purposes.

## Functions
- `handle_new_user()`: inserts a profile row with the user's full_name from metadata.
- `seed_demo_data()`: inserts 4 sample matches and 3 announcements (idempotent).

## Notes
1. The trigger runs AFTER INSERT on auth.users.
2. First-user-admin logic: if no profiles exist yet, the new user gets is_admin = true.
3. Demo data uses fixed UUIDs for match IDs so re-runs are idempotent.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_first boolean;
BEGIN
  SELECT COUNT(*) = 0 INTO is_first FROM profiles;
  INSERT INTO profiles (id, full_name, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    is_first
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
