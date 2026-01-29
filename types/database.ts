export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            family_members: {
                Row: {
                    bio: string | null
                    birth_date: string | null
                    created_at: string
                    death_date: string | null
                    first_name: string
                    hobbies: string[] | null
                    id: string
                    interests: string[] | null
                    last_name: string
                    likes: string[] | null
                    middle_name: string | null
                    photo_url: string | null
                    position_x: number
                    position_y: number
                    tree_id: string
                    updated_at: string
                }
                Insert: {
                    bio?: string | null
                    birth_date?: string | null
                    created_at?: string
                    death_date?: string | null
                    first_name: string
                    hobbies?: string[] | null
                    id?: string
                    interests?: string[] | null
                    last_name: string
                    likes?: string[] | null
                    middle_name?: string | null
                    photo_url?: string | null
                    position_x?: number
                    position_y?: number
                    tree_id: string
                    updated_at?: string
                }
                Update: {
                    bio?: string | null
                    birth_date?: string | null
                    created_at?: string
                    death_date?: string | null
                    first_name?: string
                    hobbies?: string[] | null
                    id?: string
                    interests?: string[] | null
                    last_name?: string
                    likes?: string[] | null
                    middle_name?: string | null
                    photo_url?: string | null
                    position_x?: number
                    position_y?: number
                    tree_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "family_members_tree_id_fkey"
                        columns: ["tree_id"]
                        isOneToOne: false
                        referencedRelation: "family_trees"
                        referencedColumns: ["id"]
                    }
                ]
            }
            family_relationships: {
                Row: {
                    created_at: string
                    id: string
                    member_id: string
                    related_member_id: string
                    relationship_type: string
                    tree_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    member_id: string
                    related_member_id: string
                    relationship_type: string
                    tree_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    member_id?: string
                    related_member_id?: string
                    relationship_type?: string
                    tree_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "family_relationships_member_id_fkey"
                        columns: ["member_id"]
                        isOneToOne: false
                        referencedRelation: "family_members"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "family_relationships_related_member_id_fkey"
                        columns: ["related_member_id"]
                        isOneToOne: false
                        referencedRelation: "family_members"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "family_relationships_tree_id_fkey"
                        columns: ["tree_id"]
                        isOneToOne: false
                        referencedRelation: "family_trees"
                        referencedColumns: ["id"]
                    }
                ]
            }
            family_trees: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "family_trees_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    email: string
                    full_name: string | null
                    id: string
                    updated_at: string
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    email: string
                    full_name?: string | null
                    id: string
                    updated_at?: string
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    email?: string
                    full_name?: string | null
                    id?: string
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
