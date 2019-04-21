import { observable, autorun, computed, action, reaction } from 'mobx'
import { VirtualizedNode } from './VirtualizedNode'

declare var ResizeObserver: typeof import('resize-observer').ResizeObserver

export type Key = string | number

export class VirtualizedContainer<Item> {
  @observable public element: HTMLDivElement = null

  @observable public scrollToNode: VirtualizedNode = null
  @observable public nodeHeightEstimator: Function = null
  @observable public itemCount: number = null
  @observable public overscan: number = 2
  @observable public adjustment: number = 0

  @observable public height: number = null
  @observable public width: number = null
  @observable public scrolling: boolean = false

  @observable public visibleNodes = new Array<VirtualizedNode<Item>>()
  @observable public renderedNodes = new Array<VirtualizedNode<Item>>()
  @observable public overscannedAboveNodes = new Array<VirtualizedNode<Item>>()
  @observable public overscannedBelowNodes = new Array<VirtualizedNode<Item>>()

  @observable private customScrollTop: number = null
  @observable private nodes = new Map<Key, VirtualizedNode<Item>>()

  private scrollingTimer: any
  private disposers: (() => void)[]

  constructor() {
    this.disposers = [
      reaction(
        () => Math.round(this.unadjustedScrollTop),
        scrollTop => {
          if (
            this.element &&
            Math.round(this.element.scrollTop) !== scrollTop
          ) {
            this.element.scrollTop = scrollTop
          }
        }
      ),
      autorun(() => {
        // Flush adjustments when not scrolling
        if (!this.scrolling && this.adjustment) {
          this.scrollTop += 0
          this.adjustment = 0
        }
      })
    ]
  }

  @computed({ keepAlive: true })
  public get scrollHeight() {
    let scrollHeight = 0
    let calculatedNodes = 0

    for (const node of this.nodes.values()) {
      calculatedNodes++
      scrollHeight += node.approximateHeight

      // We've got more nodes in cache than can be displayed
      if (calculatedNodes === this.nodes.size) break
    }

    const remaining = this.itemCount - calculatedNodes
    if (remaining > 0) {
      scrollHeight += remaining * this.averageNodeHeight
    }

    return scrollHeight
  }

  @computed({ keepAlive: true })
  public get scrollTop() {
    return this.unadjustedScrollTop + this.adjustment
  }

  public set scrollTop(value: number) {
    if (Math.round(value) !== Math.round(this.scrollTop))
      this.scrollToNode = null

    this.customScrollTop = value
  }

  @computed({ keepAlive: true })
  private get unadjustedScrollTop() {
    if (this.scrollToNode) return Math.round(this.scrollToNode.top)

    return this.customScrollTop
  }

  @computed
  public get rendered() {
    return !!this.renderedNodes.length
  }

  @computed({ keepAlive: true })
  public get averageNodeHeight() {
    let total = 0
    let amountCounted = 0

    for (const node of this.nodes.values()) {
      if (node.height !== null) {
        amountCounted++
        total += node.height
      }
    }

    if (!amountCounted) return null

    return Math.round(total / amountCounted)
  }

  @computed({ keepAlive: true })
  public get firstVisibleNode() {
    if (!this.visibleNodes.length) return null

    return this.visibleNodes[0]
  }

  @computed({ keepAlive: true })
  public get lastVisibleNode() {
    return this.visibleNodes[this.visibleNodes.length - 1]
  }

  /**
   * Calculates the size from one node to another (inclusive of both sides)
   */
  public getSectionHeight(start: number, end: number) {
    let height = 0
    for (let i = start; i <= end; i++) {
      const node = this.getIndex(i)

      height +=
        node && node.approximateHeight !== null
          ? node.approximateHeight
          : this.averageNodeHeight
    }
    return height
  }

  public get(key: Key) {
    if (!this.nodes.has(key)) this.add(key)

    return this.nodes.get(key)
  }

  @computed({ keepAlive: true })
  private get indexMap() {
    return observable.map<number, VirtualizedNode<Item>>(
      [...this.nodes.values()].map((n): any => [n.index, n])
    )
  }

  public getIndex(index: number) {
    if (index < 0) index = this.indexMap.size + index

    return this.indexMap.get(index)
  }

  public has(key: Key) {
    return this.nodes.has(key)
  }

  @action
  public add(key: Key) {
    if (this.nodes.has(key)) return

    this.nodes.set(key, new VirtualizedNode(this, key))
  }

  public remove(key: Key) {
    const node = this.nodes.get(key)
    if (node) node.dispose()

    this.nodes.delete(key)
  }

  public ref = (ref: HTMLDivElement) => {
    if (this.element && ref !== this.element) {
      this.resizeObserver.unobserve(this.element)
      this.element.removeEventListener('scroll', this.scrollListener)
    }

    if (ref) {
      this.resizeObserver.observe(ref)
      ref.addEventListener('scroll', this.scrollListener)
    }

    this.element = ref
  }

  private resizeObserver = new ResizeObserver(([{ contentRect }]) => {
    this.height = contentRect.height
    this.width = contentRect.width
  })

  private scrollListener = (event: Event) => {
    const { scrollTop } = event.currentTarget as this['element']

    if (this.scrollingTimer) clearTimeout(this.scrollingTimer)
    this.scrolling = true
    this.scrollingTimer = setTimeout(() => (this.scrolling = false), 150)

    this.scrollTop = scrollTop
  }

  public dispose() {
    if (this.element)
      this.element.removeEventListener('scroll', this.scrollListener)

    this.resizeObserver.disconnect()
    this.nodes.forEach(node => node.dispose())
    this.disposers.forEach(dispose => dispose())
  }
}
