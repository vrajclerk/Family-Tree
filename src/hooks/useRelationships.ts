import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useRelationships = (familyId: string) => {
    const queryClient = useQueryClient();

    const relationshipsQuery = useQuery({
        queryKey: ['relationships', familyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('relationships')
                .select('*')
                .eq('family_id', familyId);
            if (error) throw error;
            return data;
        },
        enabled: !!familyId,
    });

    const addRelationship = useMutation({
        mutationFn: async ({
            parentMemberId,
            childMemberId,
            relationType = 'biological',
        }: {
            parentMemberId: string;
            childMemberId: string;
            relationType?: string;
        }) => {
            const { data, error } = await supabase
                .from('relationships')
                .insert([{
                    family_id: familyId,
                    parent_member_id: parentMemberId,
                    child_member_id: childMemberId,
                    relation_type: relationType,
                }])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['relationships', familyId] });
            queryClient.invalidateQueries({ queryKey: ['family-members', familyId] });
        },
    });

    const deleteRelationship = useMutation({
        mutationFn: async (relationshipId: string) => {
            const { error } = await supabase
                .from('relationships')
                .delete()
                .eq('id', relationshipId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['relationships', familyId] });
        },
    });

    return {
        relationships: relationshipsQuery.data || [],
        isLoading: relationshipsQuery.isLoading,
        error: relationshipsQuery.error,
        addRelationship,
        deleteRelationship,
    };
};
