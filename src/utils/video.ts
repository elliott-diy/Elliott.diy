/**
 * Shared video embed logic, used by both the <Video> MDX component and the
 * markdown plugin that turns bare video links into embeds.
 *
 * Markup is produced as a tiny element tree with plain HTML attribute names,
 * which Sätteri accepts directly as hast and Video.astro renders as-is.
 */

export type VideoSource =
    | { provider: 'youtube'; id: string; start?: number; vertical: boolean }
    | { provider: 'vimeo'; id: string; hash?: string }
    | { provider: 'file'; src: string; type?: string }

export interface VideoOptions {
    /** Accessible title for the player. */
    title?: string
    /** Caption shown under the video. */
    caption?: string
    /** Poster image for self-hosted files. */
    poster?: string
    /** Start time in seconds, or a YouTube-style timestamp like `1m30s`. */
    start?: number | string
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
    controls?: boolean
    /** Force portrait (9:16) framing. YouTube Shorts get this automatically. */
    vertical?: boolean
}

export interface VideoNode {
    type: 'element'
    tagName: string
    properties: Record<string, string | boolean>
    children: (VideoNode | { type: 'text'; value: string })[]
}

const YOUTUBE_ID = /^[\w-]{11}$/
const YOUTUBE_HOSTS = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'])
const FILE_TYPES: Record<string, string> = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    webm: 'video/webm',
    ogv: 'video/ogg',
    ogg: 'video/ogg',
    mov: 'video/quicktime',
}

/** Parses `90`, `90s`, `1m30s` or `1h2m3s` into seconds. */
export const parseTimestamp = (value: string | number | null | undefined): number | undefined => {
    if (value == null || value === '') return undefined
    if (typeof value === 'number') return value > 0 ? Math.floor(value) : undefined
    if (/^\d+$/.test(value)) return Number(value) || undefined
    const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
    if (!match || !match[0]) return undefined
    const [, h = '0', m = '0', s = '0'] = match
    return Number(h) * 3600 + Number(m) * 60 + Number(s) || undefined
}

const parseYouTube = (url: URL): VideoSource | undefined => {
    const host = url.hostname.replace(/^www\./, '')
    let id: string | undefined
    let vertical = false

    if (host === 'youtu.be') {
        id = url.pathname.slice(1)
    } else if (YOUTUBE_HOSTS.has(host)) {
        const [, section, value] = url.pathname.split('/')
        if (section === 'watch') id = url.searchParams.get('v') ?? undefined
        else if (section === 'embed' || section === 'live' || section === 'v') id = value
        else if (section === 'shorts') {
            id = value
            vertical = true
        }
    }

    if (!id || !YOUTUBE_ID.test(id)) return undefined
    return {
        provider: 'youtube',
        id,
        vertical,
        start: parseTimestamp(url.searchParams.get('t') ?? url.searchParams.get('start')),
    }
}

const parseVimeo = (url: URL): VideoSource | undefined => {
    const host = url.hostname.replace(/^www\./, '')
    if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return undefined
    const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/)
    if (!match) return undefined
    return { provider: 'vimeo', id: match[1], hash: match[2] ?? url.searchParams.get('h') ?? undefined }
}

