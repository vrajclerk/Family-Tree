import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { FamilyMember, Person } from '../lib/supabase';

export interface FamilyMemberWithPerson extends FamilyMember {
    person: Person;
}

export const useFamilyMembers = (familyId: string) => {
    const queryClient = useQueryClient();

    const membersQuery = useQuery({
        queryKey: ['family-members', familyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('family_members')
                .select('*, person:persons(*)')
                .eq('family_id', familyId);
            if (error) throw error;
            return data as FamilyMemberWithPerson[];
        },
        enabled: !!familyId,
    });

    const addMember = useMutation({
        mutationFn: async ({
            personData,
            displayName,
            notes,
            isLiving = true,
            existingPersonId,
        }: {
            personData?: {
                canonical_name: string;
                birth_date?: string;
                death_date?: string;
                gender?: string;
                occupation?: string;
            };
            displayName?: string;
            notes?: string;
            isLiving?: boolean;
            existingPersonId?: string;
        }) => {
            let personId = existingPersonId;

            // Create person if not linking to existing
            if (!personId && personData) {
                const { data: person, error: personError } = await supabase
                    .from('persons')
                    .insert([{
                        canonical_name: personData.canonical_name,
                        normalized_name: personData.canonical_name.toLowerCase().trim(),
                        birth_date: personData.birth_date || null,
                        death_date: personData.death_date || null,
                        gender: personData.gender || null,
                        occupation: personData.occupation || null,
                    }])
                    .select()
                    .single();
                if (personError) throw personError;
                personId = person.id;
            }

            // Create family member link
            const { data: member, error: memberError } = await supabase
                .from('family_members')
                .insert([{
                    family_id: familyId,
                    person_id: personId,
                    display_name: displayName || null,
                    notes: notes || null,
                    is_living: isLiving,
                }])
                .select('*, person:persons(*)')
                .single();

            if (memberError) throw memberError;
            return member;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['family-members', familyId] });
        },
    });

    const updateMember = useMutation({
        mutationFn: async ({
            memberId,
            personId,
            updates,
            personUpdates,
        }: {
            memberId: string;
            personId: string;
            updates?: Partial<FamilyMember>;
            personUpdates?: Partial<Person>;
        }) => {
            if (personUpdates) {
                const { error } = await supabase
                    .from('persons')
                    .update({
                        ...personUpdates,
                        normalized_name: personUpdates.canonical_name
                            ? personUpdates.canonical_name.toLowerCase().trim()
                            : undefined,
                    })
                    .eq('id', personId);
                if (error) throw error;
            }

            if (updates) {
                const { error } = await supabase
                    .from('family_members')
                    .update(updates)
                    .eq('id', memberId);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['family-members', familyId] });
        },
    });

    const deleteMember = useMutation({
        mutationFn: async (memberId: string) => {
            const { error } = await supabase
                .from('family_members')
                .delete()
                .eq('id', memberId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['family-members', familyId] });
            queryClient.invalidateQueries({ queryKey: ['relationships', familyId] });
        },
    });

    return {
        members: membersQuery.data || [],
        isLoading: membersQuery.isLoading,
        error: membersQuery.error,
        addMember,
        updateMember,
        deleteMember,
    };
};
