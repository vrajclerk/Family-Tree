-- Patch existing families trigger to exclude owner_password_hash from snapshots
CREATE OR REPLACE FUNCTION audit_families_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_log (family_id, user_id, action, entity_type, entity_id, changes)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    TG_OP,
    'families',
    COALESCE(NEW.id, OLD.id)::text,
    jsonb_build_object(
      'before', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) - 'owner_password_hash' ELSE NULL END,
      'after', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) - 'owner_password_hash' ELSE NULL END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on family_memberships table
CREATE OR REPLACE FUNCTION audit_family_memberships_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_log (family_id, user_id, action, entity_type, entity_id, changes)
  VALUES (
    COALESCE(NEW.family_id, OLD.family_id),
    auth.uid(),
    TG_OP,
    'family_memberships',
    COALESCE(NEW.id, OLD.id)::text,
    jsonb_build_object(
      'before', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      'after', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_family_memberships_change_trigger ON family_memberships;
CREATE TRIGGER audit_family_memberships_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON family_memberships
  FOR EACH ROW EXECUTE FUNCTION audit_family_memberships_change();

-- Create trigger on family_history table
CREATE OR REPLACE FUNCTION audit_family_history_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_log (family_id, user_id, action, entity_type, entity_id, changes)
  VALUES (
    COALESCE(NEW.family_id, OLD.family_id),
    auth.uid(),
    TG_OP,
    'family_history',
    COALESCE(NEW.id, OLD.id)::text,
    jsonb_build_object(
      'before', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      'after', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_family_history_change_trigger ON family_history;
CREATE TRIGGER audit_family_history_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON family_history
  FOR EACH ROW EXECUTE FUNCTION audit_family_history_change();

-- Create trigger on family_invitations table
CREATE OR REPLACE FUNCTION audit_family_invitations_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_log (family_id, user_id, action, entity_type, entity_id, changes)
  VALUES (
    COALESCE(NEW.family_id, OLD.family_id),
    auth.uid(),
    TG_OP,
    'family_invitations',
    COALESCE(NEW.id, OLD.id)::text,
    jsonb_build_object(
      'before', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      'after', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_family_invitations_change_trigger ON family_invitations;
CREATE TRIGGER audit_family_invitations_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON family_invitations
  FOR EACH ROW EXECUTE FUNCTION audit_family_invitations_change();

-- Create trigger on persons table (special case - no family_id column, so find via family_members)
CREATE OR REPLACE FUNCTION audit_persons_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_family_id uuid;
BEGIN
  -- Find all families that contain this person
  FOR v_family_id IN
    SELECT DISTINCT family_id FROM family_members
    WHERE person_id = COALESCE(NEW.id, OLD.id)
  LOOP
    INSERT INTO public.audit_log (family_id, user_id, action, entity_type, entity_id, changes)
    VALUES (
      v_family_id,
      auth.uid(),
      TG_OP,
      'persons',
      COALESCE(NEW.id, OLD.id)::text,
      jsonb_build_object(
        'before', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        'after', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
      )
    );
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_persons_change_trigger ON persons;
CREATE TRIGGER audit_persons_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON persons
  FOR EACH ROW EXECUTE FUNCTION audit_persons_change();
