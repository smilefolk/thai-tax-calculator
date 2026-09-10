import { Link } from 'react-router-dom'
import s from './Logo.module.css'

export function Logo({ size = 'md', onDark = false, to = '/' }: { size?: 'sm' | 'md'; onDark?: boolean; to?: string }) {
  return (
    <Link to={to} className={s.logo} data-size={size} data-on-dark={onDark} aria-label="ภาษีง่าย — หน้าแรก">
      <span className={s.mark} aria-hidden="true" />
      <span className={s.word}>ภาษีง่าย</span>
    </Link>
  )
}
