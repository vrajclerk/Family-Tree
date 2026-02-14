import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useDuplicateDetection = (name: string, birthDate?: string) => {
    return useQuery({
        queryKey: ['duplicates', name, birthDate],
        queryFn: async () => {
            const { data, error } = await supabase
                .rpc('find_similar_persons', {
                    search_name: name,
                    search_birth_date: birthDate || null,
                    similarity_threshold: 0.6,
                });
            if (error) throw error;
            return data;
        },
        enabled: name.length > 2,
    });
};
