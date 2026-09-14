export const onRequest: PagesFunction = async (context) => {
    const ua = context.request.headers.get("user-agent") ?? ""

    const isCli = /\b(curl|wget|httpie|xh)\b/i.test(ua)

    if (!isCli) {
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
RSS       https://elliott.diy/rss.xml

Try:
  curl https://elliott.diy/robots.txt
  curl https://elliott.diy/.well-known/security.txt

`.trimStart()

    return new Response(body, {
        headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "public, max-age=300",
        },
    })
}