/** Progressive enhancements for long-form content pages. */

// YouTube facades: swap the thumbnail link for the real player on click.
const loadEmbed = (facade: HTMLAnchorElement) => {
    const src = facade.dataset.embedSrc
    if (!src) return
    const iframe = document.createElement('iframe')
    iframe.src = src
    iframe.title = facade.dataset.embedTitle ?? 'Embedded video'
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    iframe.allowFullscreen = true
    iframe.referrerPolicy = 'strict-origin-when-cross-origin'
    facade.replaceWith(iframe)
    iframe.focus()
}

document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
    const facade = (event.target as Element).closest<HTMLAnchorElement>('a.video-facade')
    if (!facade) return
    event.preventDefault()
    loadEmbed(facade)
})

document.querySelectorAll<HTMLAnchorElement>('a.video-facade[data-autoplay]').forEach(loadEmbed)

// Copy buttons on code blocks.
document.querySelectorAll<HTMLPreElement>('.prose-content pre').forEach((pre) => {
    if (!navigator.clipboard) return

    const wrapper = document.createElement('div')
    wrapper.className = 'code-block'
    pre.replaceWith(wrapper)
    wrapper.append(pre)

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'code-copy'
    button.textContent = 'Copy'
    button.setAttribute('aria-label', 'Copy code to clipboard')
    wrapper.append(button)

    let reset: number | undefined
    button.addEventListener('click', async () => {
        const code = pre.querySelector('code') ?? pre
        try {
            await navigator.clipboard.writeText(code.textContent?.replace(/\n$/, '') ?? '')
            button.textContent = 'Copied!'
        } catch {
            button.textContent = 'Failed'
        }
        window.clearTimeout(reset)
        reset = window.setTimeout(() => (button.textContent = 'Copy'), 2000)
    })
})
