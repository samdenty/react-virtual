import * as React from 'react'
import { observer, useComputed } from 'mobx-react-lite'
import { VirtualizedProps, VirtualizedRenderer } from './Virtualized'
import { Node } from './Node'
import { useRenderedNodes } from '../hooks'
import { untracked } from 'mobx'

export const List: <Item>(
  props: {
    render: VirtualizedRenderer<Item>
  } & Pick<VirtualizedProps<Item>, 'instance' | 'keepMounted'>
) => any = observer(
  ({ instance, keepMounted, render }): any => {
    const nodes = useRenderedNodes(instance, keepMounted)

    const firstNode = nodes[0]
    const lastNode = nodes[nodes.length - 1]

    const paddingTop = firstNode && firstNode.top
    const paddingBottom = lastNode && lastNode.bottom

    return (
      <div
        style={{
          transform: `translate(0, ${-instance.adjustment}px)`,
          pointerEvents: instance.scrolling ? 'none' : undefined,
          paddingTop,
          paddingBottom
        }}>
        {nodes.map(node => (
          <Node key={node.key} node={node} render={render} />
        ))}
      </div>
    )
  }
)
