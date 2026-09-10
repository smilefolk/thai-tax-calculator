# ภาษีง่าย — Thai Tax Calculator

เว็บคำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90/91) สร้างตาม design handoff ใน
`design_handoff_thai_tax_calculator/` — wizard ทีละขั้นพร้อมแถบสรุปสด, มุมมองสมุดบัญชี,
หน้าผลลัพธ์, เปรียบเทียบแผนลดหย่อน, แดชบอร์ด, ยื่นแบบ/สมัครสมาชิก และเวอร์ชันมือถือ

## เริ่มใช้งาน

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests ของ tax engine
npm run build      # production build → dist/
```

## โครงสร้าง

| ที่อยู่ | หน้าที่ |
|---|---|
| `src/lib/tax/config/` | กฎภาษีแยกตามปี (ขั้นบันได, เพดานลดหย่อน, กฎหักค่าใช้จ่ายราย 40(x), วันยื่น) |
| `src/lib/tax/calc.ts` | pure functions: รายได้ → ค่าใช้จ่าย → ลดหย่อน (พร้อมเพดานรวม) → ขั้นภาษี → ภาษี/คืน |
| `src/lib/tax/plans.ts` | แผน A/B/C และเส้นโค้ง diminishing-returns คำนวณจากตำแหน่งขั้นภาษีของผู้ใช้จริง |
| `src/lib/tax/calc.test.ts` | Vitest — ทุกขอบขั้นภาษี, worked example ของ handoff, เพดานทุกตัว |
| `src/store/taxReturn.tsx` | โมเดล tax return หนึ่งชุด + reducer + autosave ลง `localStorage` |
| `src/styles/tokens.css` | design tokens ทั้งหมด (สี oklch, ฟอนต์, เงา, motion) |
| `src/components/` | primitives (Button, MoneyInput, Slider, RadioCard, BracketBar, LedgerRow…) และ layout |
| `src/pages/` | Landing · wizard (4 สเต็ป + 11 คำถามมือถือ) · Ledger · Result · Plan · Dashboard · Filing |

## เส้นทาง (routes)

- `/` หน้าแรก
- `/calc/filer` `/calc/income` `/calc/deductions` `/calc/summary` — wizard เดสก์ท็อป
- `/calc/q/1` … `/calc/q/11` — โฟลว์มือถือทีละคำถาม (redirect อัตโนมัติตามขนาดจอ)
- `/calc/ledger` — มุมมองสมุดบัญชี แก้ตัวเลขในบรรทัดได้
- `/result` `/plan` `/dashboard` `/file`

## การตัดสินใจที่ควรรู้

- **ตัวเลขทุกตัวคำนวณจริง** ไม่มี fixture ใน UI — ค่าเริ่มต้นคือ worked example ของ handoff
  (65,000/เดือน + โบนัส 130,000 → ภาษี 53,900 ขอคืน 4,100) ตัวเลขที่ต่างจากภาพออกแบบ
  (เช่น แผน C, สิทธิคงเหลือ) คือค่าที่ engine คำนวณจากกฎจริง
- **ประวัติปีก่อน** (`src/data/history.ts`) และผู้ใช้เป็น fixture เพราะยังไม่มี backend
- **แท็บบาร์มือถือ** ใช้ชุดเดียว (ภาพรวม / คำนวณ / วางแผน / ฉัน) แทนที่จะสลับชุดตามหน้า
- **Countdown วันยื่น** คำนวณจากวันจริงเทียบกับ `filingDeadline` ใน config — ถ้าเลยกำหนดจะแสดง 0 วัน
- **เงินได้ 40(1)/40(2) หักค่าใช้จ่ายแบบเหมาเท่านั้น** — ต่างจาก handoff ที่วาด radio "ตามจริง" ไว้
  เพราะกฎหมายไม่ให้เลือก (`actualAllowed: false` ใน config; engine ignore ค่า `actual` ที่ค้างใน draft)
- ระบบสมาชิก, e-Filing, นำเข้าไฟล์ 50 ทวิ และโมดูลภาษีอื่นอีก 5 ตัว เป็น UI สาธิต/ยังไม่เปิด

> ⚠️ อัตราและเพดานใน `config/y2568.ts` มาจาก handoff และความรู้ทั่วไป
> ต้องตรวจกับประมวลรัษฎากร/ประกาศกรมสรรพากรฉบับล่าสุดก่อนใช้งานจริง
