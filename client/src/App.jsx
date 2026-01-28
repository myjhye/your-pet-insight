import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import DogTest from './pages/DogTest'
import PersonalityTest from './pages/PersonalityTest'
import PersonalityTestResult from './pages/PersonalityTestResult'

function Layout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}

// 테스트 페이지용 레이아웃 (고정 Header + Footer 없음)
function TestLayout({ children }) {
  return (
    <>
      <Header fixed />
      <div className="pt-[72px]">
        {children}
      </div>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/dog-test" element={<Layout><DogTest /></Layout>} />
        <Route path="/dog-test/personality" element={<TestLayout><PersonalityTest /></TestLayout>} />
        <Route path="/dog-test/personality/result" element={<Layout><PersonalityTestResult /></Layout>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
