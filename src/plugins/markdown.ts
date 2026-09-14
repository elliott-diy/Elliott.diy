/**
 * Sätteri plugins (Astro 7's markdown engine) shared by .md and .mdx content.
 */
import GithubSlugger from 'github-slugger'
import type { Element } from 'hast'
import type { HastPluginDefinition, MdastPluginDefinition } from 'satteri'
import { buildVideoNode, parseVideoSource } from '../utils/video'

const PLACEHOLDER_ATTR = 'data-video-embed'

/**
 * Turns a paragraph that contains nothing but a video into an embed:
 *
 *   https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   ![Alt text](/videos/demo.mp4 "Optional caption")
 *
 * Runs on mdast so the image is swapped out before Astro tries to optimise
 * `.mp4` files as images; the placeholder is expanded by `videoEmbedHast`.
 */
const videoEmbedMdast: MdastPluginDefinition = {
    name: 'video-embed-mdast',
    paragraph(node, ctx) {
        const children = node.children.filter((child) => !(child.type === 'text' && !child.value.trim()))
        if (children.length !== 1) return

        const [child] = children
        let src: string | undefined
        let title: string | undefined
        let caption: string | undefined

        if (child.type === 'image') {
            src = child.url
            title = child.alt || undefined
            caption = child.title || undefined
        } else if (child.type === 'link' && ctx.textContent(child).trim() === child.url) {
            // Only bare URLs embed; [custom text](youtube-url) stays a normal link.
            src = child.url
        }

        if (!src || !parseVideoSource(src)) return

        ctx.setProperty(node, 'children', [])
        ctx.setProperty(node, 'data', {
            hName: 'div',
            hProperties: { [PLACEHOLDER_ATTR]: JSON.stringify({ src, title, caption }) },
        })
    },
}

const videoEmbedHast: HastPluginDefinition = {
    name: 'video-embed-hast',
    element: {
        filter: ['div'],
        visit(node, ctx) {
            const raw = node.properties?.[PLACEHOLDER_ATTR]
            if (typeof raw !== 'string') return

            const { src, title, caption } = JSON.parse(raw) as { src: string; title?: string; caption?: string }
            const source = parseVideoSource(src)
            if (!source) return

            if (source.provider === 'file' && !/^(https?:)?\/\//.test(src) && !src.startsWith('/')) {
                ctx.report({
                    node,
                    severity: 'warning',
                    message: `Video "${src}" is a relative path, which won't resolve from the page URL. Put it in public/ (e.g. /videos/clip.mp4) or import it in MDX and use <Video src={clip} />.`,
                })
            }

            return buildVideoNode(source, { title, caption }) as unknown as Element
        },
    },
}

const ANCHORED_HEADINGS = new Set(['h2', 'h3', 'h4'])

/**
 * Adds a hover "#" permalink to h2–h4. Astro assigns heading ids after user
 * plugins run, so ids are generated here with the same slugger (Astro keeps
 * existing ids, so the table of contents stays in sync).
 */
const headingAnchors = (): HastPluginDefinition => {
    const slugger = new GithubSlugger()
    return {
        name: 'heading-anchors',
        element: {
            filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            visit(node, ctx) {
                const existing = node.properties?.id
                const id = typeof existing === 'string' ? existing : slugger.slug(ctx.textContent(node))
                if (typeof existing !== 'string') ctx.setProperty(node, 'id', id)
                if (!ANCHORED_HEADINGS.has(node.tagName)) return

                // Empty link text keeps "#" out of the heading's textContent (and the TOC).
                ctx.appendChild(node, {
                    type: 'element',
                    tagName: 'a',
                    properties: { class: 'heading-anchor', href: `#${id}`, 'aria-label': 'Link to this section' },
                    children: [],
                })
            },
        },
    }
}

export const mdastPlugins = [videoEmbedMdast]
export const hastPlugins = [videoEmbedHast, headingAnchors]
