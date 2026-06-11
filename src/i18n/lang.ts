// ── i18n core ──────────────────────────────────────────────────
export type Lang = 'en' | 'vi' | 'ko'

export type Localized = Record<Lang, string>

export const LANGS: { code: Lang; label: string }[] = [
    { code: 'vi', label: 'VI' },
    { code: 'en', label: 'EN' },
    { code: 'ko', label: 'KO' },
]

export interface Strings {
    sections: { identity: string; work: string; experience: string; skills: string; contact: string }
    status: { available: string }
    roleEyebrow: string
    aside: { localTime: string; basedIn: string; available: string; city: string }
    work: { loading: string; view: string }
    modal: {
        live: string
        source: string
        openLive: string
        repository: string
        loadingDemo: string
        slowHint: string
        newTab: string
        blocked: string
        openLiveDemo: string
        privateMsg: string
        close: string
    }
    repo: {
        structure: string
        loadingRepo: string
        loadingFile: string
        treeError: string
        fileError: string
        selectFile: string
        openOnGithub: string
        viewOnGithub: string
    }
    skills: { frontend: string; backend: string; waysOfWorking: string; aiAssisted: string }
    contact: { lead: string }
    footer: { motion: string; backToTop: string }
    dino: { auto: string; play: string; gameOver: string; hint: string }
    mario: {
        method: string
        ending: string
        auto: string
        stomp: string
        gun: string
        ninja: string
        car: string
        pipe: string
        flag: string
    }
}

