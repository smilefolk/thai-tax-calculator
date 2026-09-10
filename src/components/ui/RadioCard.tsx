import type { ReactNode } from 'react'
import s from './RadioCard.module.css'

interface Props {
  selected: boolean
  onSelect: () => void
  title: ReactNode
  sub?: ReactNode
  badge?: ReactNode
  layout?: 'stack' | 'row'
  name: string
}

export function RadioCard({ selected, onSelect, title, sub, badge, layout = 'stack', name }: Props) {
  const row = layout === 'row'
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      name={name}
      className={[s.card, row ? s.row : ''].join(' ')}
      data-selected={selected}
      data-thick={row}
      onClick={onSelect}
    >
      {row ? (
        <>
          <span className={s.head}>
            <span className={s.radio} aria-hidden="true" />
          </span>
          <span className={s.body}>
            <span className={s.title} style={{ display: 'block' }}>
              {title}
            </span>
            {sub && (
              <span className={s.sub} style={{ display: 'block' }}>
                {sub}
              </span>
            )}
          </span>
          {badge && <span className={s.badge}>{badge}</span>}
        </>
      ) : (
        <>
          <span className={s.head}>
            <span className={s.radio} aria-hidden="true" />
            <span className={s.title}>{title}</span>
          </span>
          {sub && <span className={s.sub}>{sub}</span>}
        </>
      )}
    </button>
  )
}
