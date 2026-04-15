import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

const AcceptInvite: React.FC = () => {
    const { inviteId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [invite, setInvite] = useState<any>(null);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        if (!inviteId) {
            setError('Invalid invitation link');
            setLoading(false);
            return;
        }

        const fetchInvite = async () => {
            try {
                // Fetch the invite ignoring the RLS policies by relying on public select access
                const { data, error } = await supabase
                    .from('family_invitations')
                    .select(`
                        id,
                        role,
                        family_id,
                        created_at,
                        families (name)
                    `)
                    .eq('id', inviteId)
                    .single();

                if (error || !data) {
                    throw new Error('This invitation link is invalid or has expired.');
                }

                // Check if invitation has expired (older than 7 days)
                const createdAt = new Date(data.created_at);
                if (Date.now() - createdAt.getTime() > 7 * 24 * 60 * 60 * 1000) {
                    throw new Error('This invitation has expired. Please request a new one.');
                }

                setInvite(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchInvite();
    }, [inviteId]);

    const handleAccept = async () => {
        if (!user || !invite) return;
        setAccepting(true);
        setError('');

        try {
            // First accept the membership
            const { error: membershipError } = await supabase
                .from('family_memberships')
                .insert({
                    family_id: invite.family_id,
                    user_id: user.id,
                    role: invite.role,
                    accepted: true
                });

            if (membershipError) {
                // If it's a unique constraint error, they are already a member
                if (membershipError.code === '23505') {
                    // Just delete the invite and move on
                } else {
                    throw membershipError;
                }
            }

            // Then delete the invite
            await supabase
                .from('family_invitations')
                .delete()
                .eq('id', invite.id);

            // Redirect to the family view
            navigate(`/family/${invite.family_id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to accept invitation.');
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
                <div className="card max-w-md w-full text-center py-12">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900">
            <div className="card max-w-md w-full text-center py-12">
                <Mail className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4">You're Invited!</h2>
                
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
                    You have been invited to join the <span className="font-bold text-slate-900 dark:text-white">{invite?.families?.name}</span> family tree.
                </p>
                <p className="text-sm text-slate-500 mb-8">
                    Role: <span className="uppercase text-xs font-bold tracking-wider px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{invite?.role}</span>
                </p>

                {!user ? (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Please sign in or create an account to accept this invitation.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate('/signin', { state: { returnTo: `/invite/${inviteId}` } })} className="btn-primary w-full">
                                Sign In
                            </button>
                            <button onClick={() => navigate('/signup', { state: { returnTo: `/invite/${inviteId}` } })} className="btn-secondary w-full">
                                Create Account
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                            Signed in as {user.email}
                        </div>
                        <button 
                            onClick={handleAccept} 
                            disabled={accepting}
                            className="btn-primary w-full text-lg py-3"
                        >
                            {accepting ? 'Accepting...' : 'Accept Invitation'}
                        </button>
                        <button onClick={() => navigate('/dashboard')} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                            Decline and go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcceptInvite;
