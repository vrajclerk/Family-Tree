import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TreePine, Plus, Users, LogOut, TreeDeciduous } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type FamilyMembership } from '../lib/supabase';

const Dashboard: React.FC = () => {
    const { user, userProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const [families, setFamilies] = useState<FamilyMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchFamilies();
    }, [user]);

    const fetchFamilies = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('family_memberships')
                .select(`
          *,
          family:families(*)
        `)
                .eq('user_id', user.id)
                .eq('accepted', true);

            if (error) throw error;
            setFamilies(data || []);
        } catch (error) {
            console.error('Error fetching families:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="glass fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TreePine className="w-8 h-8 text-blue-600" />
                        <span className="text-2xl font-bold gradient-text">FamilyTree</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            {userProfile?.full_name || user?.email}
                        </span>
                        <button onClick={handleSignOut} className="btn-secondary flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="pt-24 pb-12 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold mb-4">
                            Welcome back, <span className="gradient-text">{userProfile?.full_name?.split(' ')[0] || 'there'}</span>!
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Manage your family trees and continue building your legacy
                        </p>
                    </div>

                    {/* Create New Family Button */}
                    <div className="mb-8">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Family Tree
                        </button>
                    </div>

                    {/* Families Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : families.length === 0 ? (
                        <div className="card text-center py-16">
                            <TreeDeciduous className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Family Trees Yet</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Create your first family tree to get started
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn-primary inline-flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Create Family Tree
                            </button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {families.map((membership) => (
                                <FamilyCard
                                    key={membership.id}
                                    membership={membership}
                                    onClick={() => navigate(`/family/${membership.family_id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Family Modal */}
            {showCreateModal && (
                <CreateFamilyModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchFamilies();
                    }}
                />
            )}
        </div>
    );
};

interface FamilyCardProps {
    membership: FamilyMembership;
    onClick: () => void;
}

const FamilyCard: React.FC<FamilyCardProps> = ({ membership, onClick }) => {
    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'admin':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'contributor':
                return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div
            onClick={onClick}
            className="card cursor-pointer group hover:scale-105 transition-all duration-300"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <TreePine className="w-6 h-6" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(membership.role)}`}>
                    {membership.role}
                </span>
            </div>
            <h3 className="text-xl font-bold mb-2">{membership.family?.name}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                {membership.family?.description || 'No description'}
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>View Tree</span>
                </div>
            </div>
        </div>
    );
};

interface CreateFamilyModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CreateFamilyModal: React.FC<CreateFamilyModalProps> = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError('');

        try {
            // Hash password (in production, this should be done server-side)
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create family
            const { data: family, error: familyError } = await supabase
                .from('families')
                .insert([
                    {
                        name,
                        description,
                        owner_user_id: user.id,
                        owner_password_hash: hashedPassword,
                    },
                ])
                .select()
                .single();

            if (familyError) throw familyError;

            // Create owner membership
            const { error: membershipError } = await supabase
                .from('family_memberships')
                .insert([
                    {
                        family_id: family.id,
                        user_id: user.id,
                        role: 'owner',
                        accepted: true,
                    },
                ]);

            if (membershipError) throw membershipError;

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create family tree');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="card max-w-md w-full">
                <h2 className="text-2xl font-bold mb-6">Create New Family Tree</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="label">
                            Family Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input-field"
                            placeholder="The Smith Family"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="label">
                            Description (Optional)
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field"
                            rows={3}
                            placeholder="A brief description of your family tree..."
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="label">
                            Owner Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="Secure password for this family tree"
                            required
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            This password protects your family tree. Keep it safe!
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Dashboard;
