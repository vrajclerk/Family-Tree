-- ============================================
-- Migration: Add spouse/sibling relationships + photo upload
-- Run this in Supabase SQL Editor if you already have the old schema.
-- ============================================

-- 1. Add photo_url to persons (if not already there)
ALTER TABLE persons ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Rename relationship columns
ALTER TABLE relationships RENAME COLUMN parent_member_id TO member_1_id;
ALTER TABLE relationships RENAME COLUMN child_member_id TO member_2_id;

-- 3. Add relationship_type column
ALTER TABLE relationships ADD COLUMN IF NOT EXISTS relationship_type text NOT NULL DEFAULT 'parent_child';
ALTER TABLE relationships ADD CONSTRAINT check_relationship_type
  CHECK (relationship_type IN ('parent_child', 'spouse', 'sibling'));

-- 4. Rename relation_type to relation_subtype and expand allowed values
ALTER TABLE relationships RENAME COLUMN relation_type TO relation_subtype;
ALTER TABLE relationships DROP CONSTRAINT IF EXISTS relationships_relation_type_check;
ALTER TABLE relationships ADD CONSTRAINT check_relation_subtype
  CHECK (relation_subtype IN (
    'biological', 'adopted', 'step', 'foster',
    'married', 'partner', 'divorced',
    'half', 'full'
  ));

-- 5. Add no-self-relationship constraint
ALTER TABLE relationships DROP CONSTRAINT IF EXISTS no_self_relationship;
ALTER TABLE relationships ADD CONSTRAINT no_self_relationship CHECK (member_1_id != member_2_id);

-- 6. Update indexes
DROP INDEX IF EXISTS idx_relationships_parent;
DROP INDEX IF EXISTS idx_relationships_child;
CREATE INDEX IF NOT EXISTS idx_relationships_member1 ON relationships (member_1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_member2 ON relationships (member_2_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships (relationship_type);

-- 7. Update circular relationship trigger to only check parent_child
CREATE OR REPLACE FUNCTION prevent_circular_relationships()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.relationship_type != 'parent_child' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    WITH RECURSIVE ancestors AS (
      SELECT member_1_id as id FROM relationships
      WHERE member_2_id = NEW.member_1_id AND relationship_type = 'parent_child'
      UNION
      SELECT r.member_1_id FROM relationships r
      JOIN ancestors a ON r.member_2_id = a.id
      WHERE r.relationship_type = 'parent_child'
    )
    SELECT 1 FROM ancestors WHERE id = NEW.member_2_id
  ) THEN
    RAISE EXCEPTION 'This relationship would create a circular dependency';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create storage bucket for member photos
INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Storage policies
CREATE POLICY "Anyone can view member photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-photos');

CREATE POLICY "Authenticated users can upload member photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'member-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their uploads"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'member-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'member-photos' AND auth.uid() IS NOT NULL);
