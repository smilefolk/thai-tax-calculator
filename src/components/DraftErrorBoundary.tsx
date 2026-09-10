import { Component, type ErrorInfo, type ReactNode } from 'react'
import { clearDraftStorage } from '../store/taxReturn'

interface State {
  error: Error | null
}

/**
 * Last line of defence around the whole app: if anything throws during
 * render, offer to discard the saved draft and reload instead of leaving a
 * blank page with no way out.
 */
export class DraftErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ภาษีง่าย: render failed', error, info.componentStack)
  }

  private reset = () => {
    clearDraftStorage()
    window.location.replace('/')
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" style={{ maxWidth: 520, margin: '15vh auto', padding: '0 24px', fontFamily: 'var(--sans)', color: 'var(--ink)' }}>
        <div className="eyebrow eyebrow--teal" style={{ marginBottom: 10 }}>
          เกิดข้อผิดพลาด
        </div>
        <h1 style={{ font: '600 26px/1.42 var(--sans)', margin: '0 0 10px' }}>หน้านี้แสดงผลไม่ได้</h1>
        <p style={{ font: '300 15px/1.6 var(--sans)', color: 'var(--ink-muted)', margin: '0 0 22px' }}>
          ร่างที่บันทึกไว้ในเครื่องอาจมาจากเวอร์ชันเก่าหรือเสียหาย ล้างร่างแล้วเริ่มใหม่ได้ — ข้อมูลทั้งหมดอยู่ในเครื่องคุณเท่านั้น
        </p>
        <button
          type="button"
          onClick={this.reset}
          style={{ font: '500 14px var(--sans)', background: 'var(--ink)', color: '#fff', border: 0, borderRadius: 9, padding: '12px 22px', cursor: 'pointer' }}
        >
          ล้างร่างแล้วเริ่มใหม่
        </button>
        <pre style={{ marginTop: 26, font: '400 11.5px/1.5 var(--mono)', color: 'var(--ink-faint)', whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
      </div>
    )
  }
}
