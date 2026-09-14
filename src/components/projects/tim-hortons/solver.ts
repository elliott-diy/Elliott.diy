export interface Challenge {
    id: number
    letters: string
    words: string[]
    placements: { x: number; y: number; direction: string; word: string }[]
}

export function letterKey(value: string): string {
    return value.toUpperCase().replace(/\s/g, '').split('').sort().join('')
}

export function findChallenges(challenges: Challenge[], query: string): Challenge[] {
    const value = query.trim()
    if (/^\d+$/.test(value)) return challenges.filter(({ id }) => id === Number(value))
    if (!/^[a-z\s]+$/i.test(value)) return []
    const key = letterKey(value)
    return challenges.filter(({ letters }) => letterKey(letters) === key)
}

export function getBoard(challenge: Challenge) {
    const cells = new Map<string, { x: number; y: number; letter: string; words: string[] }>()
    for (const placement of challenge.placements) {
        Array.from(placement.word).forEach((letter, index) => {
            const x = placement.x + (placement.direction === 'H' ? index : 0)
            const y = placement.y + (placement.direction === 'V' ? index : 0)
            const key = `${x},${y}`
            const cell = cells.get(key) ?? { x, y, letter, words: [] }
            cell.words.push(placement.word)
            cells.set(key, cell)
        })
    }
    const values = [...cells.values()]
    const minX = Math.min(...values.map(cell => cell.x))
    const minY = Math.min(...values.map(cell => cell.y))
    return {
        cells: values.map(cell => ({ ...cell, x: cell.x - minX, y: cell.y - minY })),
        width: Math.max(...values.map(cell => cell.x)) - minX + 1,
        height: Math.max(...values.map(cell => cell.y)) - minY + 1,
    }
}
