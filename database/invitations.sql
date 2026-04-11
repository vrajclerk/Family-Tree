-- ============================================
-- Invitations System Schema Update
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS family_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'contributor', 'viewer')),
  invited_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- Anyone can read an invite if they have the UUID link
CREATE POLICY family_invitations_select ON family_invitations
  FOR SELECT USING (true);

-- Only Owners and Admins can create an invite
CREATE POLICY family_invitations_insert ON family_invitations
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND accepted = true
    )
  );

-- Only Owners and Admins OR the person accepting (any authenticated user) can delete it
CREATE POLICY family_invitations_delete ON family_invitations
  FOR DELETE USING (
    -- The person who generated it or another admin
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND accepted = true
    )
    OR 
    -- Any logged-in user can delete an invite (this is used when they 'consume' the invite to join)
    auth.uid() IS NOT NULL
  );
