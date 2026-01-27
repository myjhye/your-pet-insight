import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import DogTest from './pages/DogTest'
import PersonalityTest from './pages/PersonalityTest'

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
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/dog-test" element={<Layout><DogTest /></Layout>} />
        <Route path="/dog-test/personality" element={<PersonalityTest />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
