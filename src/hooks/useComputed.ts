import * as mobx from 'mobx'
import { useMemo, useState, useEffect } from 'react'

// https://github.com/mobxjs/mobx-react-lite/issues/38
export const useComputed = <T>(
  func: () => T,
  inputs: ReadonlyArray<any> = []
): T => {
  const computed = useMemo(() => mobx.computed(func), inputs)
  const [value, setValue] = useState(() => computed.get())

  useEffect(
    () =>
      mobx.reaction(
        () => computed.get(),
        value => {
          setValue(value)
        }
      ),
    [computed]
  )

  return value
}
