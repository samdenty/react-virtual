import {
  observable,
  computed,
  transaction,
  autorun,
  untracked,
  observe,
  reaction
} from 'mobx'
import { VirtualizedContainer, Key } from './VirtualizedContainer'
import { insertNodeToList, removeNodeFromList } from '../utils'
import { ResizeObserverCallback } from 'resize-observer/lib/ResizeObserverCallback'

declare var ResizeObserver: typeof import('resize-observer').ResizeObserver

export class VirtualizedNode<Item = any> {
  @observable public element: HTMLDivElement = null

  @observable public height: number = null
  @observable public width: number = null
  @observable public index: number = null

  @observable public rendered: boolean = false
  @observable public value: Item

  private resizeObserver: import('resize-observer').ResizeObserver
  private disposers: (() => void)[]

  constructor(
    private container: VirtualizedContainer<Item>,
    public readonly key: Key
  ) {
    this.disposers = [
      observe(this, 'index', () => {
        // When new items are added, the indexes change
        // If the first visible node is this one (one at top)
        // then we should scroll lock onto us
        if (this.container.firstVisibleNode === this) {
          this.container.scrollToNode = this
        }
      }),
      autorun(() => {
        if (this.overscannedAbove) {
          untracked(() =>
            insertNodeToList(this, this.container.overscannedAboveNodes)
          )
        } else {
          untracked(() =>
            removeNodeFromList(this, this.container.overscannedAboveNodes)
          )
        }
      }),
      autorun(() => {
        if (this.overscannedBelow) {
          untracked(() =>
            insertNodeToList(this, this.container.overscannedBelowNodes)
          )
        } else {
          untracked(() =>
            removeNodeFromList(this, this.container.overscannedBelowNodes)
          )
        }
      }),
      autorun(() => {
        if (this.rendered) {
          untracked(() => insertNodeToList(this, this.container.renderedNodes))
        } else {
          untracked(() =>
            removeNodeFromList(this, this.container.renderedNodes)
          )
        }
      }),
      autorun(() => {
        if (this.visible) {
          this.rendered = true
          untracked(() => insertNodeToList(this, this.container.visibleNodes))
        } else {
          untracked(() => removeNodeFromList(this, this.container.visibleNodes))
        }
      })
    ]
  }

  @computed({ keepAlive: true })
  public get approximateHeight() {
    if (this.height !== null) return this.height
    // If the container hasn't rendered a node yet, return null
    if (!this.container.rendered) return null

    if (this.container.nodeHeightEstimator) {
      const estimated = this.container.nodeHeightEstimator(this.value)
      if (estimated !== null) return estimated
    }

    // Fallback to the average for all nodes
    return this.container.averageNodeHeight
  }

  @computed
  public get previousNode() {
    return this.container.getIndex(this.index - 1)
  }

  @computed
  public get nextNode() {
    return this.container.getIndex(this.index + 1)
  }

  @computed({ keepAlive: true })
  public get top() {
    if (this.index === 0) return 0

    if (!this.previousNode) {
      // Calculate height by iterating through nodes N*i
      return this.container.getSectionHeight(0, this.index - 1)
    }

    // Calculate height based on previous node N+1
    return this.previousNode.top + this.previousNode.approximateHeight
  }

  @computed({ keepAlive: true })
  public get bottom() {
    if (!this.nextNode) {
      return 0
    }

    return this.nextNode.bottom + this.nextNode.approximateHeight
  }

  @computed({ keepAlive: true })
  public get overscannedAbove() {
    if (
      !this.container.overscan ||
      !this.container.firstVisibleNode ||
      this.visible
    )
      return false

    return (
      this.index < this.container.firstVisibleNode.index &&
      this.index + this.container.overscan >=
        this.container.firstVisibleNode.index
    )
  }

  @computed({ keepAlive: true })
  public get overscannedBelow() {
    if (
      !this.container.overscan ||
      !this.container.lastVisibleNode ||
      this.visible
    )
      return false

    return (
      this.index > this.container.lastVisibleNode.index &&
      this.index - this.container.overscan <=
        this.container.lastVisibleNode.index
    )
  }

  @computed({ keepAlive: true })
  public get overscanned() {
    return this.overscannedAbove || this.overscannedBelow
  }

  @computed({ keepAlive: true })
  public get visible() {
    if (this.approximateHeight === null)
      return this.container.scrollToNode === this

    const aboveFold =
      this.top + this.approximateHeight < this.container.scrollTop
    if (aboveFold) return false

    const belowFold =
      this.top > this.container.scrollTop + this.container.height
    if (belowFold) return false

    return true
  }

  public ref = (ref: HTMLDivElement) => {
    if (ref !== this.element) {
      if (this.resizeObserver) this.resizeObserver.disconnect()

      if (ref) {
        this.resizeObserver = new ResizeObserver(this.resizeObserverHandler)
        this.resizeObserver.observe(ref)
      }
    }

    this.element = ref
  }

  private resizeObserverHandler: ResizeObserverCallback = ([
    { contentRect }
  ]) => {
    const { height, width } = contentRect

    if (height === 0 && width === 0) return
    // https://github.com/pelotoncycle/resize-observer/issues/19
    if (isNaN(height) || isNaN(width)) return

    // Run in action to prevent multiple renders
    transaction(() => {
      this.width = width

      const shouldAdjustScroll = !this.container.scrollToNode

      if (shouldAdjustScroll) {
        const prevHeight = this.height
        const prevTop = this.top

        this.height = height

        // When the node's height changes, it affects the averageHeight
        // for all nodes. This means nodes above the fold will resize,
        // breaking the scroll position. This fixes that
        if (prevHeight !== this.height) {
          const difference = this.top - prevTop

          this.container.adjustment += difference
        }
      } else {
        this.height = height
      }
    })
  }

  public dispose() {
    if (this.resizeObserver) this.resizeObserver.disconnect()

    this.disposers.forEach(dispose => dispose())
  }
}
