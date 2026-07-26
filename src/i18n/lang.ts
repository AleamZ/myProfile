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
    work: { loading: string; view: string; entries: string; live: string; source: string }
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
    places: { title: string; lead: string; hint: string; noPhoto: string }
    boot: { label: string }
    tele: { chapter: string; section: string; focus: string; item: string; time: string }
    skip: string
    identity: { lead: string; stack: string; status: string }
    skillsMeta: { entries: string }
    footer: { motion: string; backToTop: string }
}

export const STRINGS: Record<Lang, Strings> = {
    en: {
        sections: { identity: 'Identity', work: 'Work', experience: 'Experience', skills: 'Skills', contact: 'Contact' },
        status: { available: 'Available' },
        roleEyebrow: 'frontend developer',
        aside: { localTime: 'Local time', basedIn: 'Based in', available: 'Available for work', city: 'Ho Chi Minh City' },
        work: { loading: 'Loading work', view: 'View', entries: 'projects', live: 'Live', source: 'Source' },
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
        places: {
            title: 'Where I am from',
            lead: 'Three places in Vietnam that made me, and two I have been lucky enough to visit.',
            hint: 'Hover a place',
            noPhoto: 'Photo coming soon',
        },
        boot: { label: 'Cold start' },
        tele: { chapter: 'Chapter', section: 'Section', focus: 'Focus', item: 'Item', time: 'Local time' },
        skip: 'Skip to content',
        identity: {
            lead: 'Frontend developer in Ho Chi Minh City. I build interfaces that stay fast and legible once the real data arrives.',
            stack: 'Stack',
            status: 'Status',
        },
        skillsMeta: { entries: 'entries' },
        footer: { motion: 'Motion', backToTop: 'Back to top' },
    },
    vi: {
        sections: { identity: 'Hồ sơ', work: 'Dự án', experience: 'Kinh nghiệm', skills: 'Kỹ năng', contact: 'Liên hệ' },
        status: { available: 'Sẵn sàng' },
        roleEyebrow: 'lập trình viên frontend',
        aside: { localTime: 'Giờ địa phương', basedIn: 'Tại', available: 'Sẵn sàng nhận việc', city: 'TP. Hồ Chí Minh' },
        work: { loading: 'Đang tải dự án', view: 'Xem', entries: 'dự án', live: 'Xem thử', source: 'Mã nguồn' },
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
        places: {
            title: 'Nơi tôi thuộc về',
            lead: 'Ba nơi ở Việt Nam đã tạo nên tôi, và hai nơi tôi may mắn được đặt chân đến.',
            hint: 'Rê chuột vào một địa điểm',
            noPhoto: 'Ảnh sẽ cập nhật',
        },
        boot: { label: 'Khởi động' },
        tele: { chapter: 'Chương', section: 'Mục', focus: 'Đang xem', item: 'Mục số', time: 'Giờ địa phương' },
        skip: 'Tới nội dung',
        identity: {
            lead: 'Lập trình viên frontend tại TP. Hồ Chí Minh. Tôi dựng giao diện giữ được tốc độ và sự rõ ràng khi dữ liệu thật đổ vào.',
            stack: 'Công nghệ',
            status: 'Trạng thái',
        },
        skillsMeta: { entries: 'mục' },
        footer: { motion: 'Hiệu ứng', backToTop: 'Lên đầu trang' },
    },
    ko: {
        sections: { identity: '소개', work: '프로젝트', experience: '경력', skills: '기술', contact: '연락처' },
        status: { available: '가능' },
        roleEyebrow: '프론트엔드 개발자',
        aside: { localTime: '현지 시각', basedIn: '거주지', available: '구직 중', city: '호치민시' },
        work: { loading: '작업 불러오는 중', view: '보기', entries: '프로젝트', live: '데모', source: '소스' },
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
        places: {
            title: '내가 자란 곳',
            lead: '나를 만든 베트남의 세 곳, 그리고 운 좋게 다녀온 두 나라.',
            hint: '장소에 마우스를 올려보세요',
            noPhoto: '사진 준비 중',
        },
        boot: { label: '시작 중' },
        tele: { chapter: '챕터', section: '섹션', focus: '초점', item: '항목', time: '현지 시간' },
        skip: '본문으로 건너뛰기',
        identity: {
            lead: '호치민시의 프론트엔드 개발자. 실제 데이터가 들어와도 빠르고 읽기 쉬운 인터페이스를 만듭니다.',
            stack: '기술',
            status: '상태',
        },
        skillsMeta: { entries: '개' },
        footer: { motion: '모션', backToTop: '맨 위로' },
    },
}
