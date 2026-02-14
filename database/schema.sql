-- ============================================
-- Family Tree App — Complete Database Schema
-- Run this after dropping all existing tables
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  owner_password_hash text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  normalized_name text NOT NULL,
  birth_date date,
  death_date date,
  gender text CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  occupation text,
  photo_url text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  person_id uuid REFERENCES persons(id) ON DELETE CASCADE,
  display_name text,
  notes text,
  is_living boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (family_id, person_id)
);

CREATE TABLE relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  parent_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  child_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  relation_type text DEFAULT 'biological' CHECK (relation_type IN ('biological', 'adopted', 'step', 'foster')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_parent CHECK (parent_member_id != child_member_id)
);

CREATE TABLE family_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'contributor', 'viewer')),
  accepted boolean DEFAULT false,
  invited_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (family_id, user_id)
);

CREATE TABLE family_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  media jsonb DEFAULT '[]'::jsonb,
  event_date date,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid REFERENCES families(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_persons_name_trgm ON persons USING gin (normalized_name gin_trgm_ops);
CREATE INDEX idx_persons_canonical_name ON persons (canonical_name);
CREATE INDEX idx_persons_birth_date ON persons (birth_date);

CREATE INDEX idx_family_members_family ON family_members (family_id);
CREATE INDEX idx_family_members_person ON family_members (person_id);

CREATE INDEX idx_relationships_parent ON relationships (parent_member_id);
CREATE INDEX idx_relationships_child ON relationships (child_member_id);
CREATE INDEX idx_relationships_family ON relationships (family_id);

CREATE INDEX idx_family_memberships_user ON family_memberships (user_id);
CREATE INDEX idx_family_memberships_family ON family_memberships (family_id);

CREATE INDEX idx_family_history_family ON family_history (family_id);
CREATE INDEX idx_family_history_member ON family_history (member_id);
CREATE INDEX idx_family_history_date ON family_history (event_date);

CREATE INDEX idx_audit_log_family ON audit_log (family_id);
CREATE INDEX idx_audit_log_user ON audit_log (user_id);
CREATE INDEX idx_audit_log_created ON audit_log (created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY users_select ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_update ON users FOR UPDATE
  USING (auth.uid() = id);

-- FAMILY MEMBERSHIPS (SELECT uses direct check — no self-referencing subquery)
CREATE POLICY family_memberships_select ON family_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY family_memberships_insert ON family_memberships FOR INSERT
  WITH CHECK (
    (user_id = auth.uid())
    OR
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

-- FAMILIES
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

-- PERSONS
CREATE POLICY persons_select ON persons FOR SELECT
  USING (true);

CREATE POLICY persons_insert ON persons FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY persons_update ON persons FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- FAMILY MEMBERS
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

-- RELATIONSHIPS
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

-- FAMILY HISTORY
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

-- AUDIT LOG
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
-- FUNCTIONS
-- ============================================

-- Duplicate detection
CREATE OR REPLACE FUNCTION find_similar_persons(
  search_name text,
  search_birth_date date DEFAULT NULL,
  similarity_threshold float DEFAULT 0.6
)
RETURNS TABLE (
  person_id uuid,
  person_name text,
  person_birth_date date,
  similarity_score float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.canonical_name,
    p.birth_date,
    (
      similarity(p.normalized_name, lower(trim(search_name))) * 0.6 +
      CASE
        WHEN search_birth_date IS NOT NULL AND p.birth_date = search_birth_date THEN 0.3
        ELSE 0
      END
    ) AS score
  FROM persons p
  WHERE
    similarity(p.normalized_name, lower(trim(search_name))) > similarity_threshold
    OR p.normalized_name = lower(trim(search_name))
  ORDER BY score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Ancestors
CREATE OR REPLACE FUNCTION get_ancestors(member_id_param uuid)
RETURNS TABLE (id uuid, person_id uuid, display_name text, generation int) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE ancestors AS (
    SELECT fm.id, fm.person_id, fm.display_name, 0 as generation
    FROM family_members fm WHERE fm.id = member_id_param
    UNION
    SELECT fm.id, fm.person_id, fm.display_name, a.generation + 1
    FROM family_members fm
    JOIN relationships r ON r.parent_member_id = fm.id
    JOIN ancestors a ON r.child_member_id = a.id
  )
  SELECT * FROM ancestors WHERE generation > 0;
END;
$$ LANGUAGE plpgsql;

-- Descendants
CREATE OR REPLACE FUNCTION get_descendants(member_id_param uuid)
RETURNS TABLE (id uuid, person_id uuid, display_name text, generation int) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE descendants AS (
    SELECT fm.id, fm.person_id, fm.display_name, 0 as generation
    FROM family_members fm WHERE fm.id = member_id_param
    UNION
    SELECT fm.id, fm.person_id, fm.display_name, d.generation + 1
    FROM family_members fm
    JOIN relationships r ON r.child_member_id = fm.id
    JOIN descendants d ON r.parent_member_id = d.id
  )
  SELECT * FROM descendants WHERE generation > 0;
END;
$$ LANGUAGE plpgsql;

-- Prevent circular relationships
CREATE OR REPLACE FUNCTION prevent_circular_relationships()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT parent_member_id as id FROM relationships
      WHERE child_member_id = NEW.parent_member_id
      UNION
      SELECT r.parent_member_id FROM relationships r
      JOIN ancestors a ON r.child_member_id = a.id
    )
    SELECT 1 FROM ancestors WHERE id = NEW.child_member_id
  ) THEN
    RAISE EXCEPTION 'This relationship would create a circular dependency';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_circular_relationships
  BEFORE INSERT OR UPDATE ON relationships
  FOR EACH ROW EXECUTE FUNCTION prevent_circular_relationships();

-- Audit logging (handles families table + DELETE operations correctly)
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id uuid;
  v_entity_id uuid;
  v_record RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_record := OLD;
  ELSE
    v_record := NEW;
  END IF;

  v_entity_id := v_record.id;

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

CREATE TRIGGER audit_families
  AFTER INSERT OR UPDATE OR DELETE ON families
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_family_members
  AFTER INSERT OR UPDATE OR DELETE ON family_members
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER audit_relationships
  AFTER INSERT OR UPDATE OR DELETE ON relationships
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();
