import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Save, X, Calendar, Briefcase, GitBranch, TreePine } from 'lucide-react';
import { useFamilyMembers, type FamilyMemberWithPerson } from '../hooks/useFamilyMembers';
import { useRelationships } from '../hooks/useRelationships';

const MemberProfile: React.FC = () => {
    const { familyId, memberId } = useParams<{ familyId: string; memberId: string }>();
    const navigate = useNavigate();


    const { members, updateMember } = useFamilyMembers(familyId || '');
    const { relationships } = useRelationships(familyId || '');

    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({
        canonical_name: '',
        birth_date: '',
        death_date: '',
        gender: '',
        occupation: '',
        display_name: '',
        notes: '',
        is_living: true,
    });

    const member = members.find((m) => m.id === memberId);

    useEffect(() => {
        if (member) {
            setEditData({
                canonical_name: member.person?.canonical_name || '',
                birth_date: member.person?.birth_date || '',
                death_date: member.person?.death_date || '',
                gender: member.person?.gender || '',
                occupation: member.person?.occupation || '',
                display_name: member.display_name || '',
                notes: member.notes || '',
                is_living: member.is_living,
            });
        }
    }, [member]);

    const parents = relationships
        .filter((r) => r.child_member_id === memberId)
        .map((r) => {
            const parent = members.find((m) => m.id === r.parent_member_id);
            return { ...r, member: parent };
        });

    const children = relationships
        .filter((r) => r.parent_member_id === memberId)
        .map((r) => {
            const child = members.find((m) => m.id === r.child_member_id);
            return { ...r, member: child };
        });

    const siblings = parents.length > 0
        ? members.filter((m) => {
            if (m.id === memberId) return false;
            return relationships.some(
                (r) => r.child_member_id === m.id &&
                    parents.some((p) => p.parent_member_id === r.parent_member_id)
            );
        })
        : [];

    const handleSave = async () => {
        if (!member) return;
        setSaving(true);
        try {
            await updateMember.mutateAsync({
                memberId: member.id,
                personId: member.person_id,
                updates: {
                    display_name: editData.display_name || undefined,
                    notes: editData.notes || undefined,
                    is_living: editData.is_living,
                },
                personUpdates: {
                    canonical_name: editData.canonical_name,
                    birth_date: editData.birth_date || undefined,
                    death_date: editData.death_date || undefined,
                    gender: (editData.gender as 'male' | 'female' | 'other' | 'unknown') || undefined,
                    occupation: editData.occupation || undefined,
                },
            });
            setEditing(false);
        } catch (err) {
            console.error('Error saving:', err);
        } finally {
            setSaving(false);
        }
    };

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

    if (!member) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">Loading member...</p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    const person = member.person;

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(`/family/${familyId}`)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-bold">Member Profile</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {editing ? (
                            <>
                                <button onClick={() => setEditing(false)} className="btn-secondary flex items-center gap-2 text-sm">
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                                <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm" disabled={saving}>
                                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm">
                                <Edit3 className="w-4 h-4" /> Edit
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            <div className="pt-24 pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    {/* Profile Header */}
                    <div className="card mb-8">
                        <div className="flex items-start gap-6">
                            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${getGenderColor(person?.gender)} flex items-center justify-center text-white text-4xl shadow-xl`}>
                                {getGenderEmoji(person?.gender)}
                            </div>
                            <div className="flex-1">
                                {editing ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={editData.canonical_name}
                                            onChange={(e) => setEditData({ ...editData, canonical_name: e.target.value })}
                                            className="input-field text-2xl font-bold"
                                            placeholder="Full name"
                                        />
                                        <input
                                            type="text"
                                            value={editData.display_name}
                                            onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                                            className="input-field"
                                            placeholder="Display name / nickname"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-3xl font-bold mb-1">
                                            {member.display_name || person?.canonical_name}
                                        </h1>
                                        {member.display_name && person?.canonical_name && member.display_name !== person.canonical_name && (
                                            <p className="text-sm text-slate-500">Full name: {person.canonical_name}</p>
                                        )}
                                    </>
                                )}

                                <div className="flex items-center gap-4 mt-3 flex-wrap">
                                    <span className={`text-sm px-3 py-1 rounded-full ${member.is_living ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        {member.is_living ? '🟢 Living' : '⚫ Deceased'}
                                    </span>
                                    {person?.gender && (
                                        <span className="text-sm text-slate-500 capitalize">{person.gender}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Details Card */}
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Details
                            </h2>
                            {editing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="label">Birth Date</label>
                                        <input type="date" value={editData.birth_date} onChange={(e) => setEditData({ ...editData, birth_date: e.target.value })} className="input-field" />
                                    </div>
                                    <div>
                                        <label className="label">Death Date</label>
                                        <input type="date" value={editData.death_date} onChange={(e) => setEditData({ ...editData, death_date: e.target.value })} className="input-field" disabled={editData.is_living} />
                                    </div>
                                    <div>
                                        <label className="label">Gender</label>
                                        <select value={editData.gender} onChange={(e) => setEditData({ ...editData, gender: e.target.value })} className="input-field">
                                            <option value="">Select...</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Occupation</label>
                                        <input type="text" value={editData.occupation} onChange={(e) => setEditData({ ...editData, occupation: e.target.value })} className="input-field" placeholder="Occupation" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={editData.is_living} onChange={(e) => setEditData({ ...editData, is_living: e.target.checked })} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                        <span className="text-sm">Living</span>
                                    </div>
                                    <div>
                                        <label className="label">Notes</label>
                                        <textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className="input-field" rows={3} placeholder="Notes about this person..." />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <DetailRow label="Birth Date" value={person?.birth_date ? new Date(person.birth_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />
                                    {!member.is_living && <DetailRow label="Death Date" value={person?.death_date ? new Date(person.death_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined} />}
                                    <DetailRow label="Gender" value={person?.gender ? person.gender.charAt(0).toUpperCase() + person.gender.slice(1) : undefined} />
                                    <DetailRow label="Occupation" value={person?.occupation} icon={<Briefcase className="w-4 h-4" />} />
                                    {member.notes && <DetailRow label="Notes" value={member.notes} />}
                                </div>
                            )}
                        </div>

                        {/* Relationships Card */}
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <GitBranch className="w-5 h-5 text-purple-600" />
                                Relationships
                            </h2>

                            {parents.length === 0 && children.length === 0 && siblings.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">No relationships mapped yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {parents.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Parents</h3>
                                            <div className="space-y-2">
                                                {parents.map((p) => p.member && (
                                                    <RelationCard
                                                        key={p.id}
                                                        member={p.member}
                                                        relationType={p.relation_type}
                                                        onClick={() => navigate(`/family/${familyId}/member/${p.member!.id}`)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {siblings.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Siblings</h3>
                                            <div className="space-y-2">
                                                {siblings.map((s) => (
                                                    <RelationCard
                                                        key={s.id}
                                                        member={s}
                                                        onClick={() => navigate(`/family/${familyId}/member/${s.id}`)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {children.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Children</h3>
                                            <div className="space-y-2">
                                                {children.map((c) => c.member && (
                                                    <RelationCard
                                                        key={c.id}
                                                        member={c.member}
                                                        relationType={c.relation_type}
                                                        onClick={() => navigate(`/family/${familyId}/member/${c.member!.id}`)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => navigate(`/family/${familyId}/tree`)}
                                    className="btn-secondary flex items-center gap-2 text-sm w-full justify-center"
                                >
                                    <TreePine className="w-4 h-4" />
                                    View in Tree
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow: React.FC<{ label: string; value?: string | null; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            {icon} {label}
        </span>
        <span className="text-sm font-medium text-right">{value || '—'}</span>
    </div>
);

const RelationCard: React.FC<{ member: FamilyMemberWithPerson; relationType?: string; onClick: () => void }> = ({ member, relationType, onClick }) => {
    const getGenderEmoji = (gender?: string) => {
        switch (gender) { case 'male': return '👨'; case 'female': return '👩'; default: return '👤'; }
    };

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
        >
            <span className="text-xl">{getGenderEmoji(member.person?.gender)}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.display_name || member.person?.canonical_name}</p>
                {member.person?.birth_date && (
                    <p className="text-xs text-slate-500">b. {new Date(member.person.birth_date).getFullYear()}</p>
                )}
            </div>
            {relationType && relationType !== 'biological' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                    {relationType}
                </span>
            )}
        </button>
    );
};

export default MemberProfile;
