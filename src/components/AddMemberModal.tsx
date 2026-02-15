import React, { useState } from 'react';
import { X, UserPlus, Search, AlertCircle, LinkIcon, Plus, Trash2, GitBranch, Heart, Users } from 'lucide-react';
import { useDuplicateDetection } from '../hooks/useDuplicateDetection';
import type { FamilyMemberWithPerson } from '../hooks/useFamilyMembers';

export interface RelationshipEntry {
    id: string; // local UI key
    relationshipType: 'parent_child' | 'spouse' | 'sibling';
    relationSubtype: string;
    relatedMemberId: string;
    /** For parent_child: is the NEW member the parent or the child? */
    direction: 'new_is_child' | 'new_is_parent';
}

interface AddMemberModalProps {
    onClose: () => void;
    onSubmit: (data: {
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
        relationships?: Omit<RelationshipEntry, 'id'>[];
    }) => Promise<void>;
    loading?: boolean;
    existingMembers?: FamilyMemberWithPerson[];
}

const SUBTYPES_BY_TYPE: Record<string, { value: string; label: string }[]> = {
    parent_child: [
        { value: 'biological', label: 'Biological' },
        { value: 'adopted', label: 'Adopted' },
        { value: 'step', label: 'Step' },
        { value: 'foster', label: 'Foster' },
    ],
    spouse: [
        { value: 'married', label: 'Married' },
        { value: 'partner', label: 'Partner' },
        { value: 'divorced', label: 'Divorced' },
    ],
    sibling: [
        { value: 'full', label: 'Full Sibling' },
        { value: 'half', label: 'Half Sibling' },
        { value: 'step', label: 'Step Sibling' },
        { value: 'adopted', label: 'Adopted Sibling' },
    ],
};

