import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import robotsTxt from 'astro-robots-txt'
import tailwind from '@tailwindcss/vite'
import { satteri } from '@astrojs/markdown-satteri'
import { hastPlugins, mdastPlugins } from './src/plugins/markdown.ts'

// https://astro.build/config
export default defineConfig({
    site: 'https://elliott.diy',
    integrations: [mdx(), sitemap(), robotsTxt()],
    vite: {
        plugins: [tailwind()],
    },
    markdown: {
        // Video embeds + heading permalinks for .md and .mdx (see src/plugins/markdown.ts)
        processor: satteri({ mdastPlugins, hastPlugins }),
        shikiConfig: {
            // https://shiki.style/themes — dark colours are applied via CSS in global.css
            themes: {
                light: 'catppuccin-latte',
                dark: 'poimandres',
            },
            wrap: false,
        },
    },
})
