import { VirtualizedContainer, VirtualizedNode } from '../lib'
import { useLoadMore } from './useLoadMore'

export type InfiniteLoaderResult<Item> = {
  before: VirtualizedNode<Item>
  after: VirtualizedNode<Item>
}

export const useInfiniteLoader = <Item>(
  instance: VirtualizedContainer<Item>,
  loadMore: (data: InfiniteLoaderResult<Item>) => Promise<void> | void
) => {
  useLoadMore(
    instance,
    (): InfiniteLoaderResult<Item> => {
      const atTop = instance.scrollTop === 0 && instance.firstVisibleNode
      if (atTop) return { before: instance.firstVisibleNode, after: null }

      const atBottom =
        instance.lastVisibleNode &&
        instance.scrollHeight - (instance.scrollTop + instance.height) < 1

      if (atBottom) return { after: instance.lastVisibleNode, before: null }

      return null
    },
    loadMore
  )
}
