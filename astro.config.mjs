import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import robotsTxt from 'astro-robots-txt'

import tailwind from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
    site: 'https://elliott.diy',
    integrations: [mdx(), sitemap(), robotsTxt()],
    vite: {
        plugins: [tailwind()],
    },
    markdown: {
        shikiConfig: {
          // Choose from Shiki's built-in themes (or add your own)
          // https://shiki.style/themes
          // Alternatively, provide multiple themes
          // See note below for using dual light/dark themes
          themes: {
            light: 'poimandres',
            dark: 'catppuccin-latte',
          },
        },
      },
})
