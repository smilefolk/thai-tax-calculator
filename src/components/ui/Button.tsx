import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import s from './Button.module.css'

export type ButtonVariant =
  | 'primary'
  | 'dark'
  | 'secondary'
  | 'secondaryInk'
  | 'ghost'
  | 'green'
  | 'clay'
  | 'onDarkOutline'
  | 'onDarkWhite'
  | 'lightTeal'
  | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'none'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  to?: string
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'none', block, to, className, children, ...rest }: Props) {
  const cls = [s.btn, s[variant], size !== 'none' ? s[size] : '', block ? s.block : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  if (to) {
    return (
      <Link to={to} className={cls} style={rest.style} aria-disabled={rest.disabled} aria-label={rest['aria-label']} title={rest.title}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  )
}
