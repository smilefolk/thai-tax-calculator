import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import s from './Card.module.css'

interface Props extends HTMLAttributes<HTMLDivElement> {
  radius?: number
  padding?: string | number
  dark?: boolean
  hover?: boolean
  children: ReactNode
}

export function Card({ radius = 12, padding, dark, hover, className, style, children, ...rest }: Props) {
  const st: CSSProperties = { borderRadius: radius, padding, ...style }
  return (
    <div className={[s.card, dark ? s.dark : '', className ?? ''].join(' ')} data-hover={hover} style={st} {...rest}>
      {children}
    </div>
  )
}
