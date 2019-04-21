import { VirtualizedContainer } from '../lib'
import { useComputed } from 'mobx-react-lite'
import { VirtualizedKeepMounted } from '../components'

export const useRenderedNodes = <Item>(
  instance: VirtualizedContainer<Item>,
  keepMounted?: VirtualizedKeepMounted<any>
) =>
  useComputed(() => {
    let nodes = [
      ...instance.overscannedAboveNodes,
      ...instance.renderedNodes.filter(node => {
        if (node.visible) return true

        const shouldKeepMounted =
          typeof keepMounted === 'function'
            ? keepMounted(node.value, node)
            : keepMounted

        return shouldKeepMounted
      }),
      ...instance.overscannedBelowNodes
    ]

    // Mobx sometimes doesn't compute overscannedNodes before it updates
    // this component, leading to duplicated nodes
    // this fixes that (only if the issue can occur)
    if (
      instance.overscannedAboveNodes.length ||
      instance.overscannedBelowNodes.length
    )
      nodes = nodes.filter((node, index, self) => self.indexOf(node) === index)

    return nodes
  }, [instance, keepMounted])
