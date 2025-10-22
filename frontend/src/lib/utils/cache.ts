type CacheItem<T, E> =
  | {
      status: 'idle'
    }
  | {
      status: 'loading'
      promise: Promise<T>
    }
  | {
      status: 'error'
      error: E
    }
  | {
      status: 'success'
      data: T
    }

export class KeyedCache<T, E> {
  private cache = new Map<string, CacheItem<T, E>>()
  private fetcher: (key: string) => Promise<T>

  constructor(fetcher: (key: string) => Promise<T>) {
    this.fetcher = fetcher
  }

  async get(key: string): Promise<T> {
    if (this.cache.has(key)) {
      const item = this.cache.get(key)!
      if (item.status === 'success') {
        return item.data
      }
      if (item.status === 'loading') {
        return item.promise
      }
    }
    const promise = this.fetcher(key)
    this.cache.set(key, { status: 'loading', promise })
    try {
      const data = await promise
      this.cache.set(key, { status: 'success', data })
      return data
    } catch (error) {
      this.cache.set(key, { status: 'error', error: error as E })
      throw error
    }
  }
}
