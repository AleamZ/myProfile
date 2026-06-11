import type { Localized } from '../i18n/lang'

// ── Work experience (from CV) ──────────────────────────────────
export interface ExperienceProject {
    name: string
    summary: Localized
    tags: string[]
}

export interface Experience {
    id: string
    company: string
    period: Localized
    role: Localized
    team?: Localized
    projects: ExperienceProject[]
}

export const EDUCATION: Localized = {
    en: 'Greenwich University (FPT) · Information Technology · 2020–2024',
    vi: 'Đại học Greenwich (FPT) · Công nghệ Thông tin · 2020–2024',
    ko: '그리니치 대학교 (FPT) · 정보기술 · 2020–2024',
}

// Reverse-chronological (most recent first).
export const EXPERIENCE: Experience[] = [
    {
        id: 'tvan-hilo',
        company: 'T-VAN HILO Services JSC',
        period: { en: '02/2026 — Present', vi: '02/2026 — Hiện tại', ko: '02/2026 — 현재' },
        role: { en: 'Frontend Developer', vi: 'Lập trình viên Frontend', ko: '프론트엔드 개발자' },
        team: { en: 'Team of 30', vi: 'Đội 30 người', ko: '30명 팀' },
        projects: [
            {
                name: 'VPPOS System',
                summary: {
                    en: 'Point-of-sale & business-management platform — sales, order processing, payments, inventory and banking integrations. Owned Sales, Stock and System Settings modules.',
                    vi: 'Nền tảng POS & quản lý kinh doanh — bán hàng, xử lý đơn, thanh toán, kho và tích hợp ngân hàng. Phụ trách các module Bán hàng, Kho và Cài đặt hệ thống.',
                    ko: 'POS & 비즈니스 관리 플랫폼 — 판매, 주문 처리, 결제, 재고, 은행 연동. 판매·재고·시스템 설정 모듈 담당.',
                },
                tags: ['React.js', 'Micro Frontend', 'TypeScript', 'REST API', 'Zalo Mini App'],
            },
            {
                name: 'ERP System',
                summary: {
                    en: 'Enterprise resource-planning platform centralizing operations, configuration and administration through shared, reusable Micro Frontend modules.',
                    vi: 'Nền tảng ERP tập trung vận hành, cấu hình và quản trị qua các module Micro Frontend dùng chung, tái sử dụng.',
                    ko: '공유·재사용 가능한 마이크로 프론트엔드 모듈로 운영·구성·관리를 통합한 ERP 플랫폼.',
                },
                tags: ['React.js', 'Micro Frontend', 'TypeScript', 'REST API'],
            },
        ],
    },
    {
        id: 'smew-tech',
        company: 'SMEW Tech',
        period: { en: '08/2025 — 06/2026', vi: '08/2025 — 06/2026', ko: '08/2025 — 06/2026' },
        role: { en: 'Frontend Developer · Remote', vi: 'Lập trình viên Frontend · Remote', ko: '프론트엔드 개발자 · 리모트' },
        team: { en: 'Team of 5', vi: 'Đội 5 người', ko: '5명 팀' },
        projects: [
            {
                name: 'StreamCargo',
                summary: {
                    en: 'Cross-border ordering system for buying goods overseas and shipping to Vietnam — WMS for both warehouses, order/deposit/withdrawal flows, a CMS and an Electron desktop build, plus a no-code visual workflow-automation builder (integrated with Multilogin) that automated overseas purchasing on Japanese marketplaces and raised order-completion rates ~30%.',
                    vi: 'Hệ thống đặt hàng xuyên biên giới mua hàng nước ngoài và vận chuyển về Việt Nam — WMS cho cả hai kho, luồng đặt hàng/nạp/rút, CMS và bản desktop Electron, kèm trình tạo tự động hóa quy trình trực quan không cần code (tích hợp Multilogin) giúp tự động mua hàng trên các sàn Nhật và tăng tỉ lệ hoàn tất đơn ~30%.',
                    ko: '해외 상품을 구매해 베트남으로 배송하는 국경 간 주문 시스템 — 양쪽 창고 WMS, 주문/입금/출금 플로우, CMS, Electron 데스크톱 빌드, 그리고 Multilogin과 연동된 노코드 시각적 워크플로 자동화 빌더로 일본 마켓플레이스 해외 구매를 자동화해 주문 완료율 약 30% 향상.',
                },
                tags: ['Next.js', 'Electron', 'WMS', 'Automation', 'Workflow Builder'],
            },
            {
                name: 'BluetoothMobile',
                summary: {
                    en: 'E-commerce storefront for phones & accessories (iPhone, Samsung) — product catalog, cart and checkout with a responsive React.js UI.',
                    vi: 'Website thương mại điện tử bán điện thoại & phụ kiện (iPhone, Samsung) — danh mục sản phẩm, giỏ hàng và thanh toán với giao diện React.js responsive.',
                    ko: '휴대폰 & 액세서리(iPhone, Samsung) 이커머스 스토어 — 상품 카탈로그, 장바구니, 결제, React.js 반응형 UI.',
                },
                tags: ['React.js', 'E-commerce', 'Responsive UI'],
            },
        ],
    },
    {
        id: 'amazing-tech',
        company: 'Amazing Tech',
        period: { en: '06/2024 — 08/2025', vi: '06/2024 — 08/2025', ko: '06/2024 — 08/2025' },
        role: { en: 'Frontend Developer', vi: 'Lập trình viên Frontend', ko: '프론트엔드 개발자' },
        team: { en: 'Team of 10–20', vi: 'Đội 10–20 người', ko: '10–20명 팀' },
        projects: [
            {
                name: 'Web Manage Staff',
                summary: {
                    en: 'Internal HR system for managing employees, payroll and task assignment — modular, responsive UI from Figma with auth, form validation and API error handling.',
                    vi: 'Hệ thống HR nội bộ quản lý nhân viên, lương và phân công công việc — UI module hóa, responsive từ Figma với xác thực, kiểm tra biểu mẫu và xử lý lỗi API.',
                    ko: '직원·급여·업무 배정을 관리하는 사내 HR 시스템 — Figma 기반 모듈형 반응형 UI, 인증·폼 검증·API 오류 처리.',
                },
                tags: ['React.js', 'SCSS', 'Ant Design', 'REST API'],
            },
            {
                name: 'Local Company Storage',
                summary: {
                    en: 'Internal data platform with a CMS for dynamic per-project schemas, centralized media storage, multilingual support and theme customization.',
                    vi: 'Nền tảng dữ liệu nội bộ với CMS cho schema động theo từng dự án, lưu trữ media tập trung, hỗ trợ đa ngôn ngữ và tùy biến giao diện.',
                    ko: '프로젝트별 동적 스키마용 CMS, 중앙화된 미디어 저장소, 다국어 지원, 테마 커스터마이징을 갖춘 사내 데이터 플랫폼.',
                },
                tags: ['Next.js', 'CMS', 'i18n', 'Theming'],
            },
            {
                name: 'Trippick',
                summary: {
                    en: 'Tourist web-app to order local products to hotels — built the NestJS backend (auth, CRUD, partner management, profit calc) on a Linux VPS, with WebView deployment to Android/iOS.',
                    vi: 'Web-app du lịch đặt sản phẩm địa phương về khách sạn — xây backend NestJS (xác thực, CRUD, quản lý đối tác, tính lợi nhuận) trên Linux VPS, triển khai WebView lên Android/iOS.',
                    ko: '현지 상품을 호텔로 주문하는 관광 웹앱 — Linux VPS에 NestJS 백엔드(인증, CRUD, 파트너 관리, 수익 계산) 구축, Android/iOS WebView 배포.',
                },
                tags: ['Next.js', 'NestJS', 'SQL', 'WebView'],
            },
        ],
    },
]