const TYPE_LABELS: Record<string, string> = {
    parent_child: 'Parent–Child',
    spouse: 'Spouse',
    sibling: 'Sibling',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
    parent_child: <GitBranch className="w-3.5 h-3.5" />,
    spouse: <Heart className="w-3.5 h-3.5" />,
    sibling: <Users className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<string, string> = {
    parent_child: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    spouse: 'border-pink-400 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300',
    sibling: 'border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300',
};

let nextRelId = 1;
const generateRelId = () => `rel_${nextRelId++}`;

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onSubmit, loading = false, existingMembers = [] }) => {
    const [name, setName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [deathDate, setDeathDate] = useState('');
    const [gender, setGender] = useState('');
    const [occupation, setOccupation] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [notes, setNotes] = useState('');
    const [isLiving, setIsLiving] = useState(true);
    const [error, setError] = useState('');
    const [selectedExistingPerson, setSelectedExistingPerson] = useState<string | null>(null);

    // Relationships state
    const [relationships, setRelationships] = useState<RelationshipEntry[]>([]);

    const { data: duplicates, isLoading: checkingDuplicates } = useDuplicateDetection(name, birthDate || undefined);

    const addRelationshipRow = () => {
        setRelationships(prev => [
            ...prev,
            {
                id: generateRelId(),
                relationshipType: 'parent_child',
                relationSubtype: 'biological',
                relatedMemberId: '',
                direction: 'new_is_child',
            },
        ]);
    };

    const updateRelationship = (id: string, updates: Partial<RelationshipEntry>) => {
        setRelationships(prev =>
            prev.map(r => {
                if (r.id !== id) return r;
                const updated = { ...r, ...updates };
                // Reset subtype if type changed
                if (updates.relationshipType && updates.relationshipType !== r.relationshipType) {
                    updated.relationSubtype = SUBTYPES_BY_TYPE[updates.relationshipType][0].value;
                    // Reset direction for non parent_child
                    if (updates.relationshipType !== 'parent_child') {
                        updated.direction = 'new_is_child';
                    }
                }
                return updated;
            })
        );
    };

    const removeRelationship = (id: string) => {
        setRelationships(prev => prev.filter(r => r.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() && !selectedExistingPerson) {
            setError('Please enter a name or select an existing person.');
            return;
        }

        // Validate relationships
        for (const rel of relationships) {
            if (!rel.relatedMemberId) {
                setError('Please select a member for each relationship, or remove empty rows.');
                return;
            }
        }

        try {
            const relData = relationships.map(({ id, ...rest }) => rest);

            if (selectedExistingPerson) {
                await onSubmit({
                    existingPersonId: selectedExistingPerson,
                    displayName: displayName || undefined,
                    notes: notes || undefined,
                    isLiving,
                    relationships: relData.length > 0 ? relData : undefined,
                });
            } else {
                await onSubmit({
                    personData: {
                        canonical_name: name.trim(),
                        birth_date: birthDate || undefined,
                        death_date: deathDate || undefined,
                        gender: gender || undefined,
                        occupation: occupation || undefined,
                    },
                    displayName: displayName || undefined,
                    notes: notes || undefined,
                    isLiving,
                    relationships: relData.length > 0 ? relData : undefined,
                });
            }
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to add member');
        }
    };

    const handleSelectExisting = (personId: string, personName: string) => {
        setSelectedExistingPerson(personId);
        setName(personName);
    };

    const handleClearSelection = () => {
        setSelectedExistingPerson(null);
    };

    const getMemberLabel = (m: FamilyMemberWithPerson) => {
        const memberName = m.display_name || m.person?.canonical_name || 'Unknown';
        const birth = m.person?.birth_date ? ` (b. ${new Date(m.person.birth_date).getFullYear()})` : '';
        return `${memberName}${birth}`;
    };

    const getDirectionLabel = (rel: RelationshipEntry) => {
        if (rel.relationshipType !== 'parent_child') return null;
        const newPersonName = name || 'New member';
        const relatedMember = existingMembers.find(m => m.id === rel.relatedMemberId);
        const relatedName = relatedMember
            ? (relatedMember.display_name || relatedMember.person?.canonical_name || 'Selected member')
            : 'Selected member';
        if (rel.direction === 'new_is_child') {
            return `${newPersonName} is child of ${relatedName}`;
        } else {
            return `${newPersonName} is parent of ${relatedName}`;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-blue-600" />
                        Add Family Member
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {selectedExistingPerson && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LinkIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-700 dark:text-blue-300">Linking to existing person: <strong>{name}</strong></span>
                        </div>
                        <button onClick={handleClearSelection} className="text-xs text-blue-600 hover:underline">
                            Clear
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ─── Person Details ─── */}
                    <div>
                        <label htmlFor="memberName" className="label">Full Name *</label>
                        <input
                            id="memberName"
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setSelectedExistingPerson(null); }}
                            className="input-field"
                            placeholder="e.g., John Smith"
                            required
                            disabled={!!selectedExistingPerson}
                        />
                    </div>

                    {/* Duplicate Detection Results */}
                    {!selectedExistingPerson && name.length > 2 && (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
                                <Search className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    {checkingDuplicates ? 'Checking for existing records...' : 'Similar people found'}
                                </span>
                            </div>
                            {duplicates && duplicates.length > 0 ? (
                                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {duplicates.map((dup: any) => (
                                        <button
                                            key={dup.person_id}
                                            type="button"
                                            onClick={() => handleSelectExisting(dup.person_id, dup.person_name)}
                                            className="w-full px-3 py-2 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-between transition-colors"
                                        >
                                            <div>
                                                <span className="text-sm font-medium">{dup.person_name}</span>
                                                {dup.person_birth_date && (
                                                    <span className="text-xs text-slate-500 ml-2">
                                                        Born: {new Date(dup.person_birth_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                                                {Math.round((dup.similarity_score || 0) * 100)}% match
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : !checkingDuplicates ? (
                                <p className="px-3 py-2 text-xs text-slate-500">No existing matches found — a new person will be created.</p>
                            ) : null}
                        </div>
                    )}

                    {!selectedExistingPerson && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="birthDate" className="label">Birth Date</label>
                                    <input
                                        id="birthDate"
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="deathDate" className="label">Death Date</label>
                                    <input
                                        id="deathDate"
                                        type="date"
                                        value={deathDate}
                                        onChange={(e) => { setDeathDate(e.target.value); if (e.target.value) setIsLiving(false); }}
                                        className="input-field"
                                        disabled={isLiving}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="gender" className="label">Gender</label>
                                    <select
                                        id="gender"
                                        value={gender}
                                        onChange={(e) => setGender(e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="">Select...</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                        <option value="unknown">Unknown</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="occupation" className="label">Occupation</label>
                                    <input
                                        id="occupation"
                                        type="text"
                                        value={occupation}
                                        onChange={(e) => setOccupation(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g., Engineer"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label htmlFor="displayName" className="label">Display Name (Optional)</label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="input-field"
                            placeholder="Nickname or how they're known in family"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isLiving}
                                onChange={(e) => { setIsLiving(e.target.checked); if (e.target.checked) setDeathDate(''); }}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                        <span className="text-sm text-slate-700 dark:text-slate-300">Living</span>
                    </div>

                    <div>
                        <label htmlFor="notes" className="label">Notes</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="input-field"
                            rows={2}
                            placeholder="Any additional notes about this person..."
                        />
                    </div>

                    {/* ─── Relationships Section ─── */}
                    {existingMembers.length > 0 && (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Relationships
                                    </span>
                                    {relationships.length > 0 && (
                                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                                            {relationships.length}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={addRelationshipRow}
                                    className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Relationship
                                </button>
                            </div>

                            {relationships.length === 0 ? (
                                <div className="px-4 py-6 text-center">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                        No relationships added yet
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Define how this person is related to existing members (e.g., child of, spouse of)
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {relationships.map((rel, idx) => (
                                        <div key={rel.id} className="px-4 py-3 space-y-3 bg-white dark:bg-slate-800/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                    Relationship #{idx + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRelationship(rel.id)}
                                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    title="Remove relationship"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Type selector */}
                                            <div className="flex gap-2">
                                                {(['parent_child', 'spouse', 'sibling'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => updateRelationship(rel.id, { relationshipType: type })}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${rel.relationshipType === type
                                                                ? TYPE_COLORS[type]
                                                                : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                                                            }`}
                                                    >
                                                        {TYPE_ICONS[type]}
                                                        {TYPE_LABELS[type]}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Direction for parent_child */}
                                            {rel.relationshipType === 'parent_child' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRelationship(rel.id, { direction: 'new_is_child' })}
                                                        className={`flex-1 text-xs px-3 py-2 rounded-lg border font-medium transition-all ${rel.direction === 'new_is_child'
                                                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                                : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        ↑ New member is <strong>child</strong> of…
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateRelationship(rel.id, { direction: 'new_is_parent' })}
                                                        className={`flex-1 text-xs px-3 py-2 rounded-lg border font-medium transition-all ${rel.direction === 'new_is_parent'
                                                                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                                : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                                                            }`}
                                                    >
                                                        ↓ New member is <strong>parent</strong> of…
                                                    </button>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Related member */}
                                                <div>
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                                        Related Member
                                                    </label>
                                                    <select
                                                        value={rel.relatedMemberId}
                                                        onChange={(e) => updateRelationship(rel.id, { relatedMemberId: e.target.value })}
                                                        className="input-field text-sm"
                                                    >
                                                        <option value="">Select member…</option>
                                                        {existingMembers.map((m) => (
                                                            <option key={m.id} value={m.id}>
                                                                {getMemberLabel(m)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {/* Subtype */}
                                                <div>
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                                                        Subtype
                                                    </label>
                                                    <select
                                                        value={rel.relationSubtype}
                                                        onChange={(e) => updateRelationship(rel.id, { relationSubtype: e.target.value })}
                                                        className="input-field text-sm"
                                                    >
                                                        {SUBTYPES_BY_TYPE[rel.relationshipType].map((s) => (
                                                            <option key={s.value} value={s.value}>{s.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Summary label */}
                                            {rel.relatedMemberId && rel.relationshipType === 'parent_child' && (
                                                <div className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                                                    📌 {getDirectionLabel(rel)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary flex-1" disabled={loading}>
                            {loading ? 'Adding...' : selectedExistingPerson ? 'Link Person' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;
