import { NavLink } from 'react-router-dom'
import s from './PhoneTabBar.module.css'

const tabs = [
  { to: '/dashboard', label: 'ภาพรวม' },
  { to: '/calc', label: 'คำนวณ', match: ['/calc', '/result'] },
  { to: '/plan', label: 'วางแผน' },
  { to: '/file', label: 'ฉัน' },
]

export function PhoneTabBar({ active }: { active: 'ภาพรวม' | 'คำนวณ' | 'วางแผน' | 'ฉัน' }) {
  return (
    <nav className={s.bar} aria-label="แท็บหลัก">
      {tabs.map((t) => (
        <NavLink key={t.label} to={t.to} className={s.tab} aria-current={t.label === active ? 'page' : undefined}>
          <span className={s.icon} aria-hidden="true" />
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
