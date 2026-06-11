import { useTheme } from '../../theme/ThemeProvider'

const SunIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
)

const MoonIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
)

const ThemeSwitcher = () => {
    const { theme, toggle } = useTheme()
    const isDark = theme === 'dark'

    return (
        <button
            type="button"
            className="theme-toggle"
            data-magnetic
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={!isDark}
            onClick={toggle}
        >
            <span className="theme-toggle__icon">{isDark ? <SunIcon /> : <MoonIcon />}</span>
        </button>
    )
}

export default ThemeSwitcher
