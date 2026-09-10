import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { modules } from '../../data/modules'
import { user } from '../../data/history'
import { Avatar } from '../ui/Bits'
import { Logo } from '../ui/Logo'
import s from './DarkSidebar.module.css'

const nav = [
  { to: '/dashboard', label: 'ภาพรวม', match: (p: string) => p.startsWith('/dashboard') },
  { to: '/calc/income', label: 'เครื่องคำนวณ', match: (p: string) => p.startsWith('/calc') || p.startsWith('/result') },
  { to: '/plan', label: 'วางแผนลดหย่อน', match: (p: string) => p.startsWith('/plan') },
  { to: '/file#docs', label: 'เอกสาร', match: (p: string, h: string) => p === '/file' && h === '#docs' },
  { to: '/file', label: 'ยื่นแบบ', match: (p: string, h: string) => p === '/file' && h !== '#docs' },
]

export function DarkSidebar({ minHeight, children }: { minHeight?: number; children?: ReactNode }) {
  const loc = useLocation()
  return (
    <aside className={s.side} style={{ minHeight }}>
      <div className={s.logo}>
        <Logo size="sm" onDark />
      </div>
      {children ?? (
        <>
          <nav className={s.nav} aria-label="เมนู">
            {nav.map((n) => (
              <Link key={n.label} to={n.to} className={s.row} aria-current={n.match(loc.pathname, loc.hash) ? 'page' : undefined}>
                <span className={s.marker} aria-hidden="true" />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className={s.eyebrow}>โมดูลที่เปิดใช้</div>
          <div className={s.legend}>
            {modules
              .filter((m) => m.id !== 'land')
              .map((m) => (
                <div key={m.id} className={s.legendRow}>
                  <span className={s.dot} style={{ background: m.onDark }} aria-hidden="true" />
                  {m.id === 'vat' ? 'VAT' : m.id === 'crypto' ? 'คริปโต' : m.short}
                </div>
              ))}
          </div>
          <div className={s.promo}>
            <div className={s.promoTitle}>โหมดสำนักงานบัญชี</div>
            <div className={s.promoSub}>จัดการลูกค้าหลายรายในหน้าเดียว</div>
          </div>
        </>
      )}
      <div className={s.user}>
        <Avatar onDark />
        <div>
          <div className={s.userName}>{user.name}</div>
          <div className={s.userPlan}>{user.plan}</div>
        </div>
      </div>
    </aside>
  )
}
