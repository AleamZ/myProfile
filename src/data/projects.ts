import type { Localized } from '../i18n/lang'

// ── Projects data ──────────────────────────────────────────────
// `blurb` is localized ({ en, vi, ko }); names/tech stay as-is.
//   • repoUrl + allowSource !== false → Source tab shows a live GitHub browser.
//   • no repoUrl (or allowSource:false) → private: live preview + link only.

export interface Project {
    id: string
    name: string
    year?: string
    blurb: Localized
    tech: string[]
    demoUrl?: string
    repoUrl?: string
    branch?: string
    entryFile?: string
    allowSource?: boolean
    /** Some sites block iframe embedding (X-Frame-Options/CSP). */
    embeddable?: boolean
    image?: string
}

export const PROJECTS: Project[] = [
    {
        id: 'music-together',
        name: 'Music Together',
        year: '2026',
        blurb: {
            en: 'Real-time listening party — shared YouTube queue, DJ roles, live chat and reactions.',
            vi: 'Phòng nghe nhạc thời gian thực — hàng đợi YouTube chung, vai trò DJ, chat và cảm xúc trực tiếp.',
            ko: '실시간 음악 감상 파티 — 공유 YouTube 대기열, DJ 역할, 실시간 채팅과 리액션.',
        },
        tech: ['Next.js', 'React', 'Supabase', 'Tailwind CSS', 'TypeScript'],
        demoUrl: 'https://music-together-eight.vercel.app',
        repoUrl: 'https://github.com/AleamZ/Music-Together',
        branch: 'main',
        entryFile: 'app/room/[code]/RoomClient.tsx',
        allowSource: true,
    },
    {
        id: 'genflow',
        name: 'GenFlow',
        year: '2026',
        blurb: {
            en: 'Code dependency visualizer — parses JS/TS via a real AST into an interactive force-directed graph.',
            vi: 'Trình trực quan hóa phụ thuộc mã nguồn — phân tích JS/TS bằng AST thật thành đồ thị lực kéo tương tác.',
            ko: '코드 의존성 시각화 도구 — 실제 AST로 JS/TS를 분석해 인터랙티브 force-directed 그래프로 렌더링.',
        },
        tech: ['ts-morph', 'React', 'Fastify', 'TypeScript', 'Electron', 'Vite', 'zustand'],
        demoUrl: 'https://genflow-ghzd.onrender.com',
        repoUrl: 'https://github.com/AleamZ/GenFlow',
        branch: 'main',
        entryFile: 'analyzer/src/core/buildGraph.ts',
        allowSource: true,
    },
    {
        id: 'sales-management',
        name: 'Sales Management',
        year: '2025',
        blurb: {
            en: 'Sales & inventory dashboard — charts, barcodes and a typed query layer.',
            vi: 'Bảng điều khiển bán hàng & kho — biểu đồ, mã vạch và tầng truy vấn kiểu chặt chẽ.',
            ko: '판매 & 재고 대시보드 — 차트, 바코드, 타입 안전 쿼리 레이어.',
        },
        tech: ['React', 'TypeScript', 'Ant Design', 'React Query'],
        demoUrl: 'https://sales-management-henna.vercel.app',
        repoUrl: 'https://github.com/AleamZ/Sales-Management',
        branch: 'main',
        entryFile: 'src/components/basicUI/FilterBox.tsx',
        allowSource: true,
    },
    {
        id: 'amanotes',
        name: 'Amanotes Test',
        year: '2025',
        blurb: {
            en: 'Course-marketplace UI with cart, live filtering and an AI chat box.',
            vi: 'Giao diện chợ khóa học với giỏ hàng, lọc trực tiếp và hộp chat AI.',
            ko: '장바구니, 실시간 필터, AI 채팅이 있는 강의 마켓플레이스 UI.',
        },
        tech: ['React', 'Vite', 'Ant Design', 'styled-components'],
        demoUrl: 'https://amanotes-test-job.vercel.app',
        repoUrl: 'https://github.com/AleamZ/Amanotes-Test-Job',
        branch: 'main',
        entryFile: 'src/App.tsx',
        allowSource: true,
    },
    {
        id: 'toast',
        name: 'Toast',
        year: '2025',
        blurb: {
            en: 'Multi-language SaaS landing (EN · KO · VI) on the Next.js App Router.',
            vi: 'Trang SaaS đa ngôn ngữ (EN · KO · VI) trên Next.js App Router.',
            ko: 'Next.js App Router 기반 다국어 SaaS 랜딩 (EN · KO · VI).',
        },
        tech: ['Next.js', 'React', 'Tailwind CSS', 'i18n'],
        demoUrl: 'https://toast-test-job.vercel.app',
        repoUrl: 'https://github.com/AleamZ/TOAST-TEST-JOB',
        branch: 'main',
        entryFile: 'src/components/Hero.tsx',
        allowSource: true,
    },
    {
        id: 'streamcargo',
        name: 'StreamCargo',
        year: '2025',
        blurb: {
            en: 'Logistics & cargo management platform — in production.',
            vi: 'Nền tảng quản lý logistics & vận chuyển — đang vận hành thực tế.',
            ko: '물류 & 화물 관리 플랫폼 — 운영 중.',
        },
        tech: ['React', 'TypeScript', 'Production'],
        demoUrl: 'https://streamcargo.vn',
        allowSource: false,
        embeddable: false,
    },
]
