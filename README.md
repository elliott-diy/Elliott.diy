# elliott.diy

Source code for my personal website.

Built with Astro because everyone else is doing that.

## Overview

This repository contains the code for [https://elliott.diy](https://elliott.diy) - used to host projects, writeups, and random content.

## Tech Stack

* Astro (updated to v6)
* Minimal CSS
* Umami for analytics 
* Giscus for comments 
* Deployed via Cloudflare


## Development

A lot of the content on here is hard coded in the homepage and about page for now so you would have to modify that if you wanted to use it for your own blog. To add new projects or posts, just create a new .mdx file in the appropriate folder under `src/content/` and it will automatically be included in the site. 
```bash
npm install
npm run dev
```

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

* Migrated to Astro 6 (updated with the new collection system and other changes)
* Reworked layout and component structure
* Added new features for SEO (robots.txt, twitter cards, etc.)

