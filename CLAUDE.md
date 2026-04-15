# Family Tree Implementation Notes

## Latest Changes (2026-04-15)

### Bug Fixes - Phase 1, 2, 3 ✅
**14 bugs fixed across critical, high, and medium priority:**

1. **useDuplicateDetection** — null guard on name check
2. **AuthContext signup race** — DB trigger `on_auth_user_created` auto-inserts user profile + removed manual INSERT + added `initialized` flag
3. **Client-side bcrypt** — Moved to Edge Function `supabase/functions/create-family/index.ts`
4. **useCurrentUserRole** — Refactored to React Query (eliminates stale state, auto-handles loading)
5. **usePhotoUpload** — Check `removeError` on storage.remove()
6. **FamilySettings badge** — Changed "Invite Pending Logic" → "Invite Pending"
7. **MemberProfile hard reload** — Replaced `window.location.reload()` with query cache invalidation
8. **Photo delete confirmation** — Added `window.confirm()` before deletion
9. **useFamilyMembers normalized_name** — Conditional update object (avoid nulling DB column)
10. **useRelationships duplicates** — Added `onError` handler for Postgres error 23505 with user message
11. **FamilySettings role update** — Added `updatingRoleId` state + disable select during update
12. **AcceptInvite expiry** — 7-day expiry check with error message

### Audit Log System ✅

**SQL Migrations:**
- `supabase/migrations/001_handle_new_user_trigger.sql` — User profile auto-creation on signup
- `supabase/migrations/002_audit_log_extended_triggers.sql` — Full audit coverage (families, family_memberships, family_history, family_invitations, persons)

**Code:**
- `src/hooks/useAuditLog.ts` — React Query hook fetching audit_log (last 200 events)
- `src/utils/auditLabels.ts` — Maps (action, entity_type) → human-readable labels
- `src/components/ActivityLog.tsx` — Table view with expandable UPDATE rows showing diffs

**Integration:**
- ActivityLog component rendered in FamilySettings at bottom of page

## Key Implementation Details

- **Trigger Design:** Uses JSONB snapshots (before/after) for UPDATE diffs; handles special case where `persons` table has no `family_id` (loops over family_members to find related families)
- **Auth Fix:** Database-level solution (trigger on `auth.users`) vs client-side workaround
- **Edge Function:** `create-family` uses Deno + bcryptjs, bypasses client-side hashing
- **React Query:** Centralized async state, automatic cache management, eliminates manual useEffect bugs
- **Error Handling:** Postgres constraint errors (23505) caught and surfaced as user-friendly messages

## Pending Deployment

1. Apply migrations to Supabase database
2. Deploy Edge Function via `supabase functions deploy`
3. Run 11-point verification checklist (see implementation notes in memory)

## Files Modified/Created

**Modified:**
- src/contexts/AuthContext.tsx
- src/pages/Dashboard.tsx

