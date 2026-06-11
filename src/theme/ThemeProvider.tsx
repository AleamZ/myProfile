import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextValue {
    theme: Theme
    setTheme: (t: Theme) => void
    toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'pp-theme'

// The inline <head> script already set data-theme for the first paint; read it
// back so React state matches and there is no flash.
const initialTheme = (): Theme => {
    try {
        const fromDom = document.documentElement.dataset.theme
        if (fromDom === 'light' || fromDom === 'dark') return fromDom
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved === 'light' || saved === 'dark') return saved
    } catch {
        /* ignore */
    }
    return 'dark'
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(initialTheme)

    useEffect(() => {
        const root = document.documentElement
        root.dataset.theme = theme
        // Hand control of the page background back to the stylesheet (the inline
        // anti-FOUC background is no longer needed once CSS vars are live).
        root.style.background = ''
    }, [theme])

    const setTheme = (t: Theme) => {
        const root = document.documentElement
        root.classList.add('theme-transition')
        window.setTimeout(() => root.classList.remove('theme-transition'), 540)
        setThemeState(t)
        try {
            window.localStorage.setItem(STORAGE_KEY, t)
        } catch {
            /* ignore */
        }
    }

    const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

    return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = (): ThemeContextValue => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}
