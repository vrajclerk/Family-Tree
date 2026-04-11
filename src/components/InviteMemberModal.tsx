import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InviteMemberModalProps {
    familyId: string;
    onClose: () => void;
    onInviteCreated: () => void;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ familyId, onClose, onInviteCreated }) => {
    const { user } = useAuth();
    const [role, setRole] = useState<'admin' | 'contributor' | 'viewer'>('viewer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setError('');

        try {
            const { data, error } = await supabase
                .from('family_invitations')
                .insert({
                    family_id: familyId,
                    role,
                    invited_by: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // Generate link and copy immediately
            const link = `${window.location.origin}/invite/${data.id}`;
            try {
                await navigator.clipboard.writeText(link);
            } catch (err) {
                console.error("Clipboard copy failed: ", err);
            }
            
            onInviteCreated();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to generate invitation.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="card max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="w-6 h-6 text-blue-600" />
                        Create Invite Link
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleCreateInvite} className="space-y-4">
                    <div>
                        <label className="label mb-2">Role for new member</label>
                        <div className="space-y-2">
                            <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="admin" 
                                    checked={role === 'admin'} 
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-medium">Admin</span>
                                    <span className="block text-xs text-slate-500">Can invite others, edit family details, and modify everything.</span>
                                </div>
                            </label>
                            <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="contributor" 
                                    checked={role === 'contributor'} 
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-medium">Contributor</span>
                                    <span className="block text-xs text-slate-500">Can add members, edit relationships, and upload photos.</span>
                                </div>
                            </label>
                            <label className="flex items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="viewer" 
                                    checked={role === 'viewer'} 
                                    onChange={(e) => setRole(e.target.value as any)}
                                    className="text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-medium">Viewer</span>
                                    <span className="block text-xs text-slate-500">Can only view the family tree and member profiles.</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary flex-1" disabled={loading}>
                            {loading ? 'Generating...' : 'Generate Link'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteMemberModal;
