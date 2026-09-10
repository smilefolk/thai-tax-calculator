import { useEffect, useId, useState, type ReactNode } from 'react'
import { money, parseMoney } from '../../lib/format'
import s from './MoneyInput.module.css'

interface Props {
  label?: string
  value: number
  onChange: (n: number) => void
  helper?: ReactNode
  helperMono?: boolean
  suffix?: string
  autoFocus?: boolean
  big?: boolean
  placeholder?: string
  invalid?: boolean
  id?: string
  'aria-label'?: string
}

/** Money field: formats with thousands separators on blur, parses loosely while typing. */
export function MoneyInput({
  label,
  value,
  onChange,
  helper,
  helperMono,
  suffix = 'บาท',
  autoFocus,
  big,
  placeholder = '0',
  invalid,
  id,
  ...aria
}: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const [text, setText] = useState(value ? money(value) : '')
  const [focused, setFocused] = useState(false)

  // keep the box in sync when the model changes from elsewhere (chips, sliders, reset)
  useEffect(() => {
    if (!focused) setText(value ? money(value) : '')
  }, [value, focused])

  const inputEl = (
    <input
      id={inputId}
      className={s.input}
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={text}
      autoFocus={autoFocus}
      aria-label={aria['aria-label'] ?? label}
      aria-invalid={invalid || undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        setText(value ? money(value) : '')
      }}
      onChange={(e) => {
        const raw = e.target.value
        setText(raw)
        onChange(parseMoney(raw))
      }}
    />
  )

  return (
    <div className={[s.field, big ? s.big : ''].join(' ')}>
      {label && !big && (
        <label className={s.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={s.box} data-invalid={invalid}>
        {big ? (
          <>
            {label && (
              <label className={s.label} htmlFor={inputId}>
                {label}
              </label>
            )}
            <div className={s.row}>
              {inputEl}
              <span className={s.suffix}>{suffix}</span>
            </div>
          </>
        ) : (
          <>
            {inputEl}
            <span className={s.suffix}>{suffix}</span>
          </>
        )}
      </div>
      {helper && <span className={[s.helper, helperMono ? s.helperMono : ''].join(' ')}>{helper}</span>}
    </div>
  )
}
