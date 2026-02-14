-- ============================================
-- MIGRATION: Fix RLS infinite recursion on family_memberships
-- Run this in Supabase SQL Editor to fix the infinite recursion error
-- ============================================

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS family_access ON families;
DROP POLICY IF EXISTS families_select ON families;
DROP POLICY IF EXISTS families_insert ON families;
DROP POLICY IF EXISTS families_update ON families;
DROP POLICY IF EXISTS families_delete ON families;

DROP POLICY IF EXISTS family_members_access ON family_members;
DROP POLICY IF EXISTS family_members_select ON family_members;
DROP POLICY IF EXISTS family_members_insert ON family_members;
DROP POLICY IF EXISTS family_members_update ON family_members;
DROP POLICY IF EXISTS family_members_delete ON family_members;

DROP POLICY IF EXISTS relationships_access ON relationships;
DROP POLICY IF EXISTS relationships_select ON relationships;
DROP POLICY IF EXISTS relationships_insert ON relationships;
DROP POLICY IF EXISTS relationships_delete ON relationships;

DROP POLICY IF EXISTS family_memberships_access ON family_memberships;
DROP POLICY IF EXISTS family_memberships_select ON family_memberships;
DROP POLICY IF EXISTS family_memberships_insert ON family_memberships;
DROP POLICY IF EXISTS family_memberships_update ON family_memberships;
DROP POLICY IF EXISTS family_memberships_delete ON family_memberships;

DROP POLICY IF EXISTS family_history_access ON family_history;
DROP POLICY IF EXISTS family_history_select ON family_history;
DROP POLICY IF EXISTS family_history_insert ON family_history;
DROP POLICY IF EXISTS family_history_update ON family_history;
DROP POLICY IF EXISTS family_history_delete ON family_history;

DROP POLICY IF EXISTS audit_log_select ON audit_log;
DROP POLICY IF EXISTS audit_log_insert ON audit_log;

-- Step 2: Enable RLS on tables that might not have it yet
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS policies
-- ============================================
CREATE POLICY users_select ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_update ON users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- FAMILY MEMBERSHIPS policies (FIXED - no infinite recursion!)
-- The key fix: SELECT uses direct user_id check, not a subquery on itself
-- ============================================
CREATE POLICY family_memberships_select ON family_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY family_memberships_insert ON family_memberships FOR INSERT
  WITH CHECK (
    -- Owner can insert their own membership when creating a family
    (user_id = auth.uid())
    OR
    -- Admins/Owners can invite others
    EXISTS (
      SELECT 1 FROM family_memberships fm
      WHERE fm.family_id = family_memberships.family_id
        AND fm.user_id = auth.uid()
        AND fm.accepted = true
        AND fm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY family_memberships_update ON family_memberships FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM family_memberships fm
      WHERE fm.family_id = family_memberships.family_id
        AND fm.user_id = auth.uid()
        AND fm.accepted = true
        AND fm.role = 'owner'
    )
  );

CREATE POLICY family_memberships_delete ON family_memberships FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM family_memberships fm
      WHERE fm.family_id = family_memberships.family_id
        AND fm.user_id = auth.uid()
        AND fm.accepted = true
        AND fm.role = 'owner'
    )
  );

-- ============================================
-- FAMILIES policies
-- ============================================
CREATE POLICY families_select ON families FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
    )
  );

CREATE POLICY families_insert ON families FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY families_update ON families FOR UPDATE
  USING (
    owner_user_id = auth.uid()
    OR id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY families_delete ON families FOR DELETE
  USING (owner_user_id = auth.uid());

-- ============================================
-- PERSONS policies
-- ============================================
DROP POLICY IF EXISTS persons_select ON persons;
DROP POLICY IF EXISTS persons_insert ON persons;
DROP POLICY IF EXISTS persons_update ON persons;

CREATE POLICY persons_select ON persons FOR SELECT
  USING (true);

CREATE POLICY persons_insert ON persons FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY persons_update ON persons FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- FAMILY MEMBERS policies
-- ============================================
CREATE POLICY family_members_select ON family_members FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
    )
  );

CREATE POLICY family_members_insert ON family_members FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
        AND role IN ('owner', 'admin', 'contributor')
    )
  );

CREATE POLICY family_members_update ON family_members FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
        AND role IN ('owner', 'admin', 'contributor')
    )
  );

CREATE POLICY family_members_delete ON family_members FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- RELATIONSHIPS policies
-- ============================================
CREATE POLICY relationships_select ON relationships FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
    )
  );

CREATE POLICY relationships_insert ON relationships FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
        AND role IN ('owner', 'admin', 'contributor')
    )
  );

CREATE POLICY relationships_delete ON relationships FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- FAMILY HISTORY policies
-- ============================================
CREATE POLICY family_history_select ON family_history FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
    )
  );

CREATE POLICY family_history_insert ON family_history FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
        AND role IN ('owner', 'admin', 'contributor')
    )
  );

CREATE POLICY family_history_update ON family_history FOR UPDATE
  USING (
    created_by = auth.uid()
    OR family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY family_history_delete ON family_history FOR DELETE
  USING (
    created_by = auth.uid()
    OR family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================
-- AUDIT LOG policies
-- ============================================
CREATE POLICY audit_log_select ON audit_log FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_memberships
      WHERE user_id = auth.uid() AND accepted = true
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY audit_log_insert ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- Fix audit trigger function
-- The old version crashed on the 'families' table (no family_id column)
-- and on DELETE operations (NEW is NULL)
-- ============================================
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id uuid;
  v_entity_id uuid;
  v_record RECORD;
BEGIN
  -- Use NEW for INSERT/UPDATE, OLD for DELETE
  IF TG_OP = 'DELETE' THEN
    v_record := OLD;
  ELSE
    v_record := NEW;
  END IF;

  v_entity_id := v_record.id;

  -- For the 'families' table, the row's own id IS the family_id
  -- For other tables (family_members, relationships), use family_id column
  IF TG_TABLE_NAME = 'families' THEN
    v_family_id := v_record.id;
  ELSE
    v_family_id := v_record.family_id;
  END IF;

  INSERT INTO audit_log (family_id, user_id, action, entity_type, entity_id, changes)
  VALUES (
    v_family_id,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    v_entity_id,
    CASE
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
      ELSE jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;
