// composables/useInputMode.ts
// Manages mouse/trackpad input mode preference with localStorage persistence

export type InputMode = 'mouse' | 'trackpad'

export const useInputMode = () => {
    const inputMode = useState<InputMode>('inputMode', () => 'trackpad')

    // Initialize input mode from localStorage
    const initInputMode = () => {
        if (import.meta.client) {
            const stored = localStorage.getItem('input-mode')
            if (stored === 'mouse' || stored === 'trackpad') {
                inputMode.value = stored
            }
        }
    }

    // Toggle between mouse and trackpad mode
    const toggleInputMode = () => {
        inputMode.value = inputMode.value === 'mouse' ? 'trackpad' : 'mouse'
        if (import.meta.client) {
            localStorage.setItem('input-mode', inputMode.value)
        }
    }

    // Set specific input mode
    const setInputMode = (mode: InputMode) => {
        inputMode.value = mode
        if (import.meta.client) {
            localStorage.setItem('input-mode', mode)
        }
    }

    const isMouseMode = computed(() => inputMode.value === 'mouse')
    const isTrackpadMode = computed(() => inputMode.value === 'trackpad')

    return {
        inputMode: readonly(inputMode),
        isMouseMode,
        isTrackpadMode,
        initInputMode,
        toggleInputMode,
        setInputMode
    }
}
