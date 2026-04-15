export const getAuditLabel = (action: 'INSERT' | 'UPDATE' | 'DELETE', entityType: string): string => {
    const labels: Record<string, Record<string, string>> = {
        family_members: {
            INSERT: 'Added member',
            UPDATE: 'Updated member',
            DELETE: 'Removed member',
        },
        persons: {
            INSERT: 'Created person',
            UPDATE: 'Edited person details',
            DELETE: 'Deleted person',
        },
        relationships: {
            INSERT: 'Added relationship',
            UPDATE: 'Updated relationship',
            DELETE: 'Removed relationship',
        },
        family_memberships: {
            INSERT: 'Added user to family',
            UPDATE: 'Changed user role',
            DELETE: 'Removed user from family',
        },
        family_history: {
            INSERT: 'Added family story',
            UPDATE: 'Edited family story',
            DELETE: 'Deleted family story',
        },
        family_invitations: {
            INSERT: 'Created invite link',
            UPDATE: 'Updated invite',
            DELETE: 'Revoked invite',
        },
        families: {
            INSERT: 'Created family tree',
            UPDATE: 'Updated family details',
            DELETE: 'Deleted family tree',
        },
    };

    return labels[entityType]?.[action] || `${action} ${entityType}`;
};
