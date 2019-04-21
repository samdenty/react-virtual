import * as React from 'react'
import { observer } from 'mobx-react-lite'
import { VirtualizedNode } from '../lib'
import { VirtualizedRenderer } from './Virtualized'

export interface NodeProps<Item> {
  node: VirtualizedNode
  render: VirtualizedRenderer<Item>
}

export const Node: <Item>(props: NodeProps<Item>) => any = observer(
  ({ render, node }) => (
    <div
      date-key={node.key}
      data-index={node.index}
      data-overscanned={node.overscanned ? '' : undefined}
      ref={node.ref}>
      {render(node.value, node)}
    </div>
  )
)
