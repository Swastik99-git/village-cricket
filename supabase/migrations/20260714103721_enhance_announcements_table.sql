

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
