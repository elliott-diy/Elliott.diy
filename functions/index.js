export const onRequest = async (context) => {
    const ua = context.request.headers.get("user-agent") ?? ""

    const isCurl = /^curl\/[\d.]+/i.test(ua)

    if (!isCurl) {
        return context.next()
    }

    const body = `
elliott.diy
===========

security research, reverse engineering,
and other questionable uses of computers.

Blog      https://elliott.diy/blog
Projects  https://elliott.diy/projects
GitHub    https://github.com/elliott-diy
Source    https://github.com/elliott-diy/Elliott.diy
RSS       https://elliott.diy/rss.xml
Email     hey@elliott.diy

maybe use a real browser next time instead of curl (:

Try:
  curl https://elliott.diy/robots.txt
  curl https://elliott.diy/.well-known/security.txt

`.trimStart()

    return new Response(body, {
        headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
        },
    })
}