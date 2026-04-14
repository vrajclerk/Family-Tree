import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Users, Mail, UserMinus, ShieldAlert, AlertCircle, Plus, Copy, Check, ArrowLeft } from 'lucide-react';
import { supabase, type FamilyMembership, type FamilyInvitation } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import InviteMemberModal from '../components/InviteMemberModal';

export const FamilySettings: React.FC = () => {
    const { familyId } = useParams<{ familyId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [memberships, setMemberships] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyInviteLink = async (inviteId: string) => {
        const link = `${window.location.origin}/invite/${inviteId}`;
        try {
            await navigator.clipboard.writeText(link);
            setCopiedId(inviteId);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const fetchSettingsData = async () => {
        if (!familyId || !user) return;
        setLoading(true);
        setError('');
        
        try {
            // Fetch memberships
            const { data: memData, error: memError } = await supabase
                .from('family_memberships')
                .select(`
                    id, role, accepted, user_id,
                    users!family_memberships_user_id_fkey ( email, full_name )
                `)
                .eq('family_id', familyId);
                
            if (memError) throw memError;
            
            const currentUserMem = memData?.find(m => m.user_id === user.id);
            if (!currentUserMem || !['owner', 'admin'].includes(currentUserMem.role)) {
                navigate(`/family/${familyId}`);
                return;
            }
            setCurrentUserRole(currentUserMem.role);
            setMemberships(memData || []);

            // Fetch pending invitations
            const { data: invData, error: invError } = await supabase
                .from('family_invitations')
                .select('*')
                .eq('family_id', familyId);
                
            if (invError) throw invError;
            setInvitations(invData || []);
            
        } catch (err: any) {
            setError(err.message || 'Failed to load settings.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettingsData();
    }, [familyId, user]);

    const handleUpdateRole = async (membershipId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('family_memberships')
                .update({ role: newRole })
                .eq('id', membershipId);
                
            if (error) throw error;
            fetchSettingsData();
        } catch (err: any) {
            alert(err.message || 'Failed to update role');
        }
    };

    const handleRemoveMember = async (membershipId: string) => {
        if (!window.confirm('Are you sure you want to remove this member from the family tree?')) return;
        try {
            const { error } = await supabase
                .from('family_memberships')
                .delete()
                .eq('id', membershipId);
                
            if (error) throw error;
            fetchSettingsData();
        } catch (err: any) {
            alert(err.message || 'Failed to remove member');
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        if (!window.confirm('Are you sure you want to revoke this invitation link?')) return;
        try {
            const { error } = await supabase
                .from('family_invitations')
                .delete()
                .eq('id', inviteId);
                
            if (error) throw error;
            fetchSettingsData();
        } catch (err: any) {
            alert(err.message || 'Failed to revoke invitation');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 3000);
    };

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => navigate(`/family/${familyId}`)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-bold">Family Settings</span>
                </div>
            </nav>

            <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto relative">
                <div className="flex items-center gap-3 mb-8">
                    <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-3xl font-bold">Settings</h1>
                </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2 text-red-600">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <div className="card mb-8">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-600" />
                            Active Members
                        </h2>
                        <p className="text-sm text-slate-500">Manage people who have access to this family tree.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {memberships.map((mem) => {
                        const isSelf = mem.user_id === user?.id;
                        return (
                            <div key={mem.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="font-semibold">{mem.users?.full_name || mem.users?.email}</p>
                                    <p className="text-sm text-slate-500">{mem.users?.email}</p>
                                    {!mem.accepted && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded mt-1 inline-block">Invite Pending Logic</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                    {isSelf || (currentUserRole === 'admin' && mem.role === 'owner') || mem.role === 'owner' ? (
                                        <span className="text-sm font-bold uppercase tracking-wide text-slate-400 px-3 py-1">
                                            {mem.role}
                                        </span>
                                    ) : (
                                        <select
                                            value={mem.role}
                                            onChange={(e) => handleUpdateRole(mem.id, e.target.value)}
                                            className="input-field py-1.5 text-sm w-32"
                                            disabled={currentUserRole !== 'owner' && mem.role === 'admin'}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="contributor">Contributor</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                    )}
                                    
                                    {!isSelf && mem.role !== 'owner' && (currentUserRole === 'owner' || mem.role !== 'admin') && (
                                        <button 
                                            onClick={() => handleRemoveMember(mem.id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remove member"
                                        >
                                            <UserMinus className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="card">
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Mail className="w-5 h-5 text-teal-600" />
                            Pending Invitations
                        </h2>
                        <p className="text-sm text-slate-500">Active invite links that haven't been claimed yet.</p>
                    </div>
                    <button 
                        onClick={() => setShowInviteModal(true)}
                        className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
                    >
                        <Plus className="w-4 h-4" />
                        Create Invite
                    </button>
                </div>

                {invitations.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No pending invitations.</p>
                ) : (
                    <div className="space-y-4">
                        {invitations.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div>
                                    <p className="font-semibold flex items-center gap-2">
                                        Invite Link
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 font-mono">{window.location.origin}/invite/{inv.id.split('-')[0]}...</p>
                                    <p className="text-xs text-slate-400 mt-1">Created: {new Date(inv.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-bold uppercase tracking-wide text-slate-400 px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                                        {inv.role}
                                    </span>
                                    <button
                                        onClick={() => copyInviteLink(inv.id)}
                                        className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-colors"
                                        title="Copy full invite link"
                                    >
                                        {copiedId === inv.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copiedId === inv.id ? 'Copied' : 'Copy'}
                                    </button>
                                    <button 
                                        onClick={() => handleRevokeInvite(inv.id)}
                                        className="text-sm text-red-500 hover:text-red-700 underline underline-offset-4"
                                    >
                                        Revoke
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showInviteModal && (
                <InviteMemberModal
                    familyId={familyId}
                    onClose={() => setShowInviteModal(false)}
                    onInviteCreated={() => {
                        fetchSettingsData();
                        showToast('Invite link copied to clipboard!');
                    }}
                />
            )}

            {toastMessage && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in fade-in zoom-in duration-300">
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
                        <Check className="w-6 h-6 text-green-400" />
                        <span className="font-medium text-lg">{toastMessage}</span>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
};

export default FamilySettings;
