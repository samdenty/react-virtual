import { VirtualizedNode } from '../lib/VirtualizedNode'

export const insertNodeToList = (
  node: VirtualizedNode,
  list: VirtualizedNode[]
) => {
  const index = list.findIndex(n => n === node)

  if (index <= 0) {
    const existingInsertionIndex = list.findIndex(n => node.index < n.index)

    const insertionIndex =
      existingInsertionIndex >= 0 ? existingInsertionIndex : list.length

    list.splice(insertionIndex, 0, node)
  }
}
