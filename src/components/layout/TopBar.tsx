import { NavLink, Link } from 'react-router-dom'
import { Logo } from '../ui/Logo'
import s from './TopBar.module.css'

const items = [
  { to: '/', label: 'เครื่องคำนวณ', end: true },
  { to: '/plan', label: 'วางแผนภาษี' },
  { to: '/dashboard', label: 'สำหรับสำนักงานบัญชี' },
  { to: '/soon/knowledge', label: 'คลังความรู้' },
]

export function TopBar() {
  return (
    <header className={s.bar}>
      <div className={s.left}>
        <Logo size="sm" />
        <nav className={s.nav} aria-label="เมนูหลัก">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.end}>
              {it.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className={s.right}>
        <Link to="/file" className={s.login}>
          เข้าสู่ระบบ
        </Link>
        <Link to="/calc/income" className={s.cta}>
          เริ่มคำนวณฟรี
        </Link>
      </div>
    </header>
  )
}
