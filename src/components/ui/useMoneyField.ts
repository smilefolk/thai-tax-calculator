import { useEffect, useState } from 'react'
import { money, parseMoney } from '../../lib/format'

/**
 * Text state for a money field: while focused the user's raw keystrokes are kept
 * (so the caret never jumps), on blur the value is re-formatted with separators.
 * Every parse goes through `parseMoney`, which clamps to MAX_MONEY.
 */
export function useMoneyField(value: number, onChange: (n: number) => void) {
  const [text, setText] = useState(value ? money(value) : '')
  const [focused, setFocused] = useState(false)

  // keep in sync when the model changes from elsewhere (chips, sliders, reset, another screen)
  useEffect(() => {
    if (!focused) setText(value ? money(value) : '')
  }, [value, focused])

  return {
    text,
    focused,
    onFocus: () => setFocused(true),
    onBlur: () => {
      setFocused(false)
      setText(value ? money(value) : '')
    },
    onChangeText: (raw: string) => {
      setText(raw)
      onChange(parseMoney(raw))
    },
  }
}
