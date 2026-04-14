import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useCurrentUserRole = (familyId: string | undefined) => {
    const { user } = useAuth();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!familyId || !user) {
            setLoading(false);
            return;
        }

        const fetchRole = async () => {
            try {
                const { data, error } = await supabase
                    .from('family_memberships')
                    .select('role')
                    .eq('family_id', familyId)
                    .eq('user_id', user.id)
                    .eq('accepted', true)
                    .single();

                if (error) throw error;
                if (data) setRole(data.role);
            } catch (err) {
                console.error('Error fetching role:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRole();
    }, [familyId, user]);

    return {
        role,
        isOwner: role === 'owner',
        isAdmin: role === 'owner' || role === 'admin',
        isContributor: role === 'owner' || role === 'admin' || role === 'contributor',
        isViewer: role === 'viewer',
        loading
    };
};
