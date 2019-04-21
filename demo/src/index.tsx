import * as React from 'react'
import { useState } from 'react'
import { render } from 'react-dom'
import { useVirtualized, Virtualized, useInfiniteLoader } from '../../src'
import { observe } from 'mobx'
import { observer } from 'mobx-react-lite'

const createRandom = (i, t = '') => ({
  text: `${i}::${Math.random()} ${t}`,
  random: Math.random() * 100,
  index: i,
  keepMounted: Math.random() >= 0.5,
  color: '#' + ((Math.random() * 0xffffff) << 0).toString(16)
})

const data = [...new Array(100)].map((item, i) => createRandom(i))

function Item({ item, node }) {
  const [clicked, setClicked] = useState(false)

  return (
    <div
      style={{
        background: item.color,
        margin: '1px',
        padding: item.random + (clicked ? 10 : 0)
      }}>
      <span>{item.text}</span>
      <button onClick={() => setClicked(clicked => !clicked)}>
        {clicked ? 'clicked' : 'click'}
      </button>
    </div>
  )
}

/**
 * TODO:
 *
 * 1. Scrolling up not properly adjusted
 *
 * 2. Support negative indexes / an option for scrollToNode to be from bottom
 *  OR - allow a custom scrollToNode computed function that returns a node
 *
 * 3. Infinite scrolling is broken
 */
const App = observer(() => {
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(data)
  const instance = useVirtualized<typeof messages[number]>()

    // useInfiniteLoader(instance, async ({ before, after }) => {
    //   console.log('loading', {
    //     before: before && before.value,
    //     after: after && after.value
    //   })

    //   setLoading(true)
    //   await new Promise(resolve =>
    //     setTimeout(() => {
    //       resolve()
    //     }, 1000)
    //   )
    //   setLoading(false)

    //   const newMessages: any[] = [...new Array(5)].map((m, i) =>
    //     createRandom(messages.length + i, 'infinite loaded')
    //   )

    //   setMessages(messages => [
    //     ...(after ? messages : []),
    //     ...newMessages,
    //     ...(before ? messages : [])
    //   ])
    // })
  ;(window as any).instance = instance

  return (
    <div style={{ opacity: loading ? 0.5 : 1 }}>
      <Virtualized
        getKey={message => message.text}
        items={messages}
        instance={instance}
        scrollToIndex={5}>
        {(item, node) => <Item key={node.key} item={item} node={node} />}
      </Virtualized>
      <button
        onClick={() => {
          setMessages(messages => [
            {
              color: 'black',
              random: 10,
              text: 'hello' + Math.random()
            } as any,
            ...messages
          ])
        }}>
        Add to top
      </button>
      <button onClick={() => (instance.scrollTop = 0)}>Scroll top</button>
      <button onClick={() => (instance.scrollTop += 10)}>Scroll down</button>
    </div>
  )
})

const rootElement = document.getElementById('root')
render(<App />, rootElement)
;(window as any).observe = observe
