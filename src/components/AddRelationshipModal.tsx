import React, { useState } from 'react';
import { X, GitBranch, AlertCircle, Heart, Users } from 'lucide-react';
import type { FamilyMemberWithPerson } from '../hooks/useFamilyMembers';

interface AddRelationshipModalProps {
    members: FamilyMemberWithPerson[];
    onClose: () => void;
    onSubmit: (data: {
        member1Id: string;
        member2Id: string;
        relationshipType: string;
        relationSubtype: string;
    }) => Promise<void>;
    preselectedMemberId?: string;
    loading?: boolean;
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

const TYPE_ICONS: Record<string, React.ReactNode> = {
    parent_child: <GitBranch className="w-4 h-4" />,
    spouse: <Heart className="w-4 h-4" />,
    sibling: <Users className="w-4 h-4" />,
};

const AddRelationshipModal: React.FC<AddRelationshipModalProps> = ({
    members,
    onClose,
    onSubmit,
    preselectedMemberId,
    loading = false,
}) => {
    const [relationshipType, setRelationshipType] = useState('parent_child');
    const [member1Id, setMember1Id] = useState(preselectedMemberId || '');
    const [member2Id, setMember2Id] = useState('');
    const [relationSubtype, setRelationSubtype] = useState('biological');
    const [error, setError] = useState('');

    const handleTypeChange = (type: string) => {
        setRelationshipType(type);
        setRelationSubtype(SUBTYPES_BY_TYPE[type][0].value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!member1Id || !member2Id) {
            setError('Please select both members.');
            return;
        }
        if (member1Id === member2Id) {
            setError('Cannot create a relationship with the same person.');
            return;
        }

        try {
            await onSubmit({
                member1Id,
                member2Id,
                relationshipType,
                relationSubtype,
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to add relationship');
        }
    };

    const getMemberLabel = (m: FamilyMemberWithPerson) => {
        const name = m.display_name || m.person?.canonical_name || 'Unknown';
        const birth = m.person?.birth_date ? ` (b. ${new Date(m.person.birth_date).getFullYear()})` : '';
        return `${name}${birth}`;
    };

    const getLabel1 = () => {
        switch (relationshipType) {
            case 'parent_child': return 'Parent';
            case 'spouse': return 'Person 1';
            case 'sibling': return 'Sibling 1';
            default: return 'Person 1';
        }
    };

    const getLabel2 = () => {
        switch (relationshipType) {
            case 'parent_child': return 'Child';
            case 'spouse': return 'Person 2';
            case 'sibling': return 'Sibling 2';
            default: return 'Person 2';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="card max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <GitBranch className="w-6 h-6 text-purple-600" />
                        Add Relationship
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Relationship Type Selector */}
                    <div>
                        <label className="label">Relationship Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['parent_child', 'spouse', 'sibling'] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handleTypeChange(type)}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${relationshipType === type
                                            ? type === 'parent_child'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                : type === 'spouse'
                                                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
                                                    : 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                                        }`}
                                >
                                    {TYPE_ICONS[type]}
                                    {type === 'parent_child' ? 'Parent–Child' : type === 'spouse' ? 'Spouse' : 'Sibling'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="member1" className="label">{getLabel1()}</label>
                        <select
                            id="member1"
                            value={member1Id}
                            onChange={(e) => setMember1Id(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Select {getLabel1().toLowerCase()}...</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id} disabled={m.id === member2Id}>
                                    {getMemberLabel(m)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="member2" className="label">{getLabel2()}</label>
                        <select
                            id="member2"
                            value={member2Id}
                            onChange={(e) => setMember2Id(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Select {getLabel2().toLowerCase()}...</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id} disabled={m.id === member1Id}>
                                    {getMemberLabel(m)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="subtype" className="label">Subtype</label>
                        <select
                            id="subtype"
                            value={relationSubtype}
                            onChange={(e) => setRelationSubtype(e.target.value)}
                            className="input-field"
                        >
                            {SUBTYPES_BY_TYPE[relationshipType].map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn-primary flex-1" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Relationship'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddRelationshipModal;
