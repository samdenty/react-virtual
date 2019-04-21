import { useMemo } from 'react'
import { VirtualizedContainer } from '../lib'

export const useVirtualized = <Item>() => {
  const container = useMemo(() => new VirtualizedContainer<Item>(), [])
  return container
}
