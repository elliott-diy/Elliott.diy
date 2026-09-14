import dataUrl from './challenges.json?url'
import { findChallenges, getBoard, type Challenge } from './solver'

// One download shared by every embed; a failed request can be retried.
let dataRequest: Promise<Challenge[]> | undefined
function loadChallenges() {
    return dataRequest ??= fetch(dataUrl)
        .then(response => {
            if (!response.ok) throw new Error('Unable to load challenges')
            return response.json() as Promise<Challenge[]>
        })
        .catch(error => {
            dataRequest = undefined
            throw error
        })
}

class TimsWordSolver extends HTMLElement {
    private cleanup?: AbortController

    connectedCallback() {
        if (this.cleanup) return
        this.cleanup = new AbortController()
        const { signal } = this.cleanup
        const input = this.querySelector('input')!
        const previous = this.querySelector<HTMLButtonElement>('[data-previous]')!
        const next = this.querySelector<HTMLButtonElement>('[data-next]')!
        const copy = this.querySelector<HTMLButtonElement>('[data-copy]')!
        const status = this.querySelector<HTMLElement>('.tims-status')!
        const matches = this.querySelector<HTMLElement>('.tims-matches')!
        const select = this.querySelector('select')!
        const svg = this.querySelector<SVGSVGElement>('[data-board]')!
        const words = this.querySelector<HTMLElement>('.tims-words')!
        let level = Number(this.dataset.level)
        let selectedWord: string | undefined
        let busy = false
        let copyRevision = 0
        let copyTimer: ReturnType<typeof setTimeout> | undefined
        const announce = (message: string, visible = false) => {
            status.textContent = message
            status.toggleAttribute('data-visible', visible)
        }
        const setCopied = (copied: boolean) => {
            copy.querySelector('[data-copy-label]')!.textContent = copied ? 'Copied' : 'Copy answers'
            copy.querySelector('[data-copy-icon]')!.setAttribute('d', copied ? 'm5 12 4 4L19 6' : 'M9 9h12v12H9zM15 5V3H3v12h2')
        }
        const resetCopy = () => {
            copyRevision++
            clearTimeout(copyTimer)
            setCopied(false)
        }
        signal.addEventListener('abort', () => clearTimeout(copyTimer), { once: true })
        input.addEventListener('input', () => {
            input.removeAttribute('aria-invalid')
            announce('')
            resetCopy()
        }, { signal })

        const highlight = (word?: string) => {
            selectedWord = word
            svg.setAttribute('aria-label', `Solved crossword for level ${level}${word ? `, highlighting ${word}` : ''}`)
            svg.querySelectorAll('g').forEach(cell => {
                cell.classList.toggle('is-selected', !!word && !!cell.dataset.words?.split(' ').includes(word))
            })
            words.querySelectorAll('button').forEach(button => {
                button.setAttribute('aria-pressed', String(button.dataset.word === word))
            })
        }

        const render = (challenge: Challenge, all: Challenge[]) => {
            resetCopy()
            input.removeAttribute('aria-invalid')
            level = challenge.id
            this.dataset.level = String(level)
            this.querySelector('[data-level-label]')!.textContent = String(level)
            input.value = String(level)
            const index = all.indexOf(challenge)
            previous.disabled = index === 0
            next.disabled = index === all.length - 1
            this.querySelector('[data-count]')!.textContent = `${challenge.words.length} words`
            const board = getBoard(challenge)
            svg.setAttribute('viewBox', `0 0 ${board.width * 40} ${board.height * 40}`)
            svg.setAttribute('aria-label', `Solved crossword for level ${level}`)
            svg.style.setProperty('--board-width', `${board.width * 42}px`)
            svg.style.setProperty('--board-height', `${board.height * 42}px`)
            const ns = 'http://www.w3.org/2000/svg'
            svg.replaceChildren(...board.cells.map(cell => {
                const group = document.createElementNS(ns, 'g')
                group.dataset.words = cell.words.join(' ')
                const rect = document.createElementNS(ns, 'rect')
                for (const [name, value] of Object.entries({ x: cell.x * 40 + 2, y: cell.y * 40 + 2, width: 36, height: 36, rx: 7 })) {
                    rect.setAttribute(name, String(value))
                }
                const text = document.createElementNS(ns, 'text')
                text.setAttribute('x', String(cell.x * 40 + 20))
                text.setAttribute('y', String(cell.y * 40 + 21))
                text.setAttribute('dominant-baseline', 'central')
                text.setAttribute('text-anchor', 'middle')
                text.textContent = cell.letter
                group.append(rect, text)
                return group
            }))
            words.replaceChildren(...challenge.words.map(word => {
                const button = document.createElement('button')
                button.type = 'button'
                button.dataset.word = word
                button.textContent = word
                button.setAttribute('aria-pressed', 'false')
                return button
            }))
            selectedWord = undefined
            announce(`Level ${level}. ${challenge.words.length} answers found.`)
        }

        const withData = async (action: (all: Challenge[]) => void) => {
            if (busy) return
            busy = true
            this.setAttribute('aria-busy', 'true')
            announce('Loading challenges…')
            try {
                const all = await loadChallenges()
                if (!signal.aborted) action(all)
            } catch {
                if (!signal.aborted) announce('Could not load challenges. Please try again.', true)
            } finally {
                busy = false
                this.removeAttribute('aria-busy')
            }
        }

        this.querySelector('form')!.addEventListener('submit', event => {
            event.preventDefault()
            const query = input.value
            void withData(all => {
                const found = findChallenges(all, query)
                matches.hidden = found.length < 2
                select.replaceChildren(...found.map(challenge => new Option(`Level ${challenge.id} · ${challenge.letters}`, String(challenge.id))))
                if (!found.length) {
                    input.setAttribute('aria-invalid', 'true')
                    announce(`No matching challenge. Enter a level from ${all[0].id}–${all.at(-1)!.id} or all the puzzle’s letters.`, true)
                    return
                }
                render(found[0], all)
                if (found.length > 1) announce(`${found.length} matching levels. Showing level ${found[0].id}.`)
            })
        }, { signal })

        const move = (offset: number) => void withData(all => {
            const index = all.findIndex(challenge => challenge.id === level)
            const challenge = all[index + offset]
            if (challenge) {
                matches.hidden = true
                render(challenge, all)
            } else {
                announce(`Already at the ${offset < 0 ? 'first' : 'last'} level.`)
            }
        })
        previous.addEventListener('click', () => move(-1), { signal })
        next.addEventListener('click', () => move(1), { signal })
        select.addEventListener('change', () => {
            const id = Number(select.value)
            void withData(all => render(all.find(challenge => challenge.id === id)!, all))
        }, { signal })
        words.addEventListener('click', event => {
            const button = (event.target as Element).closest<HTMLButtonElement>('button[data-word]')
            if (button) highlight(selectedWord === button.dataset.word ? undefined : button.dataset.word)
        }, { signal })
        this.addEventListener('keydown', event => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return
            if ((event.target as Element).closest('input, select, textarea, [contenteditable]')) return
            if (event.key === 'Escape') highlight()
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault()
                // Preserve keyboard focus when the answer buttons are replaced.
                if (words.contains(document.activeElement)) this.focus({ preventScroll: true })
                if (event.key === 'ArrowLeft' && !previous.disabled) move(-1)
                if (event.key === 'ArrowRight' && !next.disabled) move(1)
            }
        }, { signal })
        copy.addEventListener('click', async () => {
            resetCopy()
            const revision = copyRevision
            try {
                await navigator.clipboard.writeText([...words.querySelectorAll('button')].map(button => button.textContent).join(', '))
                if (signal.aborted || revision !== copyRevision) return
                setCopied(true)
                announce('Answers copied.')
                copyTimer = setTimeout(() => setCopied(false), 2000)
            } catch {
                if (!signal.aborted && revision === copyRevision) announce('Could not copy. Select and copy the answer words instead.', true)
            }
        }, { signal })
    }

    disconnectedCallback() {
        this.cleanup?.abort()
        this.cleanup = undefined
    }
}

if (!customElements.get('tims-word-solver')) customElements.define('tims-word-solver', TimsWordSolver)
