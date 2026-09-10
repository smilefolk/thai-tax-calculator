import { useParams } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { CodeChip } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { modules } from '../data/modules'

const extra: Record<string, { title: string; blurb: string }> = {
  knowledge: { title: 'คลังความรู้', blurb: 'บทความอธิบายค่าลดหย่อน ขั้นภาษี และวิธีกรอกแบบทีละช่อง' },
}

export function ComingSoon() {
  const { id } = useParams()
  const m = modules.find((x) => x.id === id)
  const info = m ?? extra[id ?? ''] ?? { title: 'ยังไม่เปิดให้บริการ', blurb: '' }
  return (
    <div className="page">
      <div className="page__inner">
        <TopBar />
        <div style={{ padding: '80px 44px', maxWidth: 560 }}>
          {m && (
            <div style={{ marginBottom: 16 }}>
              <CodeChip bg={m.tint} color={m.deep}>
                {m.code}
              </CodeChip>
            </div>
          )}
          <h1 style={{ font: '600 34px/1.42 var(--sans)', marginBottom: 10 }}>{info.title}</h1>
          <p style={{ font: '300 15px/1.65 var(--sans)', color: 'var(--ink-muted)', marginBottom: 26 }}>
            {info.blurb} — โมดูลนี้อยู่ระหว่างพัฒนา ตอนนี้ใช้ได้เฉพาะภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90/91)
          </p>
          <Button variant="primary" size="lg" to="/calc/income">
            คำนวณภาษีบุคคลธรรมดา →
          </Button>
        </div>
      </div>
    </div>
  )
}
