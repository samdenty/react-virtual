import * as React from 'react'
import { Key, VirtualizedNode, VirtualizedContainer } from '../lib'
import { useVirtualized } from '../hooks'
import { observer } from 'mobx-react-lite'
import { transaction } from 'mobx'
import { List } from './List'

export type VirtualizedRenderer<Item> = (
  item: Item,
  node: VirtualizedNode
) => any

export type VirtualizedKeepMounted<Item> =
  | boolean
  | ((item: Item, node: VirtualizedNode) => boolean)

export interface VirtualizedProps<Item> {
  /**
   * Should return a unique ID for each item
   */
  getKey(item: Item, index: number): Key
  items: Item[]
  children: VirtualizedRenderer<Item>

  /**
   * If the height of the items is irregular, specifying this option can improve scroll performance
   * The closer you can get, the better. The further you are off, more scroll inertia is lost
   *
   * By default, it averages all the item heights
   */
  estimateHeight?(item: Item): number | null
  /**
   * Use a custom instance to control the internal state
   */
  instance?: VirtualizedContainer<Item>
  /**
   * Scroll to a specific item index (user can scroll around)
   */
  scrollToIndex?: number
  /**
   * If the items in your list require state, you should set this to true.
   * Or provide a function that returns whether or not a specific item should stay mounted
   */
  keepMounted?: VirtualizedKeepMounted<Item>
  /**
   * Adjusts how far you can scroll (and scrollbar size)
   */
  itemCount?: number
  /**
   * How many items should be rendered beyond the edge of the scroll container
   */
  overscan?: number
}

export const Virtualized: <Item>(
  props: VirtualizedProps<Item>
) => any = observer(
  ({
    getKey,
    items,
    scrollToIndex = 0,
    itemCount = null,
    overscan = 2,
    estimateHeight = null,
    keepMounted = false,
    instance = useVirtualized(),
    children: render
  }) => {
    // Keep props in sync with instance
    transaction(() => {
      React.useMemo(() => {
        instance.nodeHeightEstimator = estimateHeight
        instance.overscan = overscan
        instance.itemCount = itemCount
      }, [instance, estimateHeight, overscan, itemCount])

      React.useMemo(
        () =>
          items.forEach((item, index) => {
            const key = getKey(item, index)
            const node = instance.get(key)

            node.index = index
            node.value = item
          }),
        [items, instance, getKey]
      )

      React.useMemo(
        () => (instance.scrollToNode = instance.getIndex(scrollToIndex)),
        [instance, scrollToIndex]
      )
    })

    return (
      <div
        style={{
          height: '300px',
          background: 'green',
          overflowY: 'scroll'
        }}
        data-scrolling={instance.scrolling ? '' : undefined}
        ref={instance.ref}>
        <List instance={instance} keepMounted={keepMounted} render={render} />
      </div>
    )
  }
)
