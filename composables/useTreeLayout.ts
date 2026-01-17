import type { FamilyMember, FamilyRelationship, Position } from '~/types'

export const useTreeLayout = () => {
    const HORIZONTAL_SPACING = 250  // Space between nodes horizontally
    const VERTICAL_SPACING = 280    // Space between generations vertically
    const NODE_WIDTH = 180
    const NODE_HEIGHT = 200

    // Build relationship maps from the relationships array
    const buildMaps = (relationships: FamilyRelationship[]) => {
        const childrenMap = new Map<string, Set<string>>()  // parent -> children
        const parentMap = new Map<string, Set<string>>()    // child -> parents
        const spouseMap = new Map<string, Set<string>>()
        const siblingMap = new Map<string, Set<string>>()

        relationships.forEach(rel => {
            if (rel.relationship_type === 'parent') {
                // member is parent of related_member
                if (!childrenMap.has(rel.member_id)) {
                    childrenMap.set(rel.member_id, new Set())
                }
                childrenMap.get(rel.member_id)!.add(rel.related_member_id)

                // Also track that related_member has this parent
                if (!parentMap.has(rel.related_member_id)) {
                    parentMap.set(rel.related_member_id, new Set())
                }
                parentMap.get(rel.related_member_id)!.add(rel.member_id)
            } else if (rel.relationship_type === 'child') {
                // member is child of related_member (inverse of parent)
                if (!parentMap.has(rel.member_id)) {
                    parentMap.set(rel.member_id, new Set())
                }
                parentMap.get(rel.member_id)!.add(rel.related_member_id)

                // Also track that related_member has this child
                if (!childrenMap.has(rel.related_member_id)) {
                    childrenMap.set(rel.related_member_id, new Set())
                }
                childrenMap.get(rel.related_member_id)!.add(rel.member_id)
            } else if (rel.relationship_type === 'spouse') {
                if (!spouseMap.has(rel.member_id)) {
                    spouseMap.set(rel.member_id, new Set())
                }
                spouseMap.get(rel.member_id)!.add(rel.related_member_id)
            } else if (rel.relationship_type === 'sibling') {
                if (!siblingMap.has(rel.member_id)) {
                    siblingMap.set(rel.member_id, new Set())
                }
                siblingMap.get(rel.member_id)!.add(rel.related_member_id)
            }
        })

        return { childrenMap, parentMap, spouseMap, siblingMap }
    }

    // Calculate positions for all members based on relationships
    const calculateLayout = (
        members: FamilyMember[],
        relationships: FamilyRelationship[]
    ): Map<string, Position> => {
        if (members.length === 0) return new Map()

        const positions = new Map<string, Position>()
        const { childrenMap, parentMap, spouseMap } = buildMaps(relationships)

        // DEBUG: Log relationship data
        console.log('=== TREE LAYOUT DEBUG ===')
        console.log('Members:', members.map(m => ({ id: m.id.slice(0, 8), name: `${m.first_name} ${m.last_name}` })))
        console.log('Relationships:', relationships.map(r => ({
            from: r.member_id.slice(0, 8),
            to: r.related_member_id.slice(0, 8),
            type: r.relationship_type
        })))
        console.log('Children map:', Array.from(childrenMap.entries()).map(([k, v]) => ({
            parent: k.slice(0, 8),
            children: Array.from(v).map(c => c.slice(0, 8))
        })))
        console.log('Parent map:', Array.from(parentMap.entries()).map(([k, v]) => ({
            child: k.slice(0, 8),
            parents: Array.from(v).map(p => p.slice(0, 8))
        })))

        // Find root members (those with no parents - they go on top)
        const roots = members.filter(m => {
            const parents = parentMap.get(m.id)
            return !parents || parents.size === 0
        })

        console.log('Root members (no parents):', roots.map(m => `${m.first_name} ${m.last_name}`))

        // If everyone has parents (circular?), just use first member as root
        const startMembers = roots.length > 0 ? roots : [members[0]]

        // Calculate generation/level for each member
        const levels = new Map<string, number>()
        const visited = new Set<string>()

        const assignLevels = (memberId: string, level: number) => {
            if (visited.has(memberId)) return
            visited.add(memberId)

            // Assign this member's level (keep max if already assigned)
            const currentLevel = levels.get(memberId) ?? -1
            levels.set(memberId, Math.max(currentLevel, level))

            // Process children at next level down
            const children = childrenMap.get(memberId)
            if (children) {
                children.forEach(childId => {
                    assignLevels(childId, level + 1)
                })
            }

            // Process spouse at same level
            const spouses = spouseMap.get(memberId)
            if (spouses) {
                spouses.forEach(spouseId => {
                    if (!visited.has(spouseId)) {
                        levels.set(spouseId, level)
                        visited.add(spouseId)
                    }
                })
            }
        }

        // Start from roots
        startMembers.forEach(root => assignLevels(root.id, 0))

        // Assign any unvisited members to level 0
        members.forEach(m => {
            if (!levels.has(m.id)) {
                levels.set(m.id, 0)
            }
        })

        // Group members by level
        const membersByLevel = new Map<number, FamilyMember[]>()
        members.forEach(m => {
            const level = levels.get(m.id) || 0
            if (!membersByLevel.has(level)) {
                membersByLevel.set(level, [])
            }
            membersByLevel.get(level)!.push(m)
        })

        // Position members level by level
        const sortedLevels = Array.from(membersByLevel.keys()).sort((a, b) => a - b)

        sortedLevels.forEach(level => {
            const membersAtLevel = membersByLevel.get(level) || []
            const levelWidth = membersAtLevel.length * HORIZONTAL_SPACING
            const startX = -levelWidth / 2 + HORIZONTAL_SPACING / 2

            membersAtLevel.forEach((member, index) => {
                positions.set(member.id, {
                    x: startX + index * HORIZONTAL_SPACING,
                    y: level * VERTICAL_SPACING
                })
            })
        })

        return positions
    }

    // Get connection points between two members for drawing branches
    const getConnectionPoints = (
        fromPos: Position,
        toPos: Position,
        relationshipType: string
    ): { start: Position; end: Position; controlPoints: Position[] } => {
        const startX = fromPos.x + NODE_WIDTH / 2
        const startY = fromPos.y + NODE_HEIGHT
        const endX = toPos.x + NODE_WIDTH / 2
        const endY = toPos.y

        if (relationshipType === 'parent' || relationshipType === 'child') {
            const midY = (startY + endY) / 2
            return {
                start: { x: startX, y: startY },
                end: { x: endX, y: endY },
                controlPoints: [
                    { x: startX, y: midY },
                    { x: endX, y: midY }
                ]
            }
        }

        if (relationshipType === 'spouse' || relationshipType === 'sibling') {
            const y = fromPos.y + NODE_HEIGHT / 2
            return {
                start: { x: fromPos.x + NODE_WIDTH, y },
                end: { x: toPos.x, y },
                controlPoints: []
            }
        }

        return {
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            controlPoints: []
        }
    }

    // Generate SVG path for a branch
    const generateBranchPath = (
        fromPos: Position,
        toPos: Position,
        relationshipType: string
    ): string => {
        const { start, end, controlPoints } = getConnectionPoints(fromPos, toPos, relationshipType)

        if (controlPoints.length === 0) {
            return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
        }

        if (controlPoints.length === 2) {
            return `M ${start.x} ${start.y} C ${controlPoints[0].x} ${controlPoints[0].y}, ${controlPoints[1].x} ${controlPoints[1].y}, ${end.x} ${end.y}`
        }

        return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
    }

    return {
        calculateLayout,
        getConnectionPoints,
        generateBranchPath,
        HORIZONTAL_SPACING,
        VERTICAL_SPACING,
        NODE_WIDTH,
        NODE_HEIGHT
    }
}
