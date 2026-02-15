import { useMemo } from 'react';
import type { FamilyMemberWithPerson } from './useFamilyMembers';
import type { Relationship } from '../lib/supabase';

export interface TreeNode {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, any>;
    selectable?: boolean;
    draggable?: boolean;
}

export interface TreeEdge {
    id: string;
    source: string;
    target: string;
    type: string;
    animated: boolean;
    style: { stroke: string; strokeWidth: number; strokeDasharray?: string };
    label?: string;
    sourceHandle?: string;
    targetHandle?: string;
}

const NODE_W = 210;
const NODE_H = 100;
const H_GAP = 50;
const V_GAP = 150;
const SPOUSE_GAP = 40;
const BRANCH_GAP = 100;
const JUNC_Y_OFFSET = 25;

const EDGE_COLORS: Record<string, string> = {
    biological: '#3b82f6', adopted: '#8b5cf6', step: '#f59e0b',
    foster: '#6b7280', married: '#ec4899', partner: '#f97316',
    divorced: '#ef4444', half: '#14b8a6', full: '#3b82f6',
};

interface FamilyUnit {
    primaryId: string;
    spouseIds: string[];
    allIds: string[];
    unitWidth: number;
    children: FamilyUnit[];
    subtreeWidth: number;
}

export const useTreeLayout = (
    members: FamilyMemberWithPerson[],
    relationships: Relationship[]
) => {
    return useMemo(() => {
        if (!members.length) return { nodes: [], edges: [] };

        const parentChildRels = relationships.filter(r => r.relationship_type === 'parent_child');
        const spouseRels = relationships.filter(r => r.relationship_type === 'spouse');
        const siblingRels = relationships.filter(r => r.relationship_type === 'sibling');

        const childToParents = new Map<string, Set<string>>();
        const parentToChildren = new Map<string, Set<string>>();
        parentChildRels.forEach(rel => {
            if (!childToParents.has(rel.member_2_id)) childToParents.set(rel.member_2_id, new Set());
            childToParents.get(rel.member_2_id)!.add(rel.member_1_id);
            if (!parentToChildren.has(rel.member_1_id)) parentToChildren.set(rel.member_1_id, new Set());
            parentToChildren.get(rel.member_1_id)!.add(rel.member_2_id);
        });

        const spouseMap = new Map<string, Set<string>>();
        spouseRels.forEach(rel => {
            if (!spouseMap.has(rel.member_1_id)) spouseMap.set(rel.member_1_id, new Set());
            spouseMap.get(rel.member_1_id)!.add(rel.member_2_id);
            if (!spouseMap.has(rel.member_2_id)) spouseMap.set(rel.member_2_id, new Set());
            spouseMap.get(rel.member_2_id)!.add(rel.member_1_id);
        });

        const memberMap = new Map(members.map(m => [m.id, m]));
        const allMemberIds = new Set(members.map(m => m.id));
        const usedInTree = new Set<string>();

        const getCoupleChildren = (ids: string[]): string[] => {
            const s = new Set<string>();
            ids.forEach(id => { parentToChildren.get(id)?.forEach(c => s.add(c)); });
            return Array.from(s);
        };

        const buildUnit = (pid: string): FamilyUnit | null => {
            if (usedInTree.has(pid)) return null;
            usedInTree.add(pid);
            const spouseIds: string[] = [];
            spouseMap.get(pid)?.forEach(sid => {
                if (!usedInTree.has(sid) && allMemberIds.has(sid)) {
                    usedInTree.add(sid);
                    spouseIds.push(sid);
                }
            });
            const allIds = [pid, ...spouseIds];
            const unitWidth = allIds.length * NODE_W + (allIds.length - 1) * SPOUSE_GAP;
            const childIds = getCoupleChildren(allIds).sort((a, b) => {
                const da = memberMap.get(a)?.person?.birth_date || '';
                const db = memberMap.get(b)?.person?.birth_date || '';
                if (da && db) return da.localeCompare(db);
                return (memberMap.get(a)?.person?.canonical_name || '').localeCompare(memberMap.get(b)?.person?.canonical_name || '');
            });
            const children: FamilyUnit[] = [];
            childIds.forEach(cid => { const u = buildUnit(cid); if (u) children.push(u); });
            const childrenW = children.length > 0
                ? children.reduce((s, c) => s + c.subtreeWidth, 0) + (children.length - 1) * H_GAP
                : 0;
            return { primaryId: pid, spouseIds, allIds, unitWidth, children, subtreeWidth: Math.max(unitWidth, childrenW) };
        };

        // Build root units
        const roots = members.filter(m => !childToParents.has(m.id));
        const isSpouseOfNonRoot = (id: string): boolean => {
            const spouses = spouseMap.get(id);
            if (!spouses) return false;
            for (const sid of spouses) {
                if (childToParents.has(sid)) return true; // spouse has parents → not a true root
            }
            return false;
        };
        roots.sort((a, b) => {
            const aPri = isSpouseOfNonRoot(a.id) ? 1 : 0;
            const bPri = isSpouseOfNonRoot(b.id) ? 1 : 0;
            return aPri - bPri;
        });

        const rootUnits: FamilyUnit[] = [];
        const processedRoots = new Set<string>();
        roots.forEach(r => {
            if (processedRoots.has(r.id) || usedInTree.has(r.id)) return;
            processedRoots.add(r.id);
            spouseMap.get(r.id)?.forEach(s => processedRoots.add(s));
            const u = buildUnit(r.id);
            if (u) rootUnits.push(u);
        });
        // Orphans
        members.forEach(m => {
            if (!usedInTree.has(m.id)) {
                usedInTree.add(m.id);
                rootUnits.push({ primaryId: m.id, spouseIds: [], allIds: [m.id], unitWidth: NODE_W, children: [], subtreeWidth: NODE_W });
            }
        });

        // Position nodes + build edges
        const posMap = new Map<string, { x: number; y: number }>();
        const nodes: TreeNode[] = [];
        const edges: TreeEdge[] = [];
        let jIdx = 0;

        const positionUnit = (unit: FamilyUnit, cx: number, y: number) => {
            // Position couple members
            const startX = cx - unit.unitWidth / 2;
            unit.allIds.forEach((id, i) => {
                const pos = { x: startX + i * (NODE_W + SPOUSE_GAP), y };
                posMap.set(id, pos);
                nodes.push({
                    id, type: 'familyMember', position: pos,
                    data: { member: memberMap.get(id), isRoot: !childToParents.has(id) },
                });
            });

            // Spouse edges (horizontal connection via left/right handles)
            for (let i = 0; i < unit.spouseIds.length; i++) {
                const leftId = i === 0 ? unit.primaryId : unit.spouseIds[i - 1];
                const rightId = unit.spouseIds[i];
                const rel = spouseRels.find(r =>
                    (r.member_1_id === leftId && r.member_2_id === rightId) ||
                    (r.member_1_id === rightId && r.member_2_id === leftId)
                );
                edges.push({
                    id: `spouse_${leftId}_${rightId}`,
                    source: leftId, sourceHandle: 'right',
                    target: rightId, targetHandle: 'left',
                    type: 'straight', animated: false,
                    style: { stroke: EDGE_COLORS[rel?.relation_subtype || 'married'] || '#ec4899', strokeWidth: 2, strokeDasharray: '6 3' },
                });
            }

            if (unit.children.length === 0) return;

            const childY = y + NODE_H + V_GAP;
            const childrenW = unit.children.reduce((s, c) => s + c.subtreeWidth, 0) + (unit.children.length - 1) * H_GAP;

            if (unit.allIds.length > 1) {
                // COUPLE: create junction node between parents, route children through it
                const firstPos = posMap.get(unit.allIds[0])!;
                const lastPos = posMap.get(unit.allIds[unit.allIds.length - 1])!;
                const midX = (firstPos.x + lastPos.x + NODE_W) / 2;
                const jId = `junc_${jIdx++}`;
                const jPos = { x: midX - 4, y: y + NODE_H + JUNC_Y_OFFSET };
                posMap.set(jId, jPos);
                nodes.push({ id: jId, type: 'junction', position: jPos, data: {}, selectable: false, draggable: false });

                // Each parent → junction (creates converging lines to center point)
                unit.allIds.forEach(pid => {
                    edges.push({
                        id: `pj_${pid}_${jId}`, source: pid, sourceHandle: 'bottom',
                        target: jId, targetHandle: 'top', type: 'straight', animated: false,
                        style: { stroke: '#94a3b8', strokeWidth: 2 },
                    });
                });

                // Junction → each child
                let childX = cx - childrenW / 2;
                unit.children.forEach(child => {
                    const ccx = childX + child.subtreeWidth / 2;
                    positionUnit(child, ccx, childY);
                    const rel = parentChildRels.find(r => unit.allIds.includes(r.member_1_id) && r.member_2_id === child.primaryId);
                    const sub = rel?.relation_subtype || 'biological';
                    edges.push({
                        id: `jc_${jId}_${child.primaryId}`, source: jId, sourceHandle: 'bottom',
                        target: child.primaryId, targetHandle: 'top', type: 'smoothstep', animated: false,
                        style: { stroke: EDGE_COLORS[sub] || '#3b82f6', strokeWidth: 2 },
                        label: sub !== 'biological' ? sub : undefined,
                    });
                    childX += child.subtreeWidth + H_GAP;
                });
            } else {
                // SINGLE PARENT: direct edges to children
                let childX = cx - childrenW / 2;
                unit.children.forEach(child => {
                    const ccx = childX + child.subtreeWidth / 2;
                    positionUnit(child, ccx, childY);
                    const rel = parentChildRels.find(r => r.member_1_id === unit.primaryId && r.member_2_id === child.primaryId);
                    const sub = rel?.relation_subtype || 'biological';
                    edges.push({
                        id: `pc_${unit.primaryId}_${child.primaryId}`, source: unit.primaryId, sourceHandle: 'bottom',
                        target: child.primaryId, targetHandle: 'top', type: 'smoothstep', animated: false,
                        style: { stroke: EDGE_COLORS[sub] || '#3b82f6', strokeWidth: 2 },
                        label: sub !== 'biological' ? sub : undefined,
                    });
                    childX += child.subtreeWidth + H_GAP;
                });
            }
        };

        // Layout all root units side by side
        const totalW = rootUnits.reduce((s, u) => s + u.subtreeWidth, 0) + (rootUnits.length - 1) * BRANCH_GAP;
        let sx = -totalW / 2;
        rootUnits.forEach(unit => {
            positionUnit(unit, sx + unit.subtreeWidth / 2, 0);
            sx += unit.subtreeWidth + BRANCH_GAP;
        });

        // Sibling edges — only show when siblings DON'T share a parent
        // (if they share parents, the tree structure already implies siblinghood)
        siblingRels.forEach(rel => {
            const parents1 = childToParents.get(rel.member_1_id);
            const parents2 = childToParents.get(rel.member_2_id);
            if (parents1 && parents2) {
                // Check if they share any parent
                let shareParent = false;
                for (const p of parents1) {
                    if (parents2.has(p)) { shareParent = true; break; }
                }
                if (shareParent) return; // skip — already shown via shared parent junction
            }
            const p1 = posMap.get(rel.member_1_id);
            const p2 = posMap.get(rel.member_2_id);
            if (!p1 || !p2) return;
            const leftId = p1.x < p2.x ? rel.member_1_id : rel.member_2_id;
            const rightId = leftId === rel.member_1_id ? rel.member_2_id : rel.member_1_id;
            edges.push({
                id: rel.id, source: leftId, sourceHandle: 'right',
                target: rightId, targetHandle: 'left', type: 'straight', animated: false,
                style: { stroke: EDGE_COLORS[rel.relation_subtype] || '#14b8a6', strokeWidth: 1.5, strokeDasharray: '3 3' },
            });
        });

        return { nodes, edges };
    }, [members, relationships]);
};