export const STRINGS: Record<Lang, Strings> = {
    en: {
        sections: { identity: 'Identity', work: 'Work', experience: 'Experience', skills: 'Skills', contact: 'Contact' },
        status: { available: 'Available' },
        roleEyebrow: 'frontend developer',
        aside: { localTime: 'Local time', basedIn: 'Based in', available: 'Available for work', city: 'Ho Chi Minh City' },
        work: { loading: 'Loading work', view: 'View' },
        modal: {
            live: 'Live demo',
            source: 'Source',
            openLive: 'Open live',
            repository: 'Repository',
            loadingDemo: 'Loading live demo…',
            slowHint: 'Taking a while? The site may block embedding —',
            newTab: 'open in a new tab',
            blocked: 'This site blocks iframe embedding (X-Frame-Options).',
            openLiveDemo: 'Open live demo',
            privateMsg: "This project's source code is private and cannot be displayed.",
            close: 'Close project',
        },
        repo: {
            structure: 'Project structure',
            loadingRepo: 'Loading repository…',
            loadingFile: 'Loading file…',
            treeError: 'Couldn’t load the tree (GitHub rate limit?).',
            fileError: 'Couldn’t load this file.',
            selectFile: 'Select a file to view its source.',
            openOnGithub: 'Open on GitHub',
            viewOnGithub: 'View on GitHub',
        },
        skills: { frontend: 'Frontend', backend: 'Backend', waysOfWorking: 'Ways of working', aiAssisted: 'AI-Assisted' },
        contact: { lead: 'Have a project in mind, or just want to say hi? My inbox is always open.' },
        footer: { motion: 'Motion', backToTop: 'Back to top' },
        dino: { auto: 'Auto', play: 'Play', gameOver: 'Game Over', hint: 'Space / tap to jump' },
        mario: { method: 'Move', ending: 'End', auto: 'Auto', stomp: 'Stomp', gun: 'Gun', ninja: 'Ninja', car: 'Car', pipe: 'Pipe', flag: 'Flag' },
    },
    vi: {
        sections: { identity: 'Hồ sơ', work: 'Dự án', experience: 'Kinh nghiệm', skills: 'Kỹ năng', contact: 'Liên hệ' },
        status: { available: 'Sẵn sàng' },
        roleEyebrow: 'lập trình viên frontend',
        aside: { localTime: 'Giờ địa phương', basedIn: 'Tại', available: 'Sẵn sàng nhận việc', city: 'TP. Hồ Chí Minh' },
        work: { loading: 'Đang tải dự án', view: 'Xem' },
        modal: {
            live: 'Bản chạy thử',
            source: 'Mã nguồn',
            openLive: 'Mở bản chạy',
            repository: 'Kho mã',
            loadingDemo: 'Đang tải bản chạy…',
            slowHint: 'Mất nhiều thời gian? Trang có thể chặn nhúng —',
            newTab: 'mở tab mới',
            blocked: 'Trang này chặn nhúng iframe (X-Frame-Options).',
            openLiveDemo: 'Mở bản chạy thử',
            privateMsg: 'Mã nguồn của dự án này là riêng tư và không thể hiển thị.',
            close: 'Đóng dự án',
        },
        repo: {
            structure: 'Cấu trúc dự án',
            loadingRepo: 'Đang tải kho mã…',
            loadingFile: 'Đang tải tệp…',
            treeError: 'Không tải được cây thư mục (giới hạn GitHub?).',
            fileError: 'Không tải được tệp này.',
            selectFile: 'Chọn một tệp để xem mã nguồn.',
            openOnGithub: 'Mở trên GitHub',
            viewOnGithub: 'Xem trên GitHub',
        },
        skills: { frontend: 'Frontend', backend: 'Backend', waysOfWorking: 'Cách làm việc', aiAssisted: 'Hỗ trợ AI' },
        contact: { lead: 'Bạn có dự án hoặc chỉ muốn chào hỏi? Hộp thư của tôi luôn rộng mở.' },
        footer: { motion: 'Hiệu ứng', backToTop: 'Lên đầu trang' },
        dino: { auto: 'Tự động', play: 'Tự chơi', gameOver: 'Thua rồi', hint: 'Space / chạm để nhảy' },
        mario: { method: 'Chiêu', ending: 'Kết', auto: 'Tự động', stomp: 'Giẫm', gun: 'Súng', ninja: 'Ninja', car: 'Xe', pipe: 'Cống', flag: 'Cờ' },
    },
    ko: {
        sections: { identity: '소개', work: '프로젝트', experience: '경력', skills: '기술', contact: '연락처' },
        status: { available: '가능' },
        roleEyebrow: '프론트엔드 개발자',
        aside: { localTime: '현지 시각', basedIn: '거주지', available: '구직 중', city: '호치민시' },
        work: { loading: '작업 불러오는 중', view: '보기' },
        modal: {
            live: '라이브 데모',
            source: '소스 코드',
            openLive: '라이브 열기',
            repository: '리포지토리',
            loadingDemo: '데모 불러오는 중…',
            slowHint: '오래 걸리나요? 사이트가 임베드를 차단할 수 있습니다 —',
            newTab: '새 탭에서 열기',
            blocked: '이 사이트는 iframe 임베드를 차단합니다 (X-Frame-Options).',
            openLiveDemo: '라이브 데모 열기',
            privateMsg: '이 프로젝트의 소스 코드는 비공개이며 표시할 수 없습니다.',
            close: '프로젝트 닫기',
        },
        repo: {
            structure: '프로젝트 구조',
            loadingRepo: '리포지토리 불러오는 중…',
            loadingFile: '파일 불러오는 중…',
            treeError: '트리를 불러올 수 없습니다 (GitHub 한도?).',
            fileError: '이 파일을 불러올 수 없습니다.',
            selectFile: '소스를 보려면 파일을 선택하세요.',
            openOnGithub: 'GitHub에서 열기',
            viewOnGithub: 'GitHub에서 보기',
        },
        skills: { frontend: 'Frontend', backend: 'Backend', waysOfWorking: '업무 방식', aiAssisted: 'AI 활용' },
        contact: { lead: '프로젝트가 있으시거나 그냥 인사하고 싶으신가요? 제 메일함은 항상 열려 있습니다.' },
        footer: { motion: '모션', backToTop: '맨 위로' },
        dino: { auto: '자동', play: '플레이', gameOver: '게임 오버', hint: 'Space / 탭 점프' },
        mario: { method: '기술', ending: '엔딩', auto: '자동', stomp: '밟기', gun: '총', ninja: '닌자', car: '자동차', pipe: '파이프', flag: '깃발' },
    },
}
