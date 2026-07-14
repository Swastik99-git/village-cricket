/*
# Enhance Announcements Table

## Overview
Adds category, priority, created_by, and expires_at columns to the existing announcements table.
Updates RLS policies so all authenticated users can read, but only admins can insert/update/delete.

## Modified Tables
### announcements (added columns)
- `category` (text, NOT NULL, default 'general') — one of: match, tournament, general, urgent
- `priority` (text, NOT NULL, default 'medium') — one of: low, medium, high
- `created_by` (uuid, nullable, FK to profiles ON DELETE SET NULL) — tracks who created the announcement
- `expires_at` (timestamptz, nullable) — optional expiry date

## Security
- SELECT: all authenticated users (TO authenticated USING (true)) — announcements are shared content
- INSERT: only admins (WITH CHECK checks profiles.is_admin)
- UPDATE: only admins
- DELETE: only admins

## Notes
1. All columns use ADD COLUMN IF NOT EXISTS for idempotency.
2. Existing rows get 'general' category and 'medium' priority by default.
3. Policies are dropped and recreated to update from the original author_id-based policies.
*/

-- Add new columns
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Add index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);

-- Drop old policies
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
DROP POLICY IF EXISTS "announcements_insert_admin" ON announcements;
DROP POLICY IF EXISTS "announcements_update_admin" ON announcements;
DROP POLICY IF EXISTS "announcements_delete_admin" ON announcements;
DROP POLICY IF EXISTS "Anyone can read announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can insert announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admin can delete announcements" ON announcements;

-- Recreate policies: everyone (authenticated) can read, only admins can write
CREATE POLICY "announcements_select_all" ON announcements FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "announcements_insert_admin" ON announcements FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "announcements_update_admin" ON announcements FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

CREATE POLICY "announcements_delete_admin" ON announcements FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );
