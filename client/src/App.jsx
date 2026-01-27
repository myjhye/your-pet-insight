import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import DogTest from './pages/DogTest'

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dog-test" element={<DogTest />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
