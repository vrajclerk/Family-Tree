import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Missing Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).',
        'Please copy .env.example to .env and fill in your Supabase credentials.',
        'The app will render but authentication and data features will not work.'
    );
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

// Database types
export interface User {
    id: string;
    email: string;
    full_name?: string;
    created_at: string;
    updated_at: string;
}

export interface Family {
    id: string;
    name: string;
    owner_user_id: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface Person {
    id: string;
    canonical_name: string;
    normalized_name: string;
    birth_date?: string;
    death_date?: string;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    occupation?: string;
    photo_url?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface FamilyMember {
    id: string;
    family_id: string;
    person_id: string;
    display_name?: string;
    notes?: string;
    is_living: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
    person?: Person;
}

export interface Relationship {
    id: string;
    family_id: string;
    member_1_id: string;
    member_2_id: string;
    relationship_type: 'parent_child' | 'spouse' | 'sibling';
    relation_subtype: 'biological' | 'adopted' | 'step' | 'foster' | 'married' | 'partner' | 'divorced' | 'half' | 'full';
    created_at: string;
    updated_at: string;
}

export interface FamilyMembership {
    id: string;
    family_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'contributor' | 'viewer';
    accepted: boolean;
    invited_by?: string;
    created_at: string;
    updated_at: string;
    family?: Family;
}

export interface FamilyHistory {
    id: string;
    family_id: string;
    member_id?: string;
    title: string;
    body?: string;
    media?: any[];
    event_date?: string;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface AuditLog {
    id: string;
    family_id: string;
    user_id?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    changes?: any;
    created_at: string;
}
