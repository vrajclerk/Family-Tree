import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Clock, BookOpen, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type Family, type FamilyHistory as FamilyHistoryType } from '../lib/supabase';
import { useFamilyMembers } from '../hooks/useFamilyMembers';

const FamilyHistory: React.FC = () => {
    const { familyId } = useParams<{ familyId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [family, setFamily] = useState<Family | null>(null);
    const [history, setHistory] = useState<FamilyHistoryType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const { members } = useFamilyMembers(familyId || '');

    useEffect(() => {
        if (familyId) {
            fetchData();
        }
    }, [familyId]);

    const fetchData = async () => {
        if (!familyId) return;
        try {
            const [familyRes, historyRes] = await Promise.all([
                supabase.from('families').select('*').eq('id', familyId).single(),
                supabase.from('family_history').select('*').eq('family_id', familyId).order('event_date', { ascending: false, nullsFirst: false }),
            ]);
            if (familyRes.data) setFamily(familyRes.data);
            if (historyRes.data) setHistory(historyRes.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddHistory = async (data: { title: string; body: string; eventDate: string; memberId?: string }) => {
        if (!familyId || !user) return;
        try {
            const { error } = await supabase.from('family_history').insert([{
                family_id: familyId,
                title: data.title,
                body: data.body || null,
                event_date: data.eventDate || null,
                member_id: data.memberId || null,
                created_by: user.id,
            }]);
            if (error) throw error;
            fetchData();
            setShowAddModal(false);
        } catch (err: any) {
            throw err;
        }
    };

    if (loading) {
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
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(`/family/${familyId}`)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-amber-600" />
                            <span className="text-lg font-bold">{family?.name} — History</span>
                        </div>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 text-sm">
                        <Plus className="w-4 h-4" />
                        Add Story
                    </button>
                </div>
            </nav>

            <div className="pt-24 pb-12 px-6">
                <div className="max-w-3xl mx-auto">
                    {history.length === 0 ? (
                        <div className="card text-center py-16">
                            <BookOpen className="w-14 h-14 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Stories Yet</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                Document your family's stories, events, and memories.
                            </p>
                            <button onClick={() => setShowAddModal(true)} className="btn-primary inline-flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Add First Story
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 to-amber-600 hidden sm:block"></div>

                            <div className="space-y-8">
                                {history.map((item) => {
                                    const linkedMember = item.member_id ? members.find(m => m.id === item.member_id) : null;
                                    return (
                                        <div key={item.id} className="relative sm:pl-16">
                                            {/* Timeline dot */}
                                            <div className="absolute left-4 top-6 w-5 h-5 rounded-full bg-amber-500 border-4 border-white dark:border-slate-900 shadow-md hidden sm:block"></div>

                                            <div className="card hover:shadow-xl transition-shadow">
                                                <div className="flex items-start justify-between mb-3">
                                                    <h3 className="text-lg font-bold">{item.title}</h3>
                                                    {item.event_date && (
                                                        <span className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center gap-1 whitespace-nowrap">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(item.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>

                                                {item.body && (
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
                                                        {item.body}
                                                    </p>
                                                )}

                                                {linkedMember && (
                                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                                        <button
                                                            onClick={() => navigate(`/family/${familyId}/member/${linkedMember.id}`)}
                                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            👤 {linkedMember.display_name || linkedMember.person?.canonical_name}
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Added {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add History Modal */}
            {showAddModal && (
                <AddHistoryModal
                    members={members}
                    onClose={() => setShowAddModal(false)}
                    onSubmit={handleAddHistory}
                />
            )}
        </div>
    );
};

interface AddHistoryModalProps {
    members: any[];
    onClose: () => void;
    onSubmit: (data: { title: string; body: string; eventDate: string; memberId?: string }) => Promise<void>;
}

const AddHistoryModal: React.FC<AddHistoryModalProps> = ({ members, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [memberId, setMemberId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) { setError('Title is required'); return; }
        setLoading(true);
        setError('');
        try {
            await onSubmit({ title, body, eventDate, memberId: memberId || undefined });
        } catch (err: any) {
            setError(err.message || 'Failed to add story');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="card max-w-lg w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-amber-600" />
                        Add Story
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="historyTitle" className="label">Title *</label>
                        <input id="historyTitle" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g., Wedding Day" required />
                    </div>
                    <div>
                        <label htmlFor="historyBody" className="label">Story</label>
                        <textarea id="historyBody" value={body} onChange={(e) => setBody(e.target.value)} className="input-field" rows={5} placeholder="Tell the story..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="historyDate" className="label">Event Date</label>
                            <input id="historyDate" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="input-field" />
                        </div>
                        <div>
                            <label htmlFor="historyMember" className="label">Related Member</label>
                            <select id="historyMember" value={memberId} onChange={(e) => setMemberId(e.target.value)} className="input-field">
                                <option value="">None</option>
                                {members.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.display_name || m.person?.canonical_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
                        <button type="submit" className="btn-primary flex-1" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Story'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FamilyHistory;
