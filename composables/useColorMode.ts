// composables/useColorMode.ts
// Manages light/dark mode with localStorage persistence

export const useColorMode = () => {
    const colorMode = useState<'light' | 'dark'>('colorMode', () => 'light')

    // Initialize color mode from localStorage or system preference
    const initColorMode = () => {
        if (import.meta.client) {
            const stored = localStorage.getItem('color-mode')
            if (stored === 'dark' || stored === 'light') {
                colorMode.value = stored
            } else {
                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                colorMode.value = prefersDark ? 'dark' : 'light'
            }
            applyColorMode()
        }
    }

    // Apply color mode to document
    const applyColorMode = () => {
        if (import.meta.client) {
            document.documentElement.setAttribute('data-theme', colorMode.value)
        }
    }

    // Toggle between light and dark mode
    const toggleColorMode = () => {
        colorMode.value = colorMode.value === 'light' ? 'dark' : 'light'
        if (import.meta.client) {
            localStorage.setItem('color-mode', colorMode.value)
            applyColorMode()
        }
    }

    // Set specific color mode
    const setColorMode = (mode: 'light' | 'dark') => {
        colorMode.value = mode
        if (import.meta.client) {
            localStorage.setItem('color-mode', mode)
            applyColorMode()
        }
    }

    const isDark = computed(() => colorMode.value === 'dark')

    return {
        colorMode: readonly(colorMode),
        isDark,
        initColorMode,
        toggleColorMode,
        setColorMode
    }
}
