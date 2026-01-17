// Guest middleware - redirects authenticated users away from login/signup
export default defineNuxtRouteMiddleware((to) => {
    const user = useSupabaseUser()

    if (user.value) {
        return navigateTo('/dashboard')
    }
})
