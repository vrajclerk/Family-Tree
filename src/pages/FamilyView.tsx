import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TreePine, Users, Plus, GitBranch, ArrowLeft, Search, Eye } from 'lucide-react';

import { supabase, type Family } from '../lib/supabase';
import { useFamilyMembers } from '../hooks/useFamilyMembers';
import { useRelationships } from '../hooks/useRelationships';
import AddMemberModal from '../components/AddMemberModal';
import AddRelationshipModal from '../components/AddRelationshipModal';

const FamilyView: React.FC = () => {
    const { familyId } = useParams<{ familyId: string }>();
    const navigate = useNavigate();

    const [family, setFamily] = useState<Family | null>(null);
    const [familyLoading, setFamilyLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddMember, setShowAddMember] = useState(false);
    const [showAddRelationship, setShowAddRelationship] = useState(false);

    const { members, isLoading: membersLoading, addMember } = useFamilyMembers(familyId || '');
    const { relationships, addRelationship } = useRelationships(familyId || '');

    useEffect(() => {
        if (familyId) fetchFamily();
    }, [familyId]);

    const fetchFamily = async () => {
        if (!familyId) return;
        try {
            const { data, error } = await supabase
                .from('families')
                .select('*')
                .eq('id', familyId)
                .single();
            if (error) throw error;
            setFamily(data);
        } catch (error) {
            console.error('Error fetching family:', error);
        } finally {
            setFamilyLoading(false);
        }
    };

    const filteredMembers = members.filter((m) => {
        const name = (m.display_name || m.person?.canonical_name || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    const getGenderColor = (gender?: string) => {
        switch (gender) {
            case 'male': return 'from-blue-400 to-blue-600';
            case 'female': return 'from-pink-400 to-pink-600';
            default: return 'from-slate-400 to-slate-600';
        }
    };

    const getGenderEmoji = (gender?: string) => {
        switch (gender) {
            case 'male': return '👨';
            case 'female': return '👩';
            default: return '👤';
        }
    };

    const getParentNames = (memberId: string) => {
        return relationships
            .filter(r => r.relationship_type === 'parent_child' && r.member_2_id === memberId)
            .map(r => {
                const parent = members.find(m => m.id === r.member_1_id);
                return parent?.display_name || parent?.person?.canonical_name || 'Unknown';
            });
    };

    const getChildrenNames = (memberId: string) => {
        return relationships
            .filter(r => r.relationship_type === 'parent_child' && r.member_1_id === memberId)
            .map(r => {
                const child = members.find(m => m.id === r.member_2_id);
                return child?.display_name || child?.person?.canonical_name || 'Unknown';
            });
    };

    const getSpouseNames = (memberId: string) => {
        return relationships
            .filter(r => r.relationship_type === 'spouse' && (r.member_1_id === memberId || r.member_2_id === memberId))
            .map(r => {
                const spouseId = r.member_1_id === memberId ? r.member_2_id : r.member_1_id;
                const spouse = members.find(m => m.id === spouseId);
                return spouse?.display_name || spouse?.person?.canonical_name || 'Unknown';
            });
    };

    const getSiblingNames = (memberId: string) => {
        return relationships
            .filter(r => r.relationship_type === 'sibling' && (r.member_1_id === memberId || r.member_2_id === memberId))
            .map(r => {
                const siblingId = r.member_1_id === memberId ? r.member_2_id : r.member_1_id;
                const sibling = members.find(m => m.id === siblingId);
                return sibling?.display_name || sibling?.person?.canonical_name || 'Unknown';
            });
    };

    if (familyLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <TreePine className="w-7 h-7 text-blue-600" />
                            <span className="text-xl font-bold">{family?.name || 'Family'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to={`/family/${familyId}/tree`}
                            className="btn-primary flex items-center gap-2 text-sm"
                        >
                            <Eye className="w-4 h-4" />
                            View Tree
                        </Link>
                        <Link
                            to={`/family/${familyId}/history`}
                            className="btn-secondary flex items-center gap-2 text-sm"
                        >
                            History
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Family Header */}
                    <div className="card mb-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{family?.name}</h1>
                                <p className="text-white/80">{family?.description || 'No description'}</p>
                                <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {members.length} member{members.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <GitBranch className="w-4 h-4" />
                                        {relationships.length} relationship{relationships.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions & Search */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-10"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddMember(true)}
                                className="btn-primary flex items-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Member
                            </button>
                            <button
                                onClick={() => setShowAddRelationship(true)}
                                className="btn-secondary flex items-center gap-2 text-sm"
                                disabled={members.length < 2}
                            >
                                <GitBranch className="w-4 h-4" />
                                Add Relationship
                            </button>
                        </div>
                    </div>

                    {/* Members Grid */}
                    {membersLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="card text-center py-16">
                            <Users className="w-14 h-14 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">
                                {searchQuery ? 'No matching members' : 'No Members Yet'}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                {searchQuery ? 'Try a different search term' : 'Add your first family member to get started'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setShowAddMember(true)}
                                    className="btn-primary inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add First Member
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredMembers.map((member) => {
                                const parents = getParentNames(member.id);
                                const childrenNames = getChildrenNames(member.id);
                                const spouses = getSpouseNames(member.id);
                                const siblings = getSiblingNames(member.id);
                                const hasRelations = parents.length > 0 || childrenNames.length > 0 || spouses.length > 0 || siblings.length > 0;
                                return (
                                    <div
                                        key={member.id}
                                        className="card group cursor-pointer hover:scale-[1.02] transition-all duration-300"
                                        onClick={() => navigate(`/family/${familyId}/member/${member.id}`)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {member.person?.photo_url ? (
                                                <img
                                                    src={member.person.photo_url}
                                                    alt={member.person.canonical_name}
                                                    className="w-14 h-14 rounded-full object-cover shadow-lg group-hover:scale-110 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getGenderColor(member.person?.gender)} flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    {getGenderEmoji(member.person?.gender)}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold truncate">
                                                    {member.display_name || member.person?.canonical_name}
                                                </h3>
                                                {member.person?.occupation && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{member.person.occupation}</p>
                                                )}
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    {member.person?.birth_date && (
                                                        <span className="text-xs text-slate-500">
                                                            b. {new Date(member.person.birth_date).getFullYear()}
                                                        </span>
                                                    )}
                                                    {member.person?.death_date && (
                                                        <span className="text-xs text-slate-500">
                                                            — d. {new Date(member.person.death_date).getFullYear()}
                                                        </span>
                                                    )}
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${member.is_living ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                        {member.is_living ? 'Living' : 'Deceased'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {hasRelations && (
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                                                {spouses.length > 0 && (
                                                    <p className="text-xs text-slate-500">
                                                        <span className="font-medium text-pink-600 dark:text-pink-400">💍 Spouse:</span> {spouses.join(', ')}
                                                    </p>
                                                )}
                                                {parents.length > 0 && (
                                                    <p className="text-xs text-slate-500">
                                                        <span className="font-medium">Parents:</span> {parents.join(', ')}
                                                    </p>
                                                )}
                                                {childrenNames.length > 0 && (
                                                    <p className="text-xs text-slate-500">
                                                        <span className="font-medium">Children:</span> {childrenNames.join(', ')}
                                                    </p>
                                                )}
                                                {siblings.length > 0 && (
                                                    <p className="text-xs text-slate-500">
                                                        <span className="font-medium text-teal-600 dark:text-teal-400">Siblings:</span> {siblings.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showAddMember && (
                <AddMemberModal
                    onClose={() => setShowAddMember(false)}
                    existingMembers={members}
                    onSubmit={async (data) => {
                        const { relationships: rels, ...memberData } = data;
                        // 1. Create the member first
                        const newMember = await addMember.mutateAsync(memberData);
                        // 2. Create relationships
                        if (rels && rels.length > 0 && newMember?.id) {
                            for (const rel of rels) {
                                let member1Id: string;
                                let member2Id: string;
                                if (rel.relationshipType === 'parent_child') {
                                    if (rel.direction === 'new_is_child') {
                                        // existing member is parent, new member is child
                                        member1Id = rel.relatedMemberId;
                                        member2Id = newMember.id;
                                    } else {
                                        // new member is parent, existing member is child
                                        member1Id = newMember.id;
                                        member2Id = rel.relatedMemberId;
                                    }
                                } else {
                                    // spouse / sibling — order doesn't matter
                                    member1Id = newMember.id;
                                    member2Id = rel.relatedMemberId;
                                }
                                await addRelationship.mutateAsync({
                                    member1Id,
                                    member2Id,
                                    relationshipType: rel.relationshipType,
                                    relationSubtype: rel.relationSubtype,
                                });
                            }
                        }
                    }}
                    loading={addMember.isPending}
                />
            )}
            {showAddRelationship && (
                <AddRelationshipModal
                    members={members}
                    onClose={() => setShowAddRelationship(false)}
                    onSubmit={async (data) => {
                        await addRelationship.mutateAsync(data);
                    }}
                    loading={addRelationship.isPending}
                />
            )}
        </div>
    );
};

export default FamilyView;
