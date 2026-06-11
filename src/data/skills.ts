import type { Localized } from '../i18n/lang'

// ── Skills (from CV) ───────────────────────────────────────────
// Category titles are localized; the items are kept in English (tech terms).
export interface SkillGroup {
    id: string
    title: Localized
    items: string[]
}

export const SKILLS: SkillGroup[] = [
    {
        id: 'frontend',
        title: { en: 'Frontend', vi: 'Frontend', ko: '프론트엔드' },
        items: [
            'React.js',
            'Next.js',
            'TypeScript',
            'JavaScript',
            'Micro Frontend',
            'Electron',
            'SCSS / Sass',
            'Ant Design',
            'React Query',
            'State Management',
            'Responsive UI',
            'Figma → Code',
            'Performance',
        ],
    },
    {
        id: 'backend',
        title: { en: 'Backend', vi: 'Backend', ko: '백엔드' },
        items: ['NestJS', 'RESTful API', 'SQL', 'CRUD & Auth'],
    },
    {
        id: 'ways-of-working',
        title: { en: 'Ways of working', vi: 'Cách làm việc', ko: '업무 방식' },
        items: ['Scrum / Agile', 'Clean Code', 'Reusable Architecture'],
    },
    {
        id: 'ai-assisted',
        title: { en: 'AI-Assisted', vi: 'Hỗ trợ AI', ko: 'AI 활용' },
        items: ['Cursor', 'Claude', 'Codex', 'GitHub Copilot', 'Gemini', 'AI Rules & Skills'],
    },
]
