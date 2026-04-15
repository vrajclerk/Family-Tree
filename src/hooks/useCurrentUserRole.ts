import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useCurrentUserRole = (familyId: string | undefined) => {
    const { user } = useAuth();

    const { data: role, isLoading: loading } = useQuery({
        queryKey: ['user-role', familyId, user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('family_memberships')
                .select('role')
                .eq('family_id', familyId!)
                .eq('user_id', user!.id)
                .eq('accepted', true)
                .single();
            if (error) throw error;
            return data?.role ?? null;
        },
        enabled: !!familyId && !!user,
    });

    return {
        role: role ?? null,
        isOwner: role === 'owner',
        isAdmin: role === 'owner' || role === 'admin',
        isContributor: role === 'owner' || role === 'admin' || role === 'contributor',
        isViewer: role === 'viewer',
        loading
    };
};
