import { VirtualizedNode } from '../lib/VirtualizedNode'

export const removeNodeFromList = (
  node: VirtualizedNode,
  list: VirtualizedNode[]
) => {
  const index = list.findIndex(n => n === node)

  if (index >= 0) list.splice(index, 1)
}
