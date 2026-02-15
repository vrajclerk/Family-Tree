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
    style: { stroke: string; strokeWidth: number; strokeDasharray?: string };
    label?: string;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 120;
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 100;
const SPOUSE_GAP = 30;

const EDGE_COLORS: Record<string, string> = {
    biological: '#3b82f6',
    adopted: '#8b5cf6',
    step: '#f59e0b',
    foster: '#6b7280',
    married: '#ec4899',
    partner: '#f97316',
    divorced: '#ef4444',
    half: '#14b8a6',
    full: '#3b82f6',
};

export const useTreeLayout = (
    members: FamilyMemberWithPerson[],
    relationships: Relationship[]
) => {
    const buildTree = useCallback(() => {
        if (!members.length) return { nodes: [], edges: [] };

        const parentChildRels = relationships.filter(r => r.relationship_type === 'parent_child');
        const spouseRels = relationships.filter(r => r.relationship_type === 'spouse');
        const siblingRels = relationships.filter(r => r.relationship_type === 'sibling');

        // Build parent-child adjacency
        const childToParents = new Map<string, string[]>();
        const parentToChildren = new Map<string, string[]>();

        parentChildRels.forEach((rel) => {
            const parents = childToParents.get(rel.member_2_id) || [];
            parents.push(rel.member_1_id);
            childToParents.set(rel.member_2_id, parents);

            const children = parentToChildren.get(rel.member_1_id) || [];
            children.push(rel.member_2_id);
            parentToChildren.set(rel.member_1_id, children);
        });

        // Build spouse map
        const spouseMap = new Map<string, string[]>();
        spouseRels.forEach((rel) => {
            const s1 = spouseMap.get(rel.member_1_id) || [];
            s1.push(rel.member_2_id);
            spouseMap.set(rel.member_1_id, s1);

            const s2 = spouseMap.get(rel.member_2_id) || [];
            s2.push(rel.member_1_id);
            spouseMap.set(rel.member_2_id, s2);
        });

        // Find root nodes (no parents in parent_child relationships)
        const rootIds = members
            .filter((m) => !childToParents.has(m.id))
            .map((m) => m.id);

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

            // Place spouses at the same generation
            const spouses = spouseMap.get(id) || [];
            spouses.forEach((spouseId) => {
                if (!visited.has(spouseId)) {
                    visited.add(spouseId);
                    generationMap.set(spouseId, gen);
                    queue.push({ id: spouseId, gen });
                }
            });

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

        // Position nodes — place spouses next to each other
        const memberMap = new Map(members.map((m) => [m.id, m]));
        const nodes: TreeNode[] = [];
        const positionMap = new Map<string, { x: number; y: number }>();

        generations.forEach((ids, gen) => {
            // Group spouses together
            const positioned = new Set<string>();
            const groups: string[][] = [];

            ids.forEach((id) => {
                if (positioned.has(id)) return;
                const group = [id];
                positioned.add(id);

                const spouses = spouseMap.get(id) || [];
                spouses.forEach((spouseId) => {
                    if (ids.includes(spouseId) && !positioned.has(spouseId)) {
                        group.push(spouseId);
                        positioned.add(spouseId);
                    }
                });
                groups.push(group);
            });

            // Calculate total width
            let totalWidth = 0;
            groups.forEach((group) => {
                totalWidth += group.length * NODE_WIDTH + (group.length - 1) * SPOUSE_GAP;
            });
            totalWidth += (groups.length - 1) * HORIZONTAL_GAP;

            let currentX = -totalWidth / 2;

            groups.forEach((group) => {
                group.forEach((id, idx) => {
                    const member = memberMap.get(id);
                    if (member) {
                        const pos = {
                            x: currentX + idx * (NODE_WIDTH + SPOUSE_GAP),
                            y: gen * (NODE_HEIGHT + VERTICAL_GAP),
                        };
                        positionMap.set(id, pos);
                        nodes.push({
                            id,
                            type: 'familyMember',
                            position: pos,
                            data: {
                                member,
                                isRoot: !childToParents.has(id),
                            },
                        });
                    }
                });
                currentX += group.length * (NODE_WIDTH + SPOUSE_GAP) + HORIZONTAL_GAP;
            });
        });

        // Build edges
        const edges: TreeEdge[] = [];

        // Parent-child edges
        parentChildRels.forEach((rel) => {
            edges.push({
                id: rel.id,
                source: rel.member_1_id,
                target: rel.member_2_id,
                type: 'smoothstep',
                animated: false,
                style: {
                    stroke: EDGE_COLORS[rel.relation_subtype] || '#3b82f6',
                    strokeWidth: 2,
                },
                label: rel.relation_subtype !== 'biological' ? rel.relation_subtype : undefined,
            });
        });

        // Spouse edges (dashed pink line)
        spouseRels.forEach((rel) => {
            edges.push({
                id: rel.id,
                source: rel.member_1_id,
                target: rel.member_2_id,
                type: 'straight',
                animated: false,
                style: {
                    stroke: EDGE_COLORS[rel.relation_subtype] || '#ec4899',
                    strokeWidth: 2,
                    strokeDasharray: '6 3',
                },
                label: rel.relation_subtype || 'spouse',
            });
        });

        // Sibling edges (dotted teal line)
        siblingRels.forEach((rel) => {
            edges.push({
                id: rel.id,
                source: rel.member_1_id,
                target: rel.member_2_id,
                type: 'straight',
                animated: false,
                style: {
                    stroke: EDGE_COLORS[rel.relation_subtype] || '#14b8a6',
                    strokeWidth: 1.5,
                    strokeDasharray: '3 3',
                },
                label: 'sibling',
            });
        });

        return { nodes, edges };
    }, [members, relationships]);

    return useMemo(() => buildTree(), [buildTree]);
};
