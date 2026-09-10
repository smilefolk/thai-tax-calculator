import { useEffect, useRef, useState, type DragEvent } from 'react'
import { Pill } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'
import { RadioCard } from '../components/ui/RadioCard'
import { user } from '../data/history'
import { bytes, money } from '../lib/format'
import type { Attachment, AttachmentKind } from '../lib/tax/types'
import { useTaxReturn } from '../store/taxReturn'
import s from './Filing.module.css'

interface RequiredDoc {
  kind: AttachmentKind
  label: string
}

/** Documents this return needs — derived from what was claimed. */
function useRequiredDocs(): RequiredDoc[] {
  const { ret } = useTaxReturn()
  const req: RequiredDoc[] = [{ kind: 'withholding-cert', label: `50ทวิ-${ret.taxYear}.pdf` }]
  if (ret.deductions.lifeInsurance > 0) req.push({ kind: 'life-insurance', label: 'หนังสือรับรองเบี้ยประกันชีวิต' })
  if (ret.deductions.ssf > 0) req.push({ kind: 'ssf', label: 'หนังสือรับรอง SSF' })
  if (ret.deductions.rmf > 0) req.push({ kind: 'rmf', label: 'หนังสือรับรอง RMF' })
  return req
}

function FileCard({ a, onRemove }: { a: Attachment; onRemove: () => void }) {
  return (
    <div className={s.file} data-status={a.status}>
      <span className={s.glyph} aria-hidden="true" />
      <div className={s.fileBody}>
        <div className={s.fileName}>{a.filename}</div>
        <div className={s.fileMeta}>{a.status === 'uploading' ? 'กำลังอัปโหลด…' : a.status === 'error' ? 'อัปโหลดไม่สำเร็จ' : bytes(a.size)}</div>
      </div>
      {a.status === 'verified' && (
        <span className={s.tick} aria-label="ตรวจสอบแล้ว">
          ✓
        </span>
      )}
      {a.status === 'uploading' && <span className={s.spin} aria-label="กำลังอัปโหลด" />}
      {a.status === 'pending' && <span className={s.spin} aria-label="รอตรวจสอบ" />}
      <button type="button" className={s.remove} onClick={onRemove} aria-label={`ลบ ${a.filename}`}>
        ✕
      </button>
    </div>
  )
}

