import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TopBar } from '../components/layout/TopBar'
import { BracketBar, BracketCaption } from '../components/tax/BracketBar'
import { CodeChip } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { Slider } from '../components/ui/Slider'
import { modules } from '../data/modules'
import { money } from '../lib/format'
import { derive } from '../lib/tax/calc'
import { getTaxYearConfig } from '../lib/tax/config'
import { workedExample } from '../lib/tax/defaults'
import { useIsMobile } from '../hooks/useMediaQuery'
import { useTaxReturn } from '../store/taxReturn'
import s from './Landing.module.css'

const base = workedExample()

/** Hero salary card — a self-contained what-if, not the user's draft. */
function HeroCard() {
  const [monthly, setMonthly] = useState(65_000)
  const cfg = getTaxYearConfig(base.taxYear)
  const d = useMemo(() => {
    const r = { ...base, income: base.income.map((e) => (e.id === 'salary' ? { ...e, amount: monthly * 12 } : e)) }
    return derive(r, cfg)
  }, [monthly, cfg])
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <span className={s.cardTitle}>ลองเลื่อนดูเงินเดือน</span>
        <span className={s.cardYear}>ปี {base.taxYear}</span>
      </div>
      <div className={s.figRow}>
        <span className={s.fig}>{money(monthly)}</span>
        <span className={s.figUnit}>บาท / เดือน</span>
      </div>
      <div className={s.slider}>
        <Slider
          value={monthly}
          min={0}
          max={150_000}
          step={1_000}
          onChange={setMonthly}
          ariaLabel="เงินเดือนต่อเดือน"
          valueText={(n) => `${money(n)} บาทต่อเดือน`}
        />
      </div>
      <div className={s.rows}>
        <div className={s.row}>
          <span className={s.rowLabel}>เงินได้ทั้งปี</span>
          <span className={s.rowFig}>{money(d.grossIncome)}</span>
        </div>
        <div className={s.row}>
          <span className={s.rowLabel}>เงินได้สุทธิ</span>
          <span className={s.rowFig}>{money(d.netIncome)}</span>
        </div>
      </div>
      <div className={s.est}>
        <div className={s.estLabel}>ภาษีโดยประมาณ</div>
        <div className={s.estRow}>
          <span className={s.estFig}>{money(d.taxDue)}</span>
          <span className={s.estUnit}>บาท</span>
        </div>
      </div>
      <div className={s.bar}>
        <BracketBar rows={d.taxByBracket} height={10} />
      </div>
      <BracketCaption rows={d.taxByBracket} className={s.caption} />
    </div>
  )
}

export function Landing() {
  const { ret } = useTaxReturn()
  const mobile = useIsMobile()
  const startTo = mobile ? '/calc/q/1' : '/calc/income'
  return (
    <div className="page">
      <div className="page__inner">
        <TopBar />
        <section className={s.hero}>
          <div>
            <div className={s.status}>
              <i aria-hidden="true" />
              อัปเดตอัตราและสิทธิลดหย่อนปีภาษี {ret.taxYear} แล้ว
            </div>
            <h1 className={s.h1}>
              <span className={s.nowrap}>รู้ว่าต้องจ่ายภาษีเท่าไหร่</span> <span className={s.nowrap}>{mobile ? 'ในสามนาที' : 'ภายในสามนาที'}</span>
            </h1>
            <p className={s.lead}>
              {mobile
                ? 'กรอกทีละคำถาม เห็นตัวเลขขยับสดๆ'
                : 'กรอกทีละคำถาม เห็นตัวเลขขยับสดๆ ทุกครั้งที่พิมพ์ แล้วบอกต่อว่าถ้าอยากจ่ายน้อยลงต้องทำอะไร'}
            </p>
            <div className={s.ctaRow}>
              {mobile ? (
                <Button to={startTo} variant="primary" size="xl" block>
                  เริ่มคำนวณฟรี
                </Button>
              ) : (
                <>
                  <Button to={startTo} variant="primary" size="lg">
                    คำนวณภาษีเงินเดือน →
                  </Button>
                  <Button to="/result" variant="secondaryInk" size="lg" style={{ padding: '15px 26px' }}>
                    ดูตัวอย่างผลลัพธ์
                  </Button>
                </>
              )}
            </div>
            <div className={s.trust}>
              <span>ไม่ต้องสมัครสมาชิก</span>
              <span>คำนวณในเครื่องคุณ</span>
              <span>อ้างอิงประมวลรัษฎากร</span>
            </div>
          </div>
          <HeroCard />
        </section>

        <section className={s.modules} aria-labelledby="modules-h">
          <div className={s.modHead}>
            <h2 id="modules-h" className={s.modH2}>
              {mobile ? 'เลือกภาษี' : 'เลือกภาษีที่ต้องคำนวณ'}
            </h2>
            <span className={s.modNote}>ทุกโมดูลใช้ข้อมูลร่วมกัน กรอกครั้งเดียว</span>
          </div>
          <div className={s.grid}>
            {modules.map((m) => (
              <Link
                key={m.id}
                to={m.id === 'pit' ? startTo : m.to}
                className={s.mod}
                style={{ '--hue': m.hue, '--deep': m.deep } as React.CSSProperties}
              >
                <div className={s.modTop}>
                  <CodeChip bg={m.tint} color={m.deep}>
                    {m.code}
                  </CodeChip>
                  {m.meta && <span className={s.modMeta}>{m.meta}</span>}
                </div>
                <div className={s.modTitle}>{mobile ? m.short : m.title}</div>
                <div className={s.modCode}>{m.code}</div>
                <div className={s.modBlurb}>{m.blurb}</div>
                <div className={s.modLink}>เริ่มคำนวณ →</div>
              </Link>
            ))}
          </div>
        </section>
        <footer className={s.footer}>
          ภาษีง่ายไม่ใช่หน่วยงานของรัฐ · ผลคำนวณเป็นการประมาณการตามอัตราปีภาษี {ret.taxYear} · ข้อมูลทั้งหมดคำนวณและบันทึกไว้ในเครื่องคุณเท่านั้น · โปรดตรวจสอบกับกรมสรรพากรก่อนยื่นแบบจริง
        </footer>
      </div>
    </div>
  )
}
