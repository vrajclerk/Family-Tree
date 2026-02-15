import React, { useCallback, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, TreePine, Users, GitBranch } from 'lucide-react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    type Node,
    type NodeProps,
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFamilyMembers, type FamilyMemberWithPerson } from '../hooks/useFamilyMembers';
import { useRelationships } from '../hooks/useRelationships';
import { useTreeLayout } from '../hooks/useTreeLayout';
import { supabase, type Family } from '../lib/supabase';

// Custom Tree Node Component
const FamilyMemberNode: React.FC<NodeProps> = ({ data }) => {
    const member: FamilyMemberWithPerson = data.member;
    const person = member.person;

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

    const getBorderColor = (gender?: string) => {
        switch (gender) {
            case 'male': return 'border-blue-400';
            case 'female': return 'border-pink-400';
            default: return 'border-slate-400';
        }
    };

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 ${getBorderColor(person?.gender)} p-3 min-w-[180px] hover:shadow-xl transition-all duration-200 cursor-pointer`}>
            <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />

            <div className="flex items-center gap-3">
                {person?.photo_url ? (
                    <img src={person.photo_url} alt="" className="w-10 h-10 rounded-full object-cover shadow-md" />
                ) : (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGenderColor(person?.gender)} flex items-center justify-center text-white text-lg shadow-md`}>
                        {getGenderEmoji(person?.gender)}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-slate-900 dark:text-slate-100">
                        {member.display_name || person?.canonical_name || 'Unknown'}
                    </p>
                    {person?.birth_date && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(person.birth_date).getFullYear()}
                            {person?.death_date ? ` — ${new Date(person.death_date).getFullYear()}` : ''}
                        </p>
                    )}
                    {person?.occupation && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{person.occupation}</p>
                    )}
                </div>
            </div>

            {!member.is_living && (
                <div className="mt-2 text-center">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        Deceased
                    </span>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
        </div>
    );
};

const nodeTypes = {
    familyMember: FamilyMemberNode,
};

const TreeView: React.FC = () => {
    const { familyId } = useParams<{ familyId: string }>();
    const navigate = useNavigate();
    const [family, setFamily] = useState<Family | null>(null);

    const { members, isLoading: membersLoading } = useFamilyMembers(familyId || '');
    const { relationships, isLoading: relsLoading } = useRelationships(familyId || '');
    const { nodes: layoutNodes, edges: layoutEdges } = useTreeLayout(members, relationships);

    const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Update nodes/edges when layout changes
    React.useEffect(() => {
        if (layoutNodes.length > 0) {
            setNodes(layoutNodes as Node[]);
            setEdges(layoutEdges);
        }
    }, [layoutNodes, layoutEdges, setNodes, setEdges]);

    // Fetch family info
    React.useEffect(() => {
        if (familyId) {
            supabase.from('families').select('*').eq('id', familyId).single()
                .then(({ data }) => setFamily(data));
        }
    }, [familyId]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        navigate(`/family/${familyId}/member/${node.id}`);
    }, [familyId, navigate]);

    const isLoading = membersLoading || relsLoading;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Top Bar */}
            <div className="glass border-b border-slate-200/50 dark:border-slate-700/50 px-6 py-3 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/family/${familyId}`)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <TreePine className="w-6 h-6 text-blue-600" />
                        <span className="font-bold text-lg">{family?.name || 'Family'} — Tree View</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {members.length} members
                    </span>
                    <span className="flex items-center gap-1">
                        <GitBranch className="w-4 h-4" />
                        {relationships.length} relationships
                    </span>
                </div>
            </div>

            {/* Tree Canvas */}
            {members.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <TreePine className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">No Members Yet</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">Add members to your family to see the tree visualization.</p>
                        <Link
                            to={`/family/${familyId}`}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go to Family View
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex-1">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.3 }}
                        minZoom={0.1}
                        maxZoom={2}
                        attributionPosition="bottom-left"
                    >
                        <Controls showInteractive={false} />
                        <Background color="#94a3b8" gap={20} size={1} />
                    </ReactFlow>
                </div>
            )}

            {/* Legend */}
            <div className="glass border-t border-slate-200/50 dark:border-slate-700/50 px-6 py-2 flex items-center gap-6 text-xs text-slate-500 flex-wrap">
                <span className="font-medium">Relationships:</span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-blue-500 inline-block"></span> Biological
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-purple-500 inline-block"></span> Adopted
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-amber-500 inline-block"></span> Step
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-slate-500 inline-block"></span> Foster
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-pink-500 inline-block" style={{ borderTop: '2px dashed #ec4899', height: 0 }}></span> 💍 Spouse
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-4 h-0.5 bg-teal-500 inline-block" style={{ borderTop: '2px dotted #14b8a6', height: 0 }}></span> Sibling
                </span>
            </div>
        </div>
    );
};

export default TreeView;
