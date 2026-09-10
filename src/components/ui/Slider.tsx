import s from './Slider.module.css'

interface Props {
  value: number
  min: number
  max: number
  step?: number
  onChange: (n: number) => void
  ariaLabel: string
  /** Thai aria-valuetext e.g. "65,000 บาทต่อเดือน" */
  valueText?: (n: number) => string
  size?: 'md' | 'lg'
}

/** Native range input for keyboard/AT support, custom-drawn track/knob per design. */
export function Slider({ value, min, max, step = 1000, onChange, ariaLabel, valueText, size = 'md' }: Props) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <div className={s.wrap} data-size={size}>
      <div className={s.track} aria-hidden="true">
        <div className={s.fill} style={{ width: `${pct}%` }} />
      </div>
      <input
        className={s.input}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        aria-valuetext={valueText ? valueText(value) : undefined}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className={s.knob} style={{ left: `${pct}%` }} aria-hidden="true" />
    </div>
  )
}
