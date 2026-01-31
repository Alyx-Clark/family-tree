import type { FamilyTree, FamilyMember, FamilyRelationship, RelationshipType, TreeListItem } from '~/types'
import type { Database } from '~/types/database'

export const useFamilyTree = () => {
    const supabase = useSupabaseClient<Database>()
    const user = useSupabaseUser()

    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // State
    const trees = useState<FamilyTree[]>('familyTrees', () => [])
    const tree = useState<FamilyTree | null>('familyTree', () => null)
    const members = useState<FamilyMember[]>('familyMembers', () => [])
    const relationships = useState<FamilyRelationship[]>('familyRelationships', () => [])

    // Fetch all trees for current user
    const fetchTrees = async () => {
        if (!user.value) return []

        isLoading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('family_trees')
                .select('*')
                .eq('user_id', user.value.id)
                .order('updated_at', { ascending: false })

            if (fetchError) throw fetchError
            trees.value = data || []
            return data || []
        } catch (e: any) {
            console.error('Error fetching trees:', e.message)
            error.value = e.message
            return []
        } finally {
            isLoading.value = false
        }
    }

    // Fetch trees with member count for dashboard
    const fetchTreesWithCounts = async (): Promise<TreeListItem[]> => {
        if (!user.value) return []

        isLoading.value = true
        error.value = null

        try {
            // Fetch trees
            const { data: treesData, error: treesError } = await supabase
                .from('family_trees')
                .select('id, name, updated_at')
                .eq('user_id', user.value.id)
                .order('updated_at', { ascending: false })

            if (treesError) throw treesError
            if (!treesData) return []

            // Fetch member counts for each tree
            const treeListItems: TreeListItem[] = await Promise.all(
                treesData.map(async (t) => {
                    const { count } = await supabase
                        .from('family_members')
                        .select('*', { count: 'exact', head: true })
                        .eq('tree_id', t.id)

                    return {
                        id: t.id,
                        name: t.name,
                        member_count: count || 0,
                        updated_at: t.updated_at
                    }
                })
            )

            return treeListItems
        } catch (e: any) {
            console.error('Error fetching trees with counts:', e.message)
            error.value = e.message
            return []
        } finally {
            isLoading.value = false
        }
    }

    // Create a new tree
    const createTree = async (name: string) => {
        if (!user.value) return { success: false, error: 'Not authenticated' }

        isLoading.value = true
        error.value = null

        try {
            const { data, error: insertError } = await supabase
                .from('family_trees')
                .insert({
                    user_id: user.value.id,
                    name: name
                })
                .select()
                .single()

            if (insertError) throw insertError

            trees.value = [data, ...trees.value]
            return { success: true, data }
        } catch (e: any) {
            console.error('Error creating tree:', e.message)
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Delete a tree
    const deleteTree = async (treeId: string) => {
        isLoading.value = true
        error.value = null

        try {
            const { error: deleteError } = await supabase
                .from('family_trees')
                .delete()
                .eq('id', treeId)

            if (deleteError) throw deleteError

            trees.value = trees.value.filter(t => t.id !== treeId)

            // Clear current tree if it was deleted
            if (tree.value?.id === treeId) {
                tree.value = null
                members.value = []
                relationships.value = []
            }

            return { success: true }
        } catch (e: any) {
            console.error('Error deleting tree:', e.message)
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Update a tree's name
    const updateTreeName = async (treeId: string, name: string) => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: updateError } = await supabase
                .from('family_trees')
                .update({ name })
                .eq('id', treeId)
                .select()
                .single()

            if (updateError) throw updateError

            // Update in trees list
            const index = trees.value.findIndex(t => t.id === treeId)
            if (index !== -1) {
                trees.value[index] = data
            }

            // Update current tree if it matches
            if (tree.value?.id === treeId) {
                tree.value = data
                const treeName = useState('treeName')
                treeName.value = data.name
            }

            return { success: true, data }
        } catch (e: any) {
            console.error('Error updating tree:', e.message)
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Fetch a specific tree by ID
    const fetchTree = async (treeId?: string) => {
        if (!user.value) return null

        isLoading.value = true
        error.value = null

        try {
            let query = supabase
                .from('family_trees')
                .select('*')
                .eq('user_id', user.value.id)

            if (treeId) {
                query = query.eq('id', treeId)
            }

            // If treeId is provided, we expect a single result.
            // If not, we might get multiple trees, so we should fetch the most recently updated one or use maybeSingle()
            if (!treeId) {
                query = query.order('updated_at', { ascending: false }).limit(1)
            }

            const { data, error: fetchError } = treeId
                ? await query.single()
                : await query.maybeSingle()

            if (fetchError) throw fetchError

            // Handle case where no tree is found (maybeSingle returns null)
            if (!data) return null

            tree.value = data

            // Update tree name in state for header
            const treeName = useState('treeName')
            treeName.value = data.name

            return data
        } catch (e: any) {
            console.error('Error fetching tree:', e.message)
            error.value = e.message
            return null
        } finally {
            isLoading.value = false
        }
    }

    // Fetch all members in the tree
    const fetchMembers = async () => {
        if (!tree.value) return []

        isLoading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('family_members')
                .select('*')
                .eq('tree_id', tree.value.id)
                .order('created_at', { ascending: true })

            if (fetchError) throw fetchError
            members.value = data || []
            return data || []
        } catch (e: any) {
            console.error('Error fetching members:', e.message)
            error.value = e.message
            return []
        } finally {
            isLoading.value = false
        }
    }

    // Fetch all relationships
    const fetchRelationships = async () => {
        if (!tree.value) return []

        try {
            const { data, error: fetchError } = await supabase
                .from('family_relationships')
                .select('*')
                .eq('tree_id', tree.value.id)

            if (fetchError) throw fetchError
            relationships.value = (data || []) as FamilyRelationship[]
            return (data || []) as FamilyRelationship[]
        } catch (e: any) {
            console.error('Error fetching relationships:', e.message)
            return []
        }
    }

    // Add a new family member
    const addMember = async (memberData: Partial<FamilyMember>) => {
        if (!tree.value) return { success: false, error: 'No tree found' }

        isLoading.value = true
        error.value = null

        try {
            // Ensure required fields are present
            if (!memberData.first_name || !memberData.last_name) {
                throw new Error('First name and last name are required')
            }

            const insertData = {
                tree_id: tree.value.id,
                first_name: memberData.first_name,
                middle_name: memberData.middle_name || null,
                last_name: memberData.last_name,
                birth_date: memberData.birth_date || null,
                death_date: memberData.death_date || null,
                photo_url: memberData.photo_url || null,
                bio: memberData.bio || null,
                hobbies: memberData.hobbies || [],
                interests: memberData.interests || [],
                likes: memberData.likes || [],
                position_x: memberData.position_x || 0,
                position_y: memberData.position_y || 0
            }

            const { data, error: insertError } = await supabase
                .from('family_members')
                .insert(insertData)
                .select()
                .single()

            if (insertError) throw insertError

            members.value = [...members.value, data]
            return { success: true, data }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Update a family member
    const updateMember = async (memberId: string, updates: Partial<FamilyMember>) => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: updateError } = await supabase
                .from('family_members')
                .update(updates)
                .eq('id', memberId)
                .select()
                .single()

            if (updateError) throw updateError

            const index = members.value.findIndex(m => m.id === memberId)
            if (index !== -1) {
                members.value[index] = data
            }

            return { success: true, data }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Delete a family member
    const deleteMember = async (memberId: string) => {
        isLoading.value = true
        error.value = null

        try {
            const { error: deleteError } = await supabase
                .from('family_members')
                .delete()
                .eq('id', memberId)

            if (deleteError) throw deleteError

            members.value = members.value.filter(m => m.id !== memberId)
            // Also remove relationships involving this member
            relationships.value = relationships.value.filter(
                r => r.member_id !== memberId && r.related_member_id !== memberId
            )

            return { success: true }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Add a relationship between two members
    const addRelationship = async (
        memberId: string,
        relatedMemberId: string,
        relationshipType: RelationshipType
    ) => {
        if (!tree.value) return { success: false, error: 'No tree found' }

        try {
            // Add the forward relationship
            const { data, error: insertError } = await supabase
                .from('family_relationships')
                .insert({
                    tree_id: tree.value.id,
                    member_id: memberId,
                    related_member_id: relatedMemberId,
                    relationship_type: relationshipType
                })
                .select()
                .single()

            if (insertError) throw insertError

            relationships.value = [...relationships.value, data as FamilyRelationship]

            // Add the inverse relationship
            const inverseType = getInverseRelationship(relationshipType)
            if (inverseType) {
                const { data: inverseData } = await supabase
                    .from('family_relationships')
                    .insert({
                        tree_id: tree.value.id,
                        member_id: relatedMemberId,
                        related_member_id: memberId,
                        relationship_type: inverseType
                    })
                    .select()
                    .single()

                if (inverseData) {
                    relationships.value = [...relationships.value, inverseData as FamilyRelationship]
                }
            }

            return { success: true, data }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        }
    }

    // Get the inverse relationship type
    const getInverseRelationship = (type: RelationshipType): RelationshipType | null => {
        switch (type) {
            case 'parent':
                return 'child'
            case 'child':
                return 'parent'
            case 'spouse':
                return 'spouse'
            case 'sibling':
                return 'sibling'
            default:
                return null
        }
    }

    // Get relationships for a specific member
    const getMemberRelationships = (memberId: string) => {
        return relationships.value.filter(r => r.member_id === memberId)
    }

    // Get related member IDs for a member
    const getRelatedMembers = (memberId: string) => {
        const rels = getMemberRelationships(memberId)
        return rels.map(r => ({
            memberId: r.related_member_id,
            type: r.relationship_type
        }))
    }

    // Update member positions (for dragging)
    const updateMemberPosition = async (memberId: string, x: number, y: number) => {
        const { error: updateError } = await supabase
            .from('family_members')
            .update({ position_x: x, position_y: y })
            .eq('id', memberId)

        if (!updateError) {
            const member = members.value.find(m => m.id === memberId)
            if (member) {
                member.position_x = x
                member.position_y = y
            }
        }
    }

    // Upload member photo
    const uploadMemberPhoto = async (memberId: string, file: File) => {
        if (!user.value) return { success: false, error: 'Not authenticated' }

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.value.id}/members/${memberId}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Update member with photo URL
            await updateMember(memberId, { photo_url: publicUrl })

            return { success: true, url: publicUrl }
        } catch (e: any) {
            return { success: false, error: e.message }
        }
    }

    // Initialize - fetch tree and members for a specific tree ID
    const initialize = async (treeId?: string) => {
        await fetchTree(treeId)
        if (tree.value) {
            await Promise.all([fetchMembers(), fetchRelationships()])
        }
    }

    return {
        trees,
        tree,
        members,
        relationships,
        isLoading,
        error,
        fetchTrees,
        fetchTreesWithCounts,
        createTree,
        deleteTree,
        updateTreeName,
        fetchTree,
        fetchMembers,
        fetchRelationships,
        addMember,
        updateMember,
        deleteMember,
        addRelationship,
        getMemberRelationships,
        getRelatedMembers,
        updateMemberPosition,
        uploadMemberPhoto,
        initialize
    }
}