const parseFile = (src: string): VideoSource | undefined => {
    const extension = src.split(/[?#]/)[0].match(/\.([a-z\d]+)$/i)?.[1]?.toLowerCase()
    if (!extension || !(extension in FILE_TYPES)) return undefined
    return { provider: 'file', src, type: FILE_TYPES[extension] }
}

/**
 * Works out what kind of video a URL or path points to.
 * Accepts YouTube/Vimeo URLs, a bare 11-character YouTube ID, or a video file path.
 */
export const parseVideoSource = (input: string): VideoSource | undefined => {
    const src = input.trim()
    if (!src) return undefined
    if (YOUTUBE_ID.test(src) && !src.includes('.')) return { provider: 'youtube', id: src, vertical: false }

    if (/^https?:\/\//i.test(src)) {
        try {
            const url = new URL(src)
            return parseYouTube(url) ?? parseVimeo(url) ?? parseFile(src)
        } catch {
            return undefined
        }
    }

    return parseFile(src)
}

const el = (tagName: string, properties: VideoNode['properties'] = {}, children: VideoNode['children'] = []): VideoNode => ({
    type: 'element',
    tagName,
    properties,
    children,
})

const text = (value: string) => ({ type: 'text' as const, value })

const IFRAME_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'

/** Builds the embed markup for a parsed video source. */
export const buildVideoNode = (source: VideoSource, options: VideoOptions = {}): VideoNode => {
    const { caption, poster, autoplay = false, loop = false, controls = true } = options
    const muted = options.muted ?? autoplay // browsers block unmuted autoplay
    const providerName = { youtube: 'YouTube video', vimeo: 'Vimeo video', file: 'Video' }[source.provider]
    const title = options.title ?? caption ?? providerName
    const start = parseTimestamp(options.start) ?? (source.provider === 'youtube' ? source.start : undefined)
    const vertical = options.vertical ?? (source.provider === 'youtube' && source.vertical)

    let player: VideoNode

    if (source.provider === 'youtube') {
        const params = new URLSearchParams({ autoplay: '1', rel: '0' })
        if (start) params.set('start', String(start))
        if (loop) {
            // YouTube only loops when the video is also its own playlist.
            params.set('loop', '1')
            params.set('playlist', source.id)
        }
        if (muted) params.set('mute', '1')
        if (!controls) params.set('controls', '0')

        const watchUrl = `https://www.youtube.com/watch?v=${source.id}${start ? `&t=${start}s` : ''}`

        // Click-to-load facade: no YouTube scripts or cookies until the reader hits play.
        // Without JS it's just a thumbnail linking to YouTube.
        player = el(
            'a',
            {
                class: 'video-facade',
                href: watchUrl,
                'data-embed-src': `https://www.youtube-nocookie.com/embed/${source.id}?${params}`,
                'data-embed-title': title,
                'aria-label': `Play video: ${title}`,
            },
            [
                el('img', {
                    src: `https://i.ytimg.com/vi/${source.id}/hqdefault.jpg`,
                    alt: '',
                    loading: 'lazy',
                    decoding: 'async',
                }),
                el('span', { class: 'video-play', 'aria-hidden': 'true' }),
            ]
        )
        if (autoplay) player.properties['data-autoplay'] = 'true'
    } else if (source.provider === 'vimeo') {
        const params = new URLSearchParams({ dnt: '1' })
        if (source.hash) params.set('h', source.hash)
        if (autoplay) params.set('autoplay', '1')
        if (loop) params.set('loop', '1')
        if (muted) params.set('muted', '1')
        if (!controls) params.set('controls', '0')
        const hash = start ? `#t=${start}s` : ''

        player = el('iframe', {
            src: `https://player.vimeo.com/video/${source.id}?${params}${hash}`,
            title,
            allow: IFRAME_ALLOW,
            allowfullscreen: true,
            loading: 'lazy',
            referrerpolicy: 'strict-origin-when-cross-origin',
        })
    } else {
        const src = start ? `${source.src}#t=${start}` : source.src
        const properties: VideoNode['properties'] = {
            preload: autoplay ? 'auto' : 'metadata',
            playsinline: true,
            'aria-label': title,
        }
        if (controls) properties.controls = true
        if (autoplay) properties.autoplay = true
        if (loop) properties.loop = true
        if (muted) properties.muted = true
        if (poster) properties.poster = poster

        player = el('video', properties, [
            el('source', source.type ? { src, type: source.type } : { src }),
            text('Your browser can’t play this video. '),
            el('a', { href: source.src }, [text('Download it instead.')]),
        ])
    }

    const frameClass = ['video-frame', `video-frame--${source.provider}`, vertical && 'video-frame--vertical']
        .filter(Boolean)
        .join(' ')

    return el('figure', { class: 'video-embed' }, [
        el('div', { class: frameClass }, [player]),
        ...(caption ? [el('figcaption', {}, [text(caption)])] : []),
    ])
}
