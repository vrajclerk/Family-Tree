import React, { useState } from 'react';
import { X, GitBranch, AlertCircle } from 'lucide-react';
import type { FamilyMemberWithPerson } from '../hooks/useFamilyMembers';

interface AddRelationshipModalProps {
    members: FamilyMemberWithPerson[];
    onClose: () => void;
    onSubmit: (data: {
        parentMemberId: string;
        childMemberId: string;
        relationType: string;
    }) => Promise<void>;
    preselectedMemberId?: string;
    loading?: boolean;
}

const AddRelationshipModal: React.FC<AddRelationshipModalProps> = ({
    members,
    onClose,
    onSubmit,
    preselectedMemberId,
    loading = false,
}) => {
    const [parentId, setParentId] = useState(preselectedMemberId || '');
    const [childId, setChildId] = useState('');
    const [relationType, setRelationType] = useState('biological');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!parentId || !childId) {
            setError('Please select both parent and child.');
            return;
        }
        if (parentId === childId) {
            setError('A person cannot be their own parent.');
            return;
        }

        try {
            await onSubmit({
                parentMemberId: parentId,
                childMemberId: childId,
                relationType,
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
                    <div>
                        <label htmlFor="parent" className="label">Parent</label>
                        <select
                            id="parent"
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Select parent...</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id} disabled={m.id === childId}>
                                    {getMemberLabel(m)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="child" className="label">Child</label>
                        <select
                            id="child"
                            value={childId}
                            onChange={(e) => setChildId(e.target.value)}
                            className="input-field"
                            required
                        >
                            <option value="">Select child...</option>
                            {members.map((m) => (
                                <option key={m.id} value={m.id} disabled={m.id === parentId}>
                                    {getMemberLabel(m)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="relType" className="label">Relationship Type</label>
                        <select
                            id="relType"
                            value={relationType}
                            onChange={(e) => setRelationType(e.target.value)}
                            className="input-field"
                        >
                            <option value="biological">Biological</option>
                            <option value="adopted">Adopted</option>
                            <option value="step">Step</option>
                            <option value="foster">Foster</option>
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
