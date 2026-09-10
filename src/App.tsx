import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { DraftErrorBoundary } from './components/DraftErrorBoundary'
import { ComingSoon } from './pages/ComingSoon'
import { Dashboard } from './pages/Dashboard'
import { Filing } from './pages/Filing'
import { Landing } from './pages/Landing'
import { Ledger } from './pages/Ledger'
import { Plan } from './pages/Plan'
import { Result } from './pages/Result'
import { MobileFlow } from './pages/wizard/MobileFlow'
import { WizardLayout } from './pages/wizard/WizardLayout'
import { TaxReturnProvider, useTaxReturn } from './store/taxReturn'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

/** `/calc` → resume where the draft left off */
function CalcIndex() {
  const { ret } = useTaxReturn()
  return <Navigate to={`/calc/${ret.ui.currentStep}`} replace />
}

export default function App() {
  return (
    <DraftErrorBoundary>
      <TaxReturnProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/calc" element={<CalcIndex />} />
            <Route path="/calc/ledger" element={<Ledger />} />
            <Route path="/calc/q/:n" element={<MobileFlow />} />
            <Route path="/calc/:step" element={<WizardLayout />} />
            <Route path="/result" element={<Result />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/file" element={<Filing />} />
            <Route path="/soon/:id" element={<ComingSoon />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TaxReturnProvider>
    </DraftErrorBoundary>
  )
}
