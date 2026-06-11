import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { STRINGS, type Lang, type Strings } from './lang'

interface LangContextValue {
    lang: Lang
    setLang: (l: Lang) => void
    t: Strings
}

const LangContext = createContext<LangContextValue | null>(null)
const STORAGE_KEY = 'pp-lang'

const detectLang = (): Lang => {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY)
        if (saved === 'en' || saved === 'vi' || saved === 'ko') return saved
    } catch {
        /* ignore */
    }
    const nav = window.navigator.language?.toLowerCase() ?? ''
    if (nav.startsWith('vi')) return 'vi'
    if (nav.startsWith('ko')) return 'ko'
    return 'en'
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLangState] = useState<Lang>(detectLang)

    useEffect(() => {
        document.documentElement.lang = lang
    }, [lang])

    const setLang = (l: Lang) => {
        setLangState(l)
        try {
            window.localStorage.setItem(STORAGE_KEY, l)
        } catch {
            /* ignore */
        }
    }

    return (
        <LangContext.Provider value={{ lang, setLang, t: STRINGS[lang] }}>
            {children}
        </LangContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLang = (): LangContextValue => {
    const ctx = useContext(LangContext)
    if (!ctx) throw new Error('useLang must be used within LanguageProvider')
    return ctx
}
