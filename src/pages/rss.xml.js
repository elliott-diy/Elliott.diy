import rss from '@astrojs/rss'
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts'
import { getSortedPosts } from '../utils/posts'

export async function GET(context) {
    const posts = await getSortedPosts()
    return rss({
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        site: context.site,
        customData: '<language>en-ca</language>',
        items: posts.map((post) => ({
            title: post.data.title,
            description: post.data.description,
            pubDate: post.data.pubDate,
            // Match the canonical URLs used in <head>
            link: `/blog/${post.id}`,
            categories: post.data.tags,
        })),
    })
}
