
import { LRUCache } from 'lru-cache'

type Options = {
    uniqueTokenPerInterval?: number // Max requests per interval
    interval?: number // Interval in ms
}

export const rateLimit = (options?: Options) => {
    const tokenCache = new LRUCache({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000,
    })

    return {
        check: (limit: number, token: string, weight: number = 1) => {
            const tokenCount = (tokenCache.get(token) as number[]) || [0]
            if (tokenCount[0] === 0) {
                tokenCache.set(token, tokenCount)
            }
            tokenCount[0] += weight

            const currentUsage = tokenCount[0]
            const isRateLimited = currentUsage > limit
            const headers = {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': Math.max(0, limit - currentUsage).toString(),
            }

            return {
                isRateLimited,
                headers,
            }
        },
    }
}
