import type { FamilyMember, FamilyRelationship, Position } from '~/types'

// Layout Configuration
export const NODE_WIDTH = 180
export const NODE_HEIGHT = 200
const HORIZONTAL_SPACING = 50   // Gap between siblings
const SPOUSE_SPACING = 40       // Gap between spouses
const GENERATION_SPACING = 250  // Vertical gap between generations
const FAMILY_GAP = 100          // Gap between distinct family groups

interface GraphNode {
    id: string
    generation: number
    x: number
    y: number
    width: number        // Width of the individual/couple unit
    subtreeWidth: number // Width of the entire subtree below this node
    spouseId?: string    // ID of the primary spouse (if any) used for layout grouping
    visited: boolean
}

interface FamilyUnit {
    parents: string[]  // 1 or 2 parent IDs
    children: string[]
}

export const useTreeLayout = () => {

    // --- Data Indexing ---

    const buildIndices = (members: FamilyMember[], relationships: FamilyRelationship[]) => {
        const childrenMap = new Map<string, string[]>()
        const parentMap = new Map<string, string[]>()
        const spouseMap = new Map<string, string[]>()
        const memberMap = new Map<string, FamilyMember>()

        members.forEach(m => memberMap.set(m.id, m))

        relationships.forEach(rel => {
            if (rel.relationship_type === 'parent') {
                // member -> parent -> related
                if (!childrenMap.has(rel.member_id)) childrenMap.set(rel.member_id, [])
                childrenMap.get(rel.member_id)!.push(rel.related_member_id)

                if (!parentMap.has(rel.related_member_id)) parentMap.set(rel.related_member_id, [])
                parentMap.get(rel.related_member_id)!.push(rel.member_id)
            }
            else if (rel.relationship_type === 'child') {
                // member -> child -> related (inverse)
                if (!parentMap.has(rel.member_id)) parentMap.set(rel.member_id, [])
                parentMap.get(rel.member_id)!.push(rel.related_member_id)

                if (!childrenMap.has(rel.related_member_id)) childrenMap.set(rel.related_member_id, [])
                childrenMap.get(rel.related_member_id)!.push(rel.member_id)
            }
            else if (rel.relationship_type === 'spouse') {
                if (!spouseMap.has(rel.member_id)) spouseMap.set(rel.member_id, [])
                spouseMap.get(rel.member_id)!.push(rel.related_member_id)
            }
        })

        return { childrenMap, parentMap, spouseMap, memberMap }
    }

    // --- Core Layout Algorithm ---

    const calculateLayout = (members: FamilyMember[], relationships: FamilyRelationship[]): Map<string, Position> => {
        if (members.length === 0) return new Map()

        const { childrenMap, parentMap, spouseMap, memberMap } = buildIndices(members, relationships)
        const positions = new Map<string, Position>()
        const nodeData = new Map<string, GraphNode>()

        // Initialize node data
        members.forEach(m => {
            nodeData.set(m.id, {
                id: m.id,
                generation: 0,
                x: 0,
                y: 0,
                width: NODE_WIDTH,
                subtreeWidth: NODE_WIDTH,
                visited: false
            })
        })

        // 1. Identify Components & Pivot
        // We iterate through all members, starting BFS for any unvisited member to find its connected component.

        const processedMembers = new Set<string>()
        let currentOriginX = 0

        members.forEach(rootCandidate => {
            if (processedMembers.has(rootCandidate.id)) return

            // New component detected.
            // Find a "Pivot" for this component - ideally someone with no parents (oldest ancestor)
            // Or just the current candidate if cyclic.
            let pivotId = rootCandidate.id
            const visitedInSearch = new Set<string>()
            const q = [pivotId]

            // Simple heuristic: Walk up to find an ancestor root
            // This is "local" search to find a good starting point up the chain
            let bestRoot = pivotId
            let maxUp = 0

            // Just traverse parents upwards to find a root
            let walker = pivotId
            let depth = 0
            while (depth < 20) {
                const parents = parentMap.get(walker)
                if (!parents || parents.length === 0) {
                    bestRoot = walker
                    break
                }
                walker = parents[0] // Pick first parent
                depth++
            }
            pivotId = bestRoot

            // 2. Assign Generations relative to Pivot (BFS)
            const componentMembers = new Set<string>()
            const expansionQ: { id: string, gen: number }[] = [{ id: pivotId, gen: 0 }]
            const genVisited = new Set<string>([pivotId])

            nodeData.get(pivotId)!.generation = 0

            let minGen = 0
            let maxGen = 0

            while (expansionQ.length > 0) {
                const { id, gen } = expansionQ.shift()!
                componentMembers.add(id)
                processedMembers.add(id)

                if (gen < minGen) minGen = gen
                if (gen > maxGen) maxGen = gen

                const node = nodeData.get(id)
                if (node) node.generation = gen

                // Neighbors
                const spouses = spouseMap.get(id) || []
                const children = childrenMap.get(id) || []
                const parents = parentMap.get(id) || []

                // Spouses = Same Gen
                spouses.forEach(sid => {
                    if (!genVisited.has(sid)) {
                        genVisited.add(sid)
                        expansionQ.push({ id: sid, gen: gen })
                    }
                })

                // Children = Gen + 1
                children.forEach(cid => {
                    if (!genVisited.has(cid)) {
                        genVisited.add(cid)
                        expansionQ.push({ id: cid, gen: gen + 1 })
                    }
                })

                // Parents = Gen - 1
                parents.forEach(pid => {
                    if (!genVisited.has(pid)) {
                        genVisited.add(pid)
                        expansionQ.push({ id: pid, gen: gen - 1 })
                    }
                })
            }

            // 3. Organise by Generation
            const generations = new Map<number, string[]>()
            componentMembers.forEach(mid => {
                const g = nodeData.get(mid)!.generation
                if (!generations.has(g)) generations.set(g, [])
                generations.get(g)!.push(mid)
            })

            // 4. Group & Sort (The tricky part)
            // We want to minimize edge crossings. 
            // Simple approach: Use the "Pivot" flow.
            // Start from minGen, sort, then propagate order to next gen.

            // To keep it simple and robust:
            // Group spouses into "Couples"
            const processedSpouses = new Set<string>()
            const generationGroups = new Map<number, { ids: string[], center: number }[]>()

            // Iterate levels from min to max
            for (let g = minGen; g <= maxGen; g++) {
                const membersInGen = generations.get(g) || []
                const groups: { ids: string[], center: number, parentCenter?: number }[] = []

                membersInGen.forEach(mid => {
                    if (processedSpouses.has(mid)) return

                    const spouses = spouseMap.get(mid) || []
                    // For now, handle simple couples (A-B). Complex poly/multiple spouses will just be chained.
                    // We just group connected spouses in this generation.
                    const groupIds = [mid]
                    processedSpouses.add(mid)

                    spouses.forEach(sid => {
                        if (generations.get(g)?.includes(sid) && !processedSpouses.has(sid)) {
                            groupIds.push(sid)
                            processedSpouses.add(sid)
                        }
                    })

                    // Determine "Parent Center" for sorting
                    // Average x-position of parents derived from previous generation
                    let parentCenterSum = 0
                    let parentCount = 0

                    groupIds.forEach(gid => {
                        const parents = parentMap.get(gid)
                        if (parents) {
                            parents.forEach(pid => {
                                const pNode = nodeData.get(pid)
                                if (pNode && processedMembers.has(pid)) { // Check if previously positioned (in this component walk) - Wait, we haven't positioned yet.
                                    // Actually, we need to adaptively sort. 
                                    // This entire "Graph Sort" is complex.
                                    // Alternative: Just group by family parents.
                                }
                            })
                        }
                    })

                    groups.push({ ids: groupIds, center: 0 })
                })

                generationGroups.set(g, groups)
            }

            // 5. Position Calculation (Recursive)
            // We use a recursive function `calculateSubtreeWidth` that traverses the specific tree from the Pivot.
            // BUT, since we have a general graph (ancestors etc), a simple tree traversal isn't enough.
            // Let's use the layout from the "Pivot" downwards, and then adjust ancestors upwards.
            // This assumes the Pivot is the "Main" root.

            // Simplification:
            // Just lay out everything relative to the pivot.
            // Sort children by birth date if available (todo).

            // Recursive function to layout a node and its children
            // Returns the x-center of the placed subtree
            const layoutSubtree = (rootId: string, visitedInLayout: Set<string>): number => {
                // If we've already placed this node or its spouse, return that position?
                // No, we need to be careful about shared branches (cousins marriages).
                // For now, treat tree as simple hierarchical, breaking cycles at lower priority links.

                return 0
            }

            // --- REBOOTING ALGORITHM TO "FAMILY UNIT" APPROACH --- 
            // The generation marking was good.
            // Now, we position simply:
            // 1. Sort nodes in each generation to cluster siblings.
            // 2. Assign X = index * spacing (Naive)
            // 3. Force-Directed / Iterative relaxation to center parents/children.

            // Let's try the Iterative Relaxation approach as it handles arbitrary graphs elegantly (like physics).
            // But we constrain Y to generations.

            // Initial X Assignment: simply by order of discovery or naive grouping
            componentMembers.forEach(id => {
                // Group into families for initial sorting
                // Find parents
                const parents = parentMap.get(id) || []
                // Sort key: Parent ID (primary)
                // This roughly groups siblings
            })

            // Sort each generation's list based on parent ID connections
            for (let g = minGen + 1; g <= maxGen; g++) {
                const genMembers = generations.get(g)!
                genMembers.sort((a, b) => {
                    const pA = parentMap.get(a)?.[0] || ''
                    const pB = parentMap.get(b)?.[0] || ''
                    if (pA < pB) return -1
                    if (pA > pB) return 1
                    return 0
                })
            }
            // Sort upwards too
            for (let g = minGen - 1; g >= minGen - 10; g--) { // Safety limit
                if (!generations.has(g)) break
                const genMembers = generations.get(g)!
                genMembers.sort((a, b) => {
                    const cA = childrenMap.get(a)?.[0] || ''
                    const cB = childrenMap.get(b)?.[0] || ''
                    if (cA < cB) return -1
                    if (cA > cB) return 1
                    return 0
                })
            }

            // Initial X spacing
            componentMembers.forEach(id => {
                const node = nodeData.get(id)!
                // Just place them in a line to start, widely spaced
                // This prevents initial overlaps
                // We'll trust the relaxation to pull them together
            })

            const sortedGenKeys = Array.from(generations.keys()).sort((a, b) => a - b)
            sortedGenKeys.forEach(g => {
                const members = generations.get(g)!
                let x = currentOriginX
                members.forEach(id => {
                    const node = nodeData.get(id)!
                    node.x = x
                    // Ensure spouses are next to each other?
                    const spouses = spouseMap.get(id)
                    // If spouse is next in list, we are good.

                    x += NODE_WIDTH + HORIZONTAL_SPACING
                })
            })

            // RELAXATION LOOPS
            // Pull nodes towards their relatives (parents/children/spouses)
            // But maintain order to prevent crossing? No, we want to allow reordering if it simplifies.
            // But swapping can be chaotic. Let's fix order for now and just slide X.

            for (let i = 0; i < 20; i++) { // 20 iterations

                // Force 1: Center Parents over Children
                // Force 2: Center Children under Parents
                // Force 3: Keep Spouses Adjacent (Strong Force)
                // Force 4: Minimum Separation (Collision)

                const proposedX = new Map<string, number>()

                componentMembers.forEach(id => {
                    const node = nodeData.get(id)!
                    const currentX = node.x
                    let forceSum = 0
                    let div = 0

                    // Pull to Parents
                    const parents = parentMap.get(id)
                    if (parents) {
                        parents.forEach(pid => {
                            const pNode = nodeData.get(pid)
                            if (pNode) {
                                forceSum += pNode.x
                                div++
                            }
                        })
                    }

                    // Pull to Children
                    const children = childrenMap.get(id)
                    if (children) {
                        children.forEach(cid => {
                            const cNode = nodeData.get(cid)
                            if (cNode) {
                                forceSum += cNode.x
                                div++
                            }
                        })
                    }

                    // Pull to Spouse (Strong)
                    const spouses = spouseMap.get(id)
                    if (spouses) {
                        spouses.forEach(sid => {
                            const sNode = nodeData.get(sid)
                            if (sNode) {
                                // Ideally want to be NODE_WIDTH apart
                                // If I am left of spouse, pull to spouseX - width
                                // If I am right, pull to spouseX + width
                                // Heuristic: Just average and separate later? 
                                // Or pull strongly to ideal position relative to spouse.
                                const dist = sNode.x - currentX
                                const idealDist = (NODE_WIDTH + SPOUSE_SPACING) * (dist > 0 ? 1 : -1) // Keep relative side?
                                // Actually let's just average positions and let separation handle it?
                                // No, spouse adjacency is critical.
                                forceSum += sNode.x + (currentX < sNode.x ? -(NODE_WIDTH + SPOUSE_SPACING) : (NODE_WIDTH + SPOUSE_SPACING))
                                div += 3 // Weight spouse heavily
                            }
                        })
                    }

                    if (div > 0) {
                        const targetX = forceSum / div
                        // Move 50% towards target (damping)
                        proposedX.set(id, currentX + (targetX - currentX) * 0.4)
                    } else {
                        proposedX.set(id, currentX)
                    }
                })

                // Apply proposed
                proposedX.forEach((x, id) => {
                    nodeData.get(id)!.x = x
                })

                // RESOLVE COLLISIONS & SPACINGS (Per Generation)
                sortedGenKeys.forEach(g => {
                    const members = generations.get(g)!
                    // Sort by current X to handle swaps naturally
                    members.sort((a, b) => nodeData.get(a)!.x - nodeData.get(b)!.x)

                    // Left-to-right sweep to enforce minimum spacing
                    for (let k = 0; k < members.length - 1; k++) {
                        const left = members[k]
                        const right = members[k + 1]
                        const nLeft = nodeData.get(left)!
                        const nRight = nodeData.get(right)!

                        // Determine required spacing
                        let requiredGap = HORIZONTAL_SPACING
                        // If spouses, closer gap
                        if (spouseMap.get(left)?.includes(right)) {
                            requiredGap = SPOUSE_SPACING
                        } else {
                            // If different families, maybe larger gap? 
                            // Simplify: Standard gap for now.
                        }

                        const dist = nRight.x - nLeft.x
                        const limit = NODE_WIDTH + requiredGap

                        if (dist < limit) {
                            // Push apart
                            const mid = (nLeft.x + nRight.x) / 2
                            const push = (limit - dist) / 2
                            nLeft.x -= push
                            nRight.x += push
                        }
                    }
                })
            } // End Relaxation

            // Finalize this component
            let maxX = -Infinity
            componentMembers.forEach(id => {
                const n = nodeData.get(id)!
                positions.set(id, { x: n.x, y: n.generation * GENERATION_SPACING })
                if (n.x > maxX) maxX = n.x
            })

            currentOriginX = maxX + FAMILY_GAP + NODE_WIDTH + 500 // Start next component far away
        })

        return positions
    }

    // --- Branch Generation ---

    interface Branch {
        id: string
        path: string
        stroke: string
        width: number
        dashArray?: string
        type: 'parent-child' | 'spouse'
    }

    const getBranches = (
        members: FamilyMember[],
        relationships: FamilyRelationship[],
        positions: Map<string, Position>
    ): Branch[] => {
        const branches: Branch[] = []
        const { childrenMap, spouseMap } = buildIndices(members, relationships)

        // 1. Spouse Connectors
        const processedSpouses = new Set<string>()
        members.forEach(m => {
            const spouses = spouseMap.get(m.id)
            if (!spouses) return

            const mPos = positions.get(m.id)
            if (!mPos) return

            spouses.forEach(sid => {
                if (processedSpouses.has(`${sid}-${m.id}`) || processedSpouses.has(`${m.id}-${sid}`)) return
                processedSpouses.add(`${m.id}-${sid}`)

                const sPos = positions.get(sid)
                if (!sPos) return

                // Draw horizontal line between them
                // Adjust Y to be center of node height? Or specific connector points?
                // Let's go with center logic:
                const cy = mPos.y + NODE_HEIGHT / 2

                // We want to draw a nice curve or straight line.
                // Simple straight line for spouses
                const leftX = Math.min(mPos.x, sPos.x) + NODE_WIDTH
                const rightX = Math.max(mPos.x, sPos.x)

                if (rightX > leftX) {
                    branches.push({
                        id: `spouse-${m.id}-${sid}`,
                        path: `M ${leftX} ${cy} L ${rightX} ${cy}`,
                        stroke: '#c9a227',
                        width: 3,
                        dashArray: '8,4',
                        type: 'spouse'
                    })
                }
            })
        })

        // 2. Parent-Child Lines (Family Groups)
        // We iterate over every "Family Unit" (Parents -> Children)
        // To avoid duplicates, we group by "Unique Parent Set"
        const familyUnits = new Map<string, { parents: string[], children: Set<string> }>()

        members.forEach(child => {
            // Find parents of this child
            // We need to look at relationships where child is the 'related_member' and type is 'child'? No.
            // In our buildIndices:
            // parentMap: child -> parents
            /*
             relationships.forEach(rel => {
                if (rel.relationship_type === 'parent') {
                    // member -> parent -> related
                    // parentMap.get(rel.related_member_id)!.push(rel.member_id)
                } 
             */
            // Currently parentMap is defined in layout, locally rerunning logic here or using helpers might be cleaner.
            // Let's just lookup in the raw relationships for simplicity of this standalone function.
            const parentRels = relationships.filter(r =>
                (r.relationship_type === 'parent' && r.related_member_id === child.id) ||
                (r.relationship_type === 'child' && r.member_id === child.id)
            )

            const parentIds = parentRels.map(r => r.relationship_type === 'parent' ? r.member_id : r.related_member_id).sort()

            if (parentIds.length > 0) {
                const key = parentIds.join('-')
                if (!familyUnits.has(key)) {
                    familyUnits.set(key, { parents: parentIds, children: new Set() })
                }
                familyUnits.get(key)!.children.add(child.id)
            }
        })

        familyUnits.forEach((unit, key) => {
            const parentPositions = unit.parents.map(pid => positions.get(pid)).filter(p => !!p) as Position[]
            const childPositions = Array.from(unit.children).map(cid => positions.get(cid)).filter(p => !!p) as Position[]

            if (parentPositions.length === 0 || childPositions.length === 0) return

            // Calculate Parent Center Point
            // If 1 parent: bottom center of parent
            // If 2 parents: center point between them (on the spouse line)
            let startPoint = { x: 0, y: 0 }
            const pY = parentPositions[0].y + NODE_HEIGHT + NODE_HEIGHT * 0.2 // Start a bit below parent

            if (parentPositions.length === 1) {
                startPoint = { x: parentPositions[0].x + NODE_WIDTH / 2, y: parentPositions[0].y + NODE_HEIGHT }
            } else {
                // Average X of all parents
                const paramsX = parentPositions.reduce((sum, p) => sum + p.x, 0) / parentPositions.length
                startPoint = { x: paramsX + NODE_WIDTH / 2, y: parentPositions[0].y + NODE_HEIGHT / 2 } // Start from middle of spouse line?
                // Creating a "T" drop from the spouse line
            }

            const dropY = startPoint.y + 40 // How far down the stem goes

            // Draw Stem from Parent(s)
            branches.push({
                id: `stem-${key}`,
                path: `M ${startPoint.x} ${startPoint.y} L ${startPoint.x} ${dropY}`,
                stroke: '#5c4033',
                width: 2,
                type: 'parent-child'
            })

            // Horizontal bar across all children
            const childXs = childPositions.map(p => p.x + NODE_WIDTH / 2)
            const minX = Math.min(...childXs)
            const maxX = Math.max(...childXs)

            // If multiple children, draw the bar
            if (childXs.length > 1) {
                branches.push({
                    id: `bar-${key}`,
                    path: `M ${minX} ${dropY} L ${maxX} ${dropY}`,
                    stroke: '#5c4033',
                    width: 2,
                    type: 'parent-child'
                })
            } else {
                // If single child, we might still need a tiny connector if not perfectly aligned
                // But usually we just draw line to child
            }

            // Lines down to each child
            childPositions.forEach((cPos, idx) => {
                const cx = cPos.x + NODE_WIDTH / 2
                // Line from bar (at dropY) to child top
                // Or if single child, from Stem to child
                const topY = cPos.y

                // If single child, directly connect
                if (childPositions.length === 1) {
                    branches.push({
                        id: `child-${key}-${idx}`,
                        path: `M ${startPoint.x} ${dropY} L ${cx} ${dropY} L ${cx} ${topY}`,
                        stroke: '#5c4033',
                        width: 2,
                        type: 'parent-child'
                    })
                } else {
                    branches.push({
                        id: `child-${key}-${idx}`,
                        path: `M ${cx} ${dropY} L ${cx} ${topY}`,
                        stroke: '#5c4033',
                        width: 2,
                        type: 'parent-child'
                    })
                }
            })
        })

        return branches
    }

    // Stub for path generator if needed directly, but prefer getBranches
    const generateBranchPath = () => ''

    return {
        calculateLayout,
        getBranches, // New API
        generateBranchPath, // Deprecated but kept for signature compatibility if needed
        NODE_WIDTH,
        NODE_HEIGHT
    }
}
