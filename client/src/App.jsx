import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import { LanguageProvider } from './contexts/LanguageContext'
import { ResultsProvider } from './contexts/ResultsContext'
import { ProgressProvider } from './contexts/ProgressContext'
import PersonalityTest from './pages/PersonalityTest'
import PersonalityTestResult from './pages/PersonalityTestResult'
import TermsOfService from './pages/TermsOfService'
import PrivacyPolicy from './pages/PrivacyPolicy'
import RefundPolicy from './pages/RefundPolicy'
import NotFound from './pages/NotFound'

function Layout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ResultsProvider>
          <ProgressProvider>
            <ScrollToTop />
            <Routes>
              {/* 루트 경로: 테스트 페이지 직접 렌더링 (기본 영어) */}
              <Route path="/" element={<Layout><PersonalityTest /></Layout>} />
              
              {/* 언어별 루트: /en, /jp → 테스트 페이지 */}
              <Route path="/:lang" element={<Layout><PersonalityTest /></Layout>} />
              
              {/* 결과 페이지: /result/:resultId */}
              <Route path="/result/:resultId" element={<Layout><PersonalityTestResult /></Layout>} />
              
              {/* 기타 페이지: /terms, /privacy, /refund */}
              <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
              <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
              <Route path="/refund" element={<Layout><RefundPolicy /></Layout>} />
              
              {/* 404 라우트 - 반드시 가장 마지막에! */}
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </ProgressProvider>
        </ResultsProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App
