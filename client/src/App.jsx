import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import { LanguageProvider, DEFAULT_LANG } from './contexts/LanguageContext'
import { QuestionsProvider } from './contexts/QuestionsContext'
import { ResultsProvider } from './contexts/ResultsContext'
import { ProgressProvider } from './contexts/ProgressContext'
import Home from './pages/Home'
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

// 언어별 라우트를 감싸는 컴포넌트
function LangRoutes() {
  return (
    <LanguageProvider>
      <QuestionsProvider>
        <ResultsProvider>
          <ProgressProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/dog-test/personality" element={<Layout><PersonalityTest /></Layout>} />
              <Route path="/dog-test/personality/result/:resultId" element={<Layout><PersonalityTestResult /></Layout>} />
              <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
              <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
              <Route path="/refund" element={<Layout><RefundPolicy /></Layout>} />
              {/* 404 라우트 - 반드시 가장 마지막에! */}
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </ProgressProvider>
        </ResultsProvider>
      </QuestionsProvider>
    </LanguageProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 루트 경로는 기본 언어로 리다이렉트 */}
        <Route path="/" element={<Navigate to={`/${DEFAULT_LANG}`} replace />} />
        
        {/* 언어 접두사가 있는 모든 라우트 */}
        <Route path="/:lang/*" element={<LangRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
