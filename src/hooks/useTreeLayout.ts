import { useCallback, useMemo } from 'react';
import type { FamilyMemberWithPerson } from './useFamilyMembers';
import type { Relationship } from '../lib/supabase';

export interface TreeNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
        member: FamilyMemberWithPerson;
        isRoot: boolean;
    };
}

export interface TreeEdge {
    id: string;
    source: string;
    target: string;
    type: string;
    animated: boolean;
    style: { stroke: string; strokeWidth: number };
    label?: string;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 100;

export const useTreeLayout = (
    members: FamilyMemberWithPerson[],
    relationships: Relationship[]
) => {
    const buildTree = useCallback(() => {
        if (!members.length) return { nodes: [], edges: [] };

        // Build adjacency maps
        const childToParents = new Map<string, string[]>();
        const parentToChildren = new Map<string, string[]>();

        relationships.forEach((rel) => {
            // child -> parents
            const parents = childToParents.get(rel.child_member_id) || [];
            parents.push(rel.parent_member_id);
            childToParents.set(rel.child_member_id, parents);

            // parent -> children
            const children = parentToChildren.get(rel.parent_member_id) || [];
            children.push(rel.child_member_id);
            parentToChildren.set(rel.parent_member_id, children);
        });

        // Find root nodes (no parents)
        const rootIds = members
            .filter((m) => !childToParents.has(m.id))
            .map((m) => m.id);

        // If no clear roots found, use all members
        const startIds = rootIds.length > 0 ? rootIds : members.map((m) => m.id);

        // BFS to assign generations
        const generationMap = new Map<string, number>();
        const visited = new Set<string>();
        const queue: { id: string; gen: number }[] = [];

        startIds.forEach((id) => {
            if (!visited.has(id)) {
                queue.push({ id, gen: 0 });
                visited.add(id);
            }
        });

        while (queue.length > 0) {
            const { id, gen } = queue.shift()!;
            generationMap.set(id, gen);

            const children = parentToChildren.get(id) || [];
            children.forEach((childId) => {
                if (!visited.has(childId)) {
                    visited.add(childId);
                    queue.push({ id: childId, gen: gen + 1 });
                }
            });
        }

        // Handle members with no relationships
        members.forEach((m) => {
            if (!generationMap.has(m.id)) {
                generationMap.set(m.id, 0);
            }
        });

        // Group by generation
        const generations = new Map<number, string[]>();
        generationMap.forEach((gen, id) => {
            const ids = generations.get(gen) || [];
            ids.push(id);
            generations.set(gen, ids);
        });

        // Position nodes
        const memberMap = new Map(members.map((m) => [m.id, m]));
        const nodes: TreeNode[] = [];

        generations.forEach((ids, gen) => {
            const totalWidth = ids.length * (NODE_WIDTH + HORIZONTAL_GAP) - HORIZONTAL_GAP;
            const startX = -totalWidth / 2;

            ids.forEach((id, index) => {
                const member = memberMap.get(id);
                if (member) {
                    nodes.push({
                        id,
                        type: 'familyMember',
                        position: {
                            x: startX + index * (NODE_WIDTH + HORIZONTAL_GAP),
                            y: gen * (NODE_HEIGHT + VERTICAL_GAP),
                        },
                        data: {
                            member,
                            isRoot: !childToParents.has(id),
                        },
                    });
                }
            });
        });

        // Build edges
        const edges: TreeEdge[] = relationships.map((rel) => ({
            id: rel.id,
            source: rel.parent_member_id,
            target: rel.child_member_id,
            type: 'smoothstep',
            animated: false,
            style: {
                stroke: rel.relation_type === 'biological' ? '#3b82f6' :
                    rel.relation_type === 'adopted' ? '#8b5cf6' :
                        rel.relation_type === 'step' ? '#f59e0b' : '#6b7280',
                strokeWidth: 2,
            },
            label: rel.relation_type !== 'biological' ? rel.relation_type : undefined,
        }));

        return { nodes, edges };
    }, [members, relationships]);

    return useMemo(() => buildTree(), [buildTree]);
};
