import { getCollection, type CollectionEntry } from 'astro:content'

type CollectionName = 'blog' | 'projects'

/** Entries of a collection, newest first. */
export const getSortedPosts = async <C extends CollectionName = 'blog'>(
    collection: C = 'blog' as C
): Promise<CollectionEntry<C>[]> => {
    const entries = await getCollection(collection)
    return entries.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
}

/** Groups already-sorted entries by publish year, preserving order (newest year first). */
export const groupByYear = <T extends { data: { pubDate: Date } }>(entries: T[]): [number, T[]][] => {
    const groups = new Map<number, T[]>()
    for (const entry of entries) {
        const year = entry.data.pubDate.getFullYear()
        groups.set(year, [...(groups.get(year) ?? []), entry])
    }
    return [...groups]
}