export function Filing() {
  const { ret, derived: d, dispatch } = useTaxReturn()
  const required = useRequiredDocs()
  const fileInput = useRef<HTMLInputElement>(null)
  const pendingKind = useRef<AttachmentKind>('other')
  const [over, setOver] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [authNote, setAuthNote] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const verified = (kind: AttachmentKind) => ret.attachments.find((a) => a.kind === kind && a.status !== 'error')
  const missing = required.filter((r) => !verified(r.kind))
  const blocked = missing.length > 0 || ret.attachments.some((a) => a.status === 'uploading' || a.status === 'pending')

  // simulate the upload lifecycle: pending → uploading → verified
  useEffect(() => {
    const timers: number[] = []
    for (const a of ret.attachments) {
      if (a.status === 'pending') timers.push(window.setTimeout(() => dispatch({ type: 'setAttachmentStatus', id: a.id, status: 'uploading' }), 300))
      if (a.status === 'uploading') timers.push(window.setTimeout(() => dispatch({ type: 'setAttachmentStatus', id: a.id, status: 'verified' }), 1400))
    }
    return () => timers.forEach(clearTimeout)
  }, [ret.attachments, dispatch])

  const addFiles = (files: FileList | null, kind: AttachmentKind) => {
    if (!files) return
    for (const f of Array.from(files)) {
      dispatch({
        type: 'addAttachment',
        attachment: { id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, kind, filename: f.name, size: f.size, status: 'pending' },
      })
    }
  }
  const pick = (kind: AttachmentKind) => {
    pendingKind.current = kind
    fileInput.current?.click()
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    addFiles(e.dataTransfer.files, missing[0]?.kind ?? 'other')
  }

  return (
    <div className={s.page}>
      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,image/*"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files, pendingKind.current)
          e.target.value = ''
        }}
      />
      <div className={s.grid}>
        <section className={s.card} aria-labelledby="file-h">
          <div className="eyebrow">ขั้นตอนสุดท้าย</div>
          <h2 id="file-h" className={s.h2}>
            ยื่นแบบ {ret.income.every((e) => e.category === '40(1)') ? 'ภ.ง.ด. 91' : 'ภ.ง.ด. 90'} ปีภาษี {ret.taxYear}
          </h2>
          <p className={s.lead}>เราตรวจครบทุกช่องแล้ว เลือกได้ว่าจะยื่นผ่านระบบให้เลย หรือดาวน์โหลดไปกรอกในเว็บกรมสรรพากรเอง</p>

          <div className={s.methods} role="radiogroup" aria-label="วิธียื่นแบบ">
            <RadioCard
              name="filing"
              layout="row"
              selected={ret.filingMethod === 'online'}
              onSelect={() => dispatch({ type: 'setFilingMethod', method: 'online' })}
              title="ยื่นออนไลน์ผ่านภาษีง่าย"
              sub="เชื่อมกับ e-Filing ของกรมสรรพากร ได้เลขรับทันที เงินคืนเข้าพร้อมเพย์ภายใน 7 วัน"
              badge={
                <Pill bg="var(--green-tint)" color="var(--green-deeper)" style={{ padding: '5px 11px', fontSize: 11.5 }}>
                  เร็วที่สุด
                </Pill>
              }
            />
            <RadioCard
              name="filing"
              layout="row"
              selected={ret.filingMethod === 'download'}
              onSelect={() => dispatch({ type: 'setFilingMethod', method: 'download' })}
              title="ดาวน์โหลดไฟล์ไปยื่นเอง"
              sub="ได้ PDF ที่กรอกครบ พร้อมไฟล์สรุปสำหรับส่งให้นักบัญชี"
            />
          </div>

          <div id="docs" className={s.docsTitle}>
            เอกสารที่จะแนบไปด้วย
          </div>
          <div className={s.docs}>
            {ret.attachments.map((a) => (
              <FileCard key={a.id} a={a} onRemove={() => dispatch({ type: 'removeAttachment', id: a.id })} />
            ))}
            {missing.map((m) => (
              <div key={m.kind} className={s.file} data-status="missing">
                <span className={s.glyph} aria-hidden="true" />
                <div className={s.fileBody}>
                  <div className={s.fileName}>{m.label}</div>
                  <div className={s.fileMeta} data-sans>
                    ยังไม่ได้อัปโหลด
                  </div>
                </div>
                <button type="button" className={s.upload} onClick={() => pick(m.kind)}>
                  อัปโหลด
                </button>
              </div>
            ))}
            <div
              className={s.drop}
              data-over={over}
              role="button"
              tabIndex={0}
              onClick={() => pick(missing[0]?.kind ?? 'other')}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pick(missing[0]?.kind ?? 'other')}
              onDragOver={(e) => {
                e.preventDefault()
                setOver(true)
              }}
              onDragLeave={() => setOver(false)}
              onDrop={onDrop}
              aria-label="ลากไฟล์มาวางที่นี่ หรือกดเพื่อเลือกไฟล์"
            >
              + ลากไฟล์มาวางที่นี่
            </div>
          </div>

          <div className={s.foot}>
            <div>
              <div className={s.footLabel}>{d.verdict === 'owed' ? 'ยอดชำระเพิ่ม' : 'ยอดขอคืน'}</div>
              <div className={s.footRow}>
                <span className={s.footFig} style={{ color: d.verdict === 'owed' ? 'var(--clay-mid)' : 'var(--green-deep)' }}>
                  {money(Math.abs(d.balance))}
                </span>
                <span className={s.footMeta}>{d.verdict === 'owed' ? 'ชำระผ่าน QR / บัตรเครดิต' : `เข้าพร้อมเพย์ ${user.promptPay}`}</span>
              </div>
              {blocked && <div className={s.blocker}>อัปโหลดเอกสารที่ขาดให้ครบก่อนยื่นแบบ</div>}
              {submitted && (
                <div className={s.blocker} style={{ color: 'var(--green-deep)' }} role="status">
                  บันทึกคำขอยื่นแบบแล้ว (โหมดสาธิต — ยังไม่ได้ส่งไปกรมสรรพากรจริง)
                </div>
              )}
            </div>
            <div className={s.footBtns}>
              <Button variant="ghost" size="none" style={{ padding: '14px 22px', borderRadius: 10 }} onClick={() => window.print()}>
                ดาวน์โหลด PDF
              </Button>
              <Button variant="primary" size="none" style={{ padding: '14px 30px', borderRadius: 10 }} disabled={blocked} onClick={() => setSubmitted(true)}>
                ยื่นแบบเลย
              </Button>
            </div>
          </div>
        </section>

        <aside className={s.auth} aria-labelledby="auth-h">
          <div className={s.authLogo}>
            <Logo onDark />
          </div>
          <h2 id="auth-h" className={s.authH2}>
            เก็บผลคำนวณไว้ดูปีหน้า
          </h2>
          <p className={s.authSub}>สมัครฟรี ไม่ต้องผูกบัตร ข้อมูลเข้ารหัสและลบได้ตลอดเวลา</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setAuthNote('ระบบสมาชิกยังไม่เปิดให้บริการในเวอร์ชันสาธิต — ร่างของคุณถูกบันทึกไว้ในเครื่องแล้ว')
            }}
          >
            <div className={s.fields}>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="email">
                  อีเมล
                </label>
                <div className={s.input}>
                  <input id="email" type="email" autoComplete="email" placeholder="somchai@email.com" />
                </div>
              </div>
              <div className={s.field}>
                <label className={s.fieldLabel} htmlFor="pw">
                  รหัสผ่าน
                </label>
                <div className={s.input}>
                  <input id="pw" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="••••••••••" />
                  <button type="button" className={s.show} onClick={() => setShowPw((v) => !v)} aria-pressed={showPw}>
                    {showPw ? 'ซ่อน' : 'แสดง'}
                  </button>
                </div>
              </div>
            </div>
            <Button type="submit" variant="lightTeal" size="lg" block style={{ padding: '15px 0' }}>
              สร้างบัญชี
            </Button>
          </form>
          {authNote && (
            <div className={s.note} role="status">
              {authNote}
            </div>
          )}
          <div className={s.or}>
            <i />
            <span>หรือ</span>
            <i />
          </div>
          <div className={s.oauth}>
            <button type="button" className={s.oauthBtn} onClick={() => setAuthNote('การเข้าสู่ระบบด้วย Google ยังไม่เปิดในเวอร์ชันสาธิต')}>
              <span className={s.oauthMark} style={{ background: 'rgba(255,255,255,.85)' }} aria-hidden="true" />
              ดำเนินการต่อด้วย Google
            </button>
            <button type="button" className={s.oauthBtn} onClick={() => setAuthNote('การเข้าสู่ระบบด้วย LINE ยังไม่เปิดในเวอร์ชันสาธิต')}>
              <span className={s.oauthMark} style={{ background: 'var(--green-swatch)' }} aria-hidden="true" />
              ดำเนินการต่อด้วย LINE
            </button>
          </div>
          <div className={s.fine}>การสมัครถือว่ายอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว · ภาษีง่ายไม่ใช่หน่วยงานของรัฐ ผลคำนวณเป็นการประมาณการเท่านั้น</div>
        </aside>
      </div>
    </div>
  )
}
