import React, { useState } from 'react';
import { X, UserPlus, Search, AlertCircle, LinkIcon } from 'lucide-react';
import { useDuplicateDetection } from '../hooks/useDuplicateDetection';

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
    }) => Promise<void>;
    loading?: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onSubmit, loading = false }) => {
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

    const { data: duplicates, isLoading: checkingDuplicates } = useDuplicateDetection(name, birthDate || undefined);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() && !selectedExistingPerson) {
            setError('Please enter a name or select an existing person.');
            return;
        }

        try {
            if (selectedExistingPerson) {
                await onSubmit({
                    existingPersonId: selectedExistingPerson,
                    displayName: displayName || undefined,
                    notes: notes || undefined,
                    isLiving,
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

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
