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
            member1Id,
            member2Id,
            relationshipType = 'parent_child',
            relationSubtype = 'biological',
        }: {
            member1Id: string;
            member2Id: string;
            relationshipType?: string;
            relationSubtype?: string;
        }) => {
            const { data, error } = await supabase
                .from('relationships')
                .insert([{
                    family_id: familyId,
                    member_1_id: member1Id,
                    member_2_id: member2Id,
                    relationship_type: relationshipType,
                    relation_subtype: relationSubtype,
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

    const updateRelationship = useMutation({
        mutationFn: async ({
            relationshipId,
            member1Id,
            member2Id,
            relationshipType,
            relationSubtype,
        }: {
            relationshipId: string;
            member1Id: string;
            member2Id: string;
            relationshipType: string;
            relationSubtype: string;
        }) => {
            const { data, error } = await supabase
                .from('relationships')
                .update({
                    member_1_id: member1Id,
                    member_2_id: member2Id,
                    relationship_type: relationshipType,
                    relation_subtype: relationSubtype,
                })
                .eq('id', relationshipId)
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

    return {
        relationships: relationshipsQuery.data || [],
        isLoading: relationshipsQuery.isLoading,
        error: relationshipsQuery.error,
        addRelationship,
        updateRelationship,
        deleteRelationship,
    };
};
