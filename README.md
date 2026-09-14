# elliott.diy

Source code for my personal website.

Built with Astro because everyone else is doing that.

## Overview

This repository contains the code for [https://elliott.diy](https://elliott.diy) - used to host projects, writeups, and random content.

## Development

A lot of the content on here is hard coded in the homepage and about page for now so you would have to modify that if you wanted to use it for your own blog. To add new projects or posts, just create a new .md or .mdx file in the appropriate folder under `src/content/` and it will automatically be included in the site. 
```bash
npm install
npm run dev
```

### Writing posts

* Posts with 3+ sections get a collapsed "On this page" table of contents automatically.
* Projects can set an optional `repo: 'https://github.com/...'` in frontmatter to show a Source link.
* h2–h4 headings get hover permalinks, and code blocks get a copy button.

### Embedding videos

In `.md` or `.mdx`, put a YouTube/Vimeo URL on its own line, or use image syntax with a video file:

```md
https://www.youtube.com/watch?v=dQw4w9WgXcQ

![Alt text](/videos/demo.mp4 "Optional caption")
```

In `.mdx`, the `<Video>` component is available without an import:

```mdx
<Video src="https://youtu.be/dQw4w9WgXcQ" start="1m30s" caption="Caption" />
<Video src="/videos/demo.mp4" autoplay loop controls={false} />
```

Put self-hosted videos in `public/videos/`, or import them in MDX (`import clip from './clip.mp4'`). YouTube embeds show a thumbnail and only load the player (via `youtube-nocookie.com`) when clicked. All `<Video>` props are documented in `src/utils/video.ts`.

## Build

```bash
npm run build
```

## Deployment

Deploy using Cloudflare pages or your preferred static hosting provider. I plan to setup a proper wrangler file so this can be deployed as a Cloudflare Worker in the future, but for now it's just a static site.


## Credit

This project was originally based on the
[void-astro template](https://github.com/eAntillon/void-astro/).

Since then, it has been significantly modified:

* Migrated to Astro 7 (updated with the new collection system and other changes)
* Reworked layout and component structure
* Added new features for SEO (robots.txt, twitter cards, etc.)

