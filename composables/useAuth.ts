import type { Profile } from '~/types'

export const useAuth = () => {
    const supabase = useSupabaseClient()
    const user = useSupabaseUser()

    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const profile = useState<Profile | null>('profile', () => null)

    // Fetch user profile
    const fetchProfile = async () => {
        if (!user.value) {
            profile.value = null
            return null
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.value.id)
                .single()

            if (fetchError) throw fetchError
            profile.value = data
            return data
        } catch (e: any) {
            console.error('Error fetching profile:', e.message)
            return null
        }
    }

    // Sign up with email and password
    const signUp = async (email: string, password: string, fullName: string) => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            })

            if (signUpError) throw signUpError

            return { success: true, data }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        isLoading.value = true
        error.value = null

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (signInError) throw signInError

            await fetchProfile()
            return { success: true, data }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Sign out
    const signOut = async () => {
        isLoading.value = true
        error.value = null

        try {
            const { error: signOutError } = await supabase.auth.signOut()
            if (signOutError) throw signOutError

            profile.value = null
            await navigateTo('/')
            return { success: true }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Update profile
    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user.value) return { success: false, error: 'Not authenticated' }

        isLoading.value = true
        error.value = null

        try {
            const { data, error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.value.id)
                .select()
                .single()

            if (updateError) throw updateError

            profile.value = data
            return { success: true, data }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Update email
    const updateEmail = async (newEmail: string) => {
        isLoading.value = true
        error.value = null

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                email: newEmail
            })

            if (updateError) throw updateError
            return { success: true, message: 'Please check your new email for confirmation' }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Update password
    const updatePassword = async (newPassword: string) => {
        isLoading.value = true
        error.value = null

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (updateError) throw updateError
            return { success: true, message: 'Password updated successfully' }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    // Upload avatar
    const uploadAvatar = async (file: File) => {
        if (!user.value) return { success: false, error: 'Not authenticated' }

        isLoading.value = true
        error.value = null

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.value.id}/avatar.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            // Update profile with new avatar URL
            await updateProfile({ avatar_url: publicUrl })

            return { success: true, url: publicUrl }
        } catch (e: any) {
            error.value = e.message
            return { success: false, error: e.message }
        } finally {
            isLoading.value = false
        }
    }

    return {
        user,
        profile,
        isLoading,
        error,
        signUp,
        signIn,
        signOut,
        fetchProfile,
        updateProfile,
        updateEmail,
        updatePassword,
        uploadAvatar
    }
}
