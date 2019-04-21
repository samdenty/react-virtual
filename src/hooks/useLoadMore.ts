import { VirtualizedNode, VirtualizedContainer } from '../lib'
import { useComputed } from './useComputed'
import { usePrevious } from './usePrevious'

export const useLoadMore = <Item, Result>(
  instance: VirtualizedContainer<Item>,
  canLoadMore: () => Result,
  loadMore: (data: Result) => Promise<void> | void,
  inputs = []
) => {
  const result = useComputed(canLoadMore, [instance, ...inputs])
  const previousResult = usePrevious(result)

  if (!previousResult && result) {
    // Need to run async as this function will mutate values
    // But that should happen outside the current render, otherwise it results in inconsistent data
    // Otherwise infinite loop
    // We could bypass react hooks and use computed directly, and run the below in a reaction
    Promise.resolve().then(() => {
      loadMore(result)
    })
  }
}
