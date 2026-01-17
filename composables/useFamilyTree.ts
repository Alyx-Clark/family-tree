import type { FamilyTree, FamilyMember, FamilyRelationship, RelationshipType } from '~/types'

export const useFamilyTree = () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // State
    const tree = useState<FamilyTree | null>('familyTree', () => null)
    const members = useState<FamilyMember[]>('familyMembers', () => [])
    const relationships = useState<FamilyRelationship[]>('familyRelationships', () => [])

    // Fetch user's family tree
    const fetchTree = async () => {
        if (!user.value) return null

        isLoading.value = true
        error.value = null

        try {
            const { data, error: fetchError } = await supabase
                .from('family_trees')
                .select('*')
                .eq('user_id', user.value.id)
                .single()

            if (fetchError) throw fetchError
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
            relationships.value = data || []
            return data || []
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
            const { data, error: insertError } = await supabase
                .from('family_members')
                .insert({
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
                })
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

            relationships.value = [...relationships.value, data]

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
                    relationships.value = [...relationships.value, inverseData]
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

    // Initialize - fetch tree and members
    const initialize = async () => {
        await fetchTree()
        if (tree.value) {
            await Promise.all([fetchMembers(), fetchRelationships()])
        }
    }

    return {
        tree,
        members,
        relationships,
        isLoading,
        error,
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
