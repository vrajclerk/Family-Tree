import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useAuditLog = (familyId: string | undefined) => {
    return useQuery({
        queryKey: ['audit-log', familyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audit_log')
                .select('*, users(full_name, email)')
                .eq('family_id', familyId!)
                .order('created_at', { ascending: false })
                .limit(200);
            if (error) throw error;
            return data;
        },
        enabled: !!familyId,
    });
};
