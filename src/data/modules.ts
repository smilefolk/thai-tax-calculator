export interface TaxModule {
  id: 'pit' | 'cit' | 'vat' | 'wht' | 'land' | 'crypto'
  title: string
  short: string
  code: string
  blurb: string
  meta?: string
  hue: string
  deep: string
  tint: string
  onDark: string
  to: string
  available: boolean
}

export const modules: TaxModule[] = [
  {
    id: 'pit',
    title: 'ภาษีเงินได้บุคคลธรรมดา',
    short: 'บุคคลธรรมดา',
    code: 'ภ.ง.ด. 90/91',
    blurb: 'เงินเดือน โบนัส ฟรีแลนซ์ ค่าเช่า พร้อมค่าลดหย่อนครบทุกรายการ',
    meta: 'ยอดนิยม',
    hue: 'var(--teal)',
    deep: 'var(--teal-deep)',
    tint: 'var(--teal-pill)',
    onDark: 'var(--teal-on-dark)',
    to: '/calc/income',
    available: true,
  },
  {
    id: 'cit',
    title: 'ภาษีเงินได้นิติบุคคล',
    short: 'นิติบุคคล',
    code: 'ภ.ง.ด. 50',
    blurb: 'รวมสิทธิ SME กำไรสุทธิ 3 ขั้น และรายจ่ายต้องห้าม',
    hue: 'var(--clay)',
    deep: 'var(--clay-deep)',
    tint: 'var(--clay-tint)',
    onDark: 'var(--clay-on-dark)',
    to: '/soon/cit',
    available: false,
  },
  {
    id: 'vat',
    title: 'ภาษีมูลค่าเพิ่ม',
    short: 'มูลค่าเพิ่ม',
    code: 'ภ.พ. 30',
    blurb: 'ภาษีขาย ภาษีซื้อ ยอดชำระ/ขอคืน และเช็กเกณฑ์ 1.8 ล้าน',
    hue: 'var(--violet)',
    deep: 'var(--violet-deep)',
    tint: 'var(--violet-tint)',
    onDark: 'var(--violet-on-dark)',
    to: '/soon/vat',
    available: false,
  },
  {
    id: 'wht',
    title: 'ภาษีหัก ณ ที่จ่าย',
    short: 'หัก ณ ที่จ่าย',
    code: 'ภ.ง.ด. 3/53',
    blurb: 'เลือกประเภทเงินได้ ระบบเลือกอัตรา 1% / 2% / 3% / 5% ให้',
    hue: 'var(--green)',
    deep: 'oklch(0.44 0.14 152)',
    tint: 'var(--green-tint)',
    onDark: 'var(--green-dot)',
    to: '/soon/wht',
    available: false,
  },
  {
    id: 'land',
    title: 'ภาษีที่ดินและสิ่งปลูกสร้าง',
    short: 'ที่ดินและสิ่งปลูกสร้าง',
    code: 'ท้องถิ่น',
    blurb: 'แยกตามการใช้ประโยชน์ เกษตร ที่อยู่อาศัย พาณิชย์ ว่างเปล่า',
    hue: 'var(--ochre)',
    deep: 'var(--ochre-deep)',
    tint: 'var(--ochre-tint)',
    onDark: 'var(--ochre)',
    to: '/soon/land',
    available: false,
  },
  {
    id: 'crypto',
    title: 'ภาษีคริปโตและการลงทุน',
    short: 'คริปโตและการลงทุน',
    code: '40(4)(ฌ)',
    blurb: 'นำเข้าประวัติเทรด คำนวณกำไร เงินปันผล และเครดิตภาษี',
    meta: 'ใหม่',
    hue: 'var(--indigo)',
    deep: 'var(--indigo-deep)',
    tint: 'var(--indigo-tint)',
    onDark: 'var(--indigo-on-dark)',
    to: '/soon/crypto',
    available: false,
  },
]
