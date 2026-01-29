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
        const { childrenMap, parentMap, spouseMap, siblingMap } = buildMaps(relationships)

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
        // Use a multi-pass approach to handle spouse synchronization correctly
        const levels = new Map<string, number>()

        // First pass: assign levels based purely on parent-child relationships
        const assignLevelsFromParents = (memberId: string, level: number, visited: Set<string>) => {
            if (visited.has(memberId)) {
                // Update level if this path gives a higher level
                const currentLevel = levels.get(memberId) ?? -1
                if (level > currentLevel) {
                    levels.set(memberId, level)
                }
                return
            }
            visited.add(memberId)

            // Assign this member's level (keep max if already assigned)
            const currentLevel = levels.get(memberId) ?? -1
            levels.set(memberId, Math.max(currentLevel, level))

            // Process children at next level down
            const children = childrenMap.get(memberId)
            if (children) {
                children.forEach(childId => {
                    assignLevelsFromParents(childId, level + 1, visited)
                })
            }
        }

        // Start from roots
        const visited = new Set<string>()
        startMembers.forEach(root => assignLevelsFromParents(root.id, 0, visited))

        // Assign any unvisited members to level 0
        members.forEach(m => {
            if (!levels.has(m.id)) {
                levels.set(m.id, 0)
            }
        })

        // Helper function to push down a member and all their descendants
        const pushDownSubtree = (memberId: string, minLevel: number): boolean => {
            const currentLevel = levels.get(memberId) || 0
            if (currentLevel >= minLevel) return false

            levels.set(memberId, minLevel)

            // Push down all children recursively
            const children = childrenMap.get(memberId)
            if (children) {
                children.forEach(childId => {
                    pushDownSubtree(childId, minLevel + 1)
                })
            }
            return true
        }

        // Second pass: synchronize spouse AND sibling levels
        // When syncing, also push down the entire subtree of the member whose level increases
        // Repeat until no changes (handles chains of relationships)
        let changed = true
        let iterations = 0
        while (changed && iterations < 30) {
            changed = false
            iterations++
            members.forEach(m => {
                const myLevel = levels.get(m.id) || 0

                // Sync with spouses - when one spouse's level is higher, 
                // the other spouse AND all their descendants must move down
                const spouses = spouseMap.get(m.id)
                if (spouses) {
                    spouses.forEach(spouseId => {
                        const spouseLevel = levels.get(spouseId) || 0
                        const maxLevel = Math.max(myLevel, spouseLevel)

                        // If my level is lower, push me and my subtree down
                        if (myLevel < maxLevel) {
                            levels.set(m.id, maxLevel)
                            // Push down all my children
                            const myChildren = childrenMap.get(m.id)
                            if (myChildren) {
                                myChildren.forEach(childId => {
                                    if (pushDownSubtree(childId, maxLevel + 1)) {
                                        changed = true
                                    }
                                })
                            }
                            changed = true
                        }

                        // If spouse's level is lower, push them and their subtree down
                        if (spouseLevel < maxLevel) {
                            levels.set(spouseId, maxLevel)
                            // Push down all spouse's children
                            const spouseChildren = childrenMap.get(spouseId)
                            if (spouseChildren) {
                                spouseChildren.forEach(childId => {
                                    if (pushDownSubtree(childId, maxLevel + 1)) {
                                        changed = true
                                    }
                                })
                            }
                            changed = true
                        }
                    })
                }

                // Sync with siblings
                const siblings = siblingMap.get(m.id)
                if (siblings) {
                    siblings.forEach(siblingId => {
                        const siblingLevel = levels.get(siblingId) || 0
                        const currentLevel = levels.get(m.id) || 0
                        const maxLevel = Math.max(currentLevel, siblingLevel)

                        if (currentLevel < maxLevel) {
                            levels.set(m.id, maxLevel)
                            const myChildren = childrenMap.get(m.id)
                            if (myChildren) {
                                myChildren.forEach(childId => {
                                    if (pushDownSubtree(childId, maxLevel + 1)) {
                                        changed = true
                                    }
                                })
                            }
                            changed = true
                        }

                        if (siblingLevel < maxLevel) {
                            levels.set(siblingId, maxLevel)
                            const siblingChildren = childrenMap.get(siblingId)
                            if (siblingChildren) {
                                siblingChildren.forEach(childId => {
                                    if (pushDownSubtree(childId, maxLevel + 1)) {
                                        changed = true
                                    }
                                })
                            }
                            changed = true
                        }
                    })
                }
            })
        }

        // Third pass: ensure all children are at least parent level + 1
        // This handles any edge cases and validates the tree structure
        changed = true
        iterations = 0
        while (changed && iterations < 10) {
            changed = false
            iterations++
            members.forEach(m => {
                const myLevel = levels.get(m.id) || 0
                const children = childrenMap.get(m.id)
                if (children) {
                    children.forEach(childId => {
                        const childLevel = levels.get(childId) || 0
                        if (childLevel <= myLevel) {
                            levels.set(childId, myLevel + 1)
                            changed = true
                        }
                    })
                }
            })
        }

        // Group members by level
        const membersByLevel = new Map<number, FamilyMember[]>()
        members.forEach(m => {
            const level = levels.get(m.id) || 0
            if (!membersByLevel.has(level)) {
                membersByLevel.set(level, [])
            }
            membersByLevel.get(level)!.push(m)
        })

        // Position members level by level, centering children under their parents
        const sortedLevels = Array.from(membersByLevel.keys()).sort((a, b) => a - b)

        sortedLevels.forEach(level => {
            const membersAtLevel = membersByLevel.get(level) || []

            // Group spouses together: organize into units (single person or spouse pair)
            const positioned = new Set<string>()
            const units: { members: FamilyMember[], parentIds: Set<string> }[] = []

            membersAtLevel.forEach(member => {
                if (positioned.has(member.id)) return

                // Check if this member has a spouse at the same level
                const spouses = spouseMap.get(member.id)
                const spouseAtSameLevel = spouses
                    ? Array.from(spouses).find(spouseId => {
                        const spouse = membersAtLevel.find(m => m.id === spouseId)
                        return spouse && !positioned.has(spouseId)
                    })
                    : null

                let unitMembers: FamilyMember[]
                if (spouseAtSameLevel) {
                    const spouse = membersAtLevel.find(m => m.id === spouseAtSameLevel)!
                    unitMembers = [member, spouse]
                    positioned.add(member.id)
                    positioned.add(spouseAtSameLevel)
                } else {
                    unitMembers = [member]
                    positioned.add(member.id)
                }

                // Collect all parent IDs for this unit
                const parentIds = new Set<string>()
                for (const m of unitMembers) {
                    const parents = parentMap.get(m.id)
                    if (parents) {
                        parents.forEach(p => parentIds.add(p))
                    }
                }

                units.push({ members: unitMembers, parentIds })
            })

            // Group units by their shared parents (siblings should be grouped together)
            const parentGroupKey = (parentIds: Set<string>) => Array.from(parentIds).sort().join(',')
            const siblingGroups = new Map<string, typeof units>()

            units.forEach(unit => {
                const key = parentGroupKey(unit.parentIds)
                if (!siblingGroups.has(key)) {
                    siblingGroups.set(key, [])
                }
                siblingGroups.get(key)!.push(unit)
            })

            // Position each sibling group centered under their parents
            const SPOUSE_SPACING = 60
            const UNIT_SPACING = 30
            const occupiedRanges: { start: number, end: number }[] = []

            // Sort sibling groups by parent center position
            const sortedGroups = Array.from(siblingGroups.entries()).sort((a, b) => {
                const getGroupParentCenter = (group: typeof units) => {
                    const firstUnit = group[0]
                    if (firstUnit.parentIds.size === 0) return Infinity

                    const parentPositions: number[] = []
                    firstUnit.parentIds.forEach(parentId => {
                        const parentPos = positions.get(parentId)
                        if (parentPos) {
                            parentPositions.push(parentPos.x + NODE_WIDTH / 2)
                        }
                    })
                    if (parentPositions.length === 0) return Infinity
                    return parentPositions.reduce((a, b) => a + b, 0) / parentPositions.length
                }
                return getGroupParentCenter(a[1]) - getGroupParentCenter(b[1])
            })

            sortedGroups.forEach(([_key, group]) => {
                // Calculate the total width of this sibling group
                let totalGroupWidth = 0
                group.forEach((unit, i) => {
                    const unitWidth = unit.members.length === 2
                        ? NODE_WIDTH * 2 + SPOUSE_SPACING
                        : NODE_WIDTH
                    totalGroupWidth += unitWidth
                    if (i < group.length - 1) totalGroupWidth += UNIT_SPACING
                })

                // Find the center point (between parents if they exist)
                let centerX: number
                const firstUnit = group[0]
                if (firstUnit.parentIds.size > 0) {
                    const parentPositions: number[] = []
                    firstUnit.parentIds.forEach(parentId => {
                        const parentPos = positions.get(parentId)
                        if (parentPos) {
                            parentPositions.push(parentPos.x + NODE_WIDTH / 2)
                        }
                    })
                    if (parentPositions.length > 0) {
                        centerX = parentPositions.reduce((a, b) => a + b, 0) / parentPositions.length
                    } else if (positions.size > 0) {
                        const maxX = Math.max(...Array.from(positions.values()).map(p => p.x + NODE_WIDTH))
                        centerX = maxX + HORIZONTAL_SPACING
                    } else {
                        centerX = 0
                    }
                } else if (positions.size > 0) {
                    const maxX = Math.max(...Array.from(positions.values()).map(p => p.x + NODE_WIDTH))
                    centerX = maxX + HORIZONTAL_SPACING
                } else {
                    centerX = totalGroupWidth / 2
                }

                // Calculate start position to center the group
                const idealGroupStartX = centerX - totalGroupWidth / 2

                // Try to find the best position (closest to ideal) that doesn't collide
                const hasCollision = (startX: number) => {
                    for (const range of occupiedRanges) {
                        if (startX < range.end + UNIT_SPACING && startX + totalGroupWidth > range.start - UNIT_SPACING) {
                            return range
                        }
                    }
                    return null
                }

                let groupStartX = idealGroupStartX
                let collision = hasCollision(groupStartX)

                if (collision) {
                    // Try shifting both left and right to find best position
                    let leftPos = collision.start - UNIT_SPACING - totalGroupWidth
                    let rightPos = collision.end + UNIT_SPACING

                    // Keep trying to find valid positions in both directions
                    let maxIterations = 20
                    while (maxIterations > 0) {
                        const leftCollision = hasCollision(leftPos)
                        const rightCollision = hasCollision(rightPos)

                        // Calculate distances from ideal for valid positions
                        const leftValid = !leftCollision
                        const rightValid = !rightCollision

                        if (leftValid && rightValid) {
                            // Both valid, pick the one closest to ideal
                            const leftDist = Math.abs(leftPos + totalGroupWidth / 2 - centerX)
                            const rightDist = Math.abs(rightPos + totalGroupWidth / 2 - centerX)
                            groupStartX = leftDist <= rightDist ? leftPos : rightPos
                            break
                        } else if (leftValid) {
                            groupStartX = leftPos
                            break
                        } else if (rightValid) {
                            groupStartX = rightPos
                            break
                        } else {
                            // Both have collisions, keep searching
                            if (leftCollision) {
                                leftPos = leftCollision.start - UNIT_SPACING - totalGroupWidth
                            }
                            if (rightCollision) {
                                rightPos = rightCollision.end + UNIT_SPACING
                            }
                        }
                        maxIterations--
                    }
                }

                // Record this group's occupied space
                occupiedRanges.push({ start: groupStartX, end: groupStartX + totalGroupWidth })

                // Position each unit within the group
                let currentX = groupStartX
                group.forEach(unit => {
                    if (unit.members.length === 2) {
                        positions.set(unit.members[0].id, { x: currentX, y: level * VERTICAL_SPACING })
                        positions.set(unit.members[1].id, { x: currentX + NODE_WIDTH + SPOUSE_SPACING, y: level * VERTICAL_SPACING })
                        currentX += NODE_WIDTH * 2 + SPOUSE_SPACING + UNIT_SPACING
                    } else {
                        positions.set(unit.members[0].id, { x: currentX, y: level * VERTICAL_SPACING })
                        currentX += NODE_WIDTH + UNIT_SPACING
                    }
                })
            })
        })

        // Post-processing: shift parent units to be centered above their children
        // Process from bottom to top so that lower levels are final before adjusting parents
        const reversedLevels = Array.from(membersByLevel.keys()).sort((a, b) => b - a)

        reversedLevels.forEach(level => {
            if (level === Math.max(...reversedLevels)) return // Skip the bottom level (no children)

            const membersAtLevel = membersByLevel.get(level) || []

            // Group into spouse units
            const processedAtLevel = new Set<string>()

            membersAtLevel.forEach(member => {
                if (processedAtLevel.has(member.id)) return
                processedAtLevel.add(member.id)

                // Find spouse at same level
                let unitMembers = [member]
                const spouses = spouseMap.get(member.id)
                if (spouses) {
                    spouses.forEach(spouseId => {
                        const spouse = membersAtLevel.find(m => m.id === spouseId)
                        if (spouse && !processedAtLevel.has(spouseId)) {
                            unitMembers.push(spouse)
                            processedAtLevel.add(spouseId)
                        }
                    })
                }

                // Find all children of this unit
                const unitChildrenIds = new Set<string>()
                unitMembers.forEach(m => {
                    const children = childrenMap.get(m.id)
                    if (children) {
                        children.forEach(childId => unitChildrenIds.add(childId))
                    }
                })

                if (unitChildrenIds.size === 0) return

                // Get the current positions of children
                const childPositions: number[] = []
                unitChildrenIds.forEach(childId => {
                    const childPos = positions.get(childId)
                    if (childPos) {
                        childPositions.push(childPos.x + NODE_WIDTH / 2)
                    }
                })

                if (childPositions.length === 0) return

                // Calculate children center
                const childrenCenter = (Math.min(...childPositions) + Math.max(...childPositions)) / 2

                // Calculate current unit center
                const unitPositions = unitMembers.map(m => positions.get(m.id)!.x)
                const currentUnitLeft = Math.min(...unitPositions)
                const currentUnitRight = Math.max(...unitPositions) + NODE_WIDTH
                const currentUnitCenter = (currentUnitLeft + currentUnitRight) / 2

                // Calculate shift needed
                const shift = childrenCenter - currentUnitCenter

                // Only shift if significant (more than 10px)
                if (Math.abs(shift) > 10) {
                    unitMembers.forEach(m => {
                        const pos = positions.get(m.id)!
                        positions.set(m.id, { x: pos.x + shift, y: pos.y })
                    })
                }
            })
        })

        // Final pass: resolve any remaining overlaps at each level
        // This handles cases where post-processing caused new overlaps
        // Run multiple passes until no more overlaps are found
        const sortedLevelsForOverlap = Array.from(membersByLevel.keys()).sort((a, b) => a - b)

        sortedLevelsForOverlap.forEach(level => {
            const membersAtLevel = membersByLevel.get(level) || []

            let hasOverlaps = true
            let maxPasses = 20

            while (hasOverlaps && maxPasses > 0) {
                hasOverlaps = false
                maxPasses--

                // Re-sort by current x position each pass
                const sortedMembers = [...membersAtLevel]
                    .map(m => ({ id: m.id, x: positions.get(m.id)!.x }))
                    .filter(m => m.x !== undefined)
                    .sort((a, b) => a.x - b.x)

                // Check for overlaps
                for (let i = 1; i < sortedMembers.length; i++) {
                    const prev = sortedMembers[i - 1]
                    const curr = sortedMembers[i]

                    const prevRight = prev.x + NODE_WIDTH + 30 // 30px minimum gap
                    const currLeft = curr.x

                    if (currLeft < prevRight) {
                        // Overlap detected
                        const overlap = prevRight - currLeft

                        // Check if these are spouses (they should stay close together)
                        const prevSpouses = spouseMap.get(prev.id)
                        const isSpouse = prevSpouses && prevSpouses.has(curr.id)

                        if (!isSpouse) {
                            hasOverlaps = true

                            // Only shift the current member and their spouse (if any)
                            const toShift: string[] = [curr.id]

                            const currSpouses = spouseMap.get(curr.id)
                            if (currSpouses) {
                                currSpouses.forEach(spouseId => {
                                    if (levels.get(spouseId) === level && !toShift.includes(spouseId)) {
                                        toShift.push(spouseId)
                                    }
                                })
                            }

                            // Shift only this unit
                            toShift.forEach(id => {
                                const pos = positions.get(id)!
                                positions.set(id, { x: pos.x + overlap, y: pos.y })
                            })

                            // Break and restart the check from the beginning
                            break
                        }
                    }
                }
            }
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
