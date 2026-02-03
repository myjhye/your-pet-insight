import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import Hero from '../components/Hero'
import PetCard from '../components/PetCard'
import TrustSection from '../components/TrustSection'
import BackgroundEffects from '../components/BackgroundEffects'

function Home() {
  const navigate = useNavigate()
  const { localePath } = useLang()

  const handleCatClick = () => {
    // TODO: Navigate to cat test page
    console.log('Cat test clicked')
  }

  const handleDogClick = () => {
    navigate(localePath('/dog-test'))
  }

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-4 sm:px-6 py-4 md:py-16 relative overflow-hidden">
      <BackgroundEffects />
      <Hero />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl w-full mx-auto relative z-10">
        <PetCard type="cat" onClick={handleCatClick} />
        <PetCard type="dog" onClick={handleDogClick} />
      </div>

      <TrustSection />
    </main>
  )
}

export default Home
