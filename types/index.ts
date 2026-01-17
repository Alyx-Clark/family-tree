// Profile interface for user accounts
export interface Profile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
}

// Family tree - one per user
export interface FamilyTree {
    id: string
    user_id: string
    name: string
    created_at: string
    updated_at: string
}

// Individual family member (leaf node)
export interface FamilyMember {
    id: string
    tree_id: string
    first_name: string
    middle_name: string | null
    last_name: string
    photo_url: string | null
    birth_date: string | null
    death_date: string | null
    bio: string | null
    hobbies: string[] | null
    interests: string[] | null
    likes: string[] | null
    position_x: number
    position_y: number
    created_at: string
    updated_at: string
}

// Relationship types
export type RelationshipType =
    | 'parent'
    | 'child'
    | 'spouse'
    | 'sibling'

// Relationship between two family members
export interface FamilyRelationship {
    id: string
    tree_id: string
    member_id: string
    related_member_id: string
    relationship_type: RelationshipType
    created_at: string
}

// Form data for creating/editing a member
export interface MemberFormData {
    first_name: string
    middle_name?: string
    last_name: string
    birth_date?: string
    death_date?: string
    photo_url?: string
    bio?: string
    hobbies?: string
    interests?: string
    likes?: string
}

// Canvas state for pan/zoom
export interface CanvasState {
    scale: number
    offsetX: number
    offsetY: number
    isDragging: boolean
}

// Position on canvas
export interface Position {
    x: number
    y: number
}

// Leaf component props
export interface LeafProps {
    member: FamilyMember
    isFlipped: boolean
}

// Auth state
export interface AuthState {
    isAuthenticated: boolean
    isLoading: boolean
    user: Profile | null
}
