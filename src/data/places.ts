import type { Localized } from '../i18n/lang'

// ── Places (globe, §06) ────────────────────────────────────────
// The closing chapter answers "where is this person from, and how far have
// they been". Order matters: it is read top-to-bottom as home → now → out.
//
// PHOTOS: drop your images in `public/places/` using the filenames below and
// they appear on hover. Until then each marker falls back to its initials
// plate, so the section is complete without them. Landscape crops around
// 1200×800 look best — the card is 3:2.

export type PlaceRole = 'origin' | 'living' | 'capital' | 'visited'

export interface Place {
    id: string
    /** City or province. */
    name: string
    country: Localized
    role: PlaceRole
    lat: number
    lng: number
    /** Path under /public. Missing files degrade to the initials plate. */
    photo: string
    note: Localized
}

export const PLACE_ROLE_LABEL: Record<PlaceRole, Localized> = {
    origin: { en: 'Hometown', vi: 'Quê nhà', ko: '고향' },
    living: { en: 'Living here', vi: 'Đang sống', ko: '거주 중' },
    capital: { en: 'Capital', vi: 'Thủ đô', ko: '수도' },
    visited: { en: 'Been there', vi: 'Đã đi qua', ko: '방문함' },
}

export const PLACES: Place[] = [
    {
        id: 'an-giang',
        name: 'An Giang',
        country: { en: 'Vietnam', vi: 'Việt Nam', ko: '베트남' },
        role: 'origin',
        lat: 10.5216,
        lng: 105.1259,
        photo: '/places/an-giang.jpg',
        note: {
            en: 'The Mekong Delta province I grew up in.',
            vi: 'Tỉnh miền Tây nơi tôi lớn lên.',
            ko: '내가 자란 메콩 삼각주 지역.',
        },
    },
    {
        id: 'ho-chi-minh',
        name: 'Ho Chi Minh City',
        country: { en: 'Vietnam', vi: 'Việt Nam', ko: '베트남' },
        role: 'living',
        lat: 10.8231,
        lng: 106.6297,
        photo: '/places/ho-chi-minh.jpg',
        note: {
            en: 'Where I live and build today.',
            vi: 'Nơi tôi đang sống và làm việc.',
            ko: '현재 살면서 일하는 곳.',
        },
    },
    {
        id: 'ha-noi',
        name: 'Hà Nội',
        country: { en: 'Vietnam', vi: 'Việt Nam', ko: '베트남' },
        role: 'capital',
        lat: 21.0278,
        lng: 105.8342,
        photo: '/places/ha-noi.jpg',
        note: {
            en: 'The capital, a thousand years older than the rest.',
            vi: 'Thủ đô, nghìn năm văn hiến.',
            ko: '천 년의 역사를 가진 수도.',
        },
    },
    {
        id: 'south-korea',
        name: 'Seoul',
        country: { en: 'South Korea', vi: 'Hàn Quốc', ko: '대한민국' },
        role: 'visited',
        lat: 37.5665,
        lng: 126.978,
        photo: '/places/south-korea.jpg',
        note: {
            en: 'First trip out of the country.',
            vi: 'Chuyến đi nước ngoài đầu tiên.',
            ko: '첫 해외 여행.',
        },
    },
    {
        id: 'malaysia',
        name: 'Kuala Lumpur',
        country: { en: 'Malaysia', vi: 'Malaysia', ko: '말레이시아' },
        role: 'visited',
        lat: 3.139,
        lng: 101.6869,
        photo: '/places/malaysia.jpg',
        note: {
            en: 'Two towers and a lot of rain.',
            vi: 'Tháp đôi và những cơn mưa.',
            ko: '쌍둥이 빌딩과 잦은 비.',
        },
    },
]

/** The globe rests here: Vietnam centred, tilted just off the equator. */
export const GLOBE_HOME = { lat: 14, lng: 108 }

/** Routes drawn between places — home outward, in the order they happened. */
export const PLACE_ROUTES: ReadonlyArray<readonly [string, string]> = [
    ['an-giang', 'ho-chi-minh'],
    ['ho-chi-minh', 'ha-noi'],
    ['ho-chi-minh', 'malaysia'],
    ['ho-chi-minh', 'south-korea'],
]
