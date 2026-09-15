import s from './Segmented.module.css'

interface Option<T extends string> {
  value: T
  label: string
}

/** Two-to-four way pill toggle (radio semantics). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size = 'md',
}: {
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  ariaLabel: string
  size?: 'md' | 'lg'
}) {
  return (
    <div className={s.seg} role="radiogroup" aria-label={ariaLabel} data-size={size}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={s.opt} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
