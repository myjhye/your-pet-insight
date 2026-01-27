import { useNavigate } from 'react-router-dom'
import Hero from '../components/Hero'
import PetCard from '../components/PetCard'
import TrustSection from '../components/TrustSection'
import BackgroundEffects from '../components/BackgroundEffects'

function Home() {
  const navigate = useNavigate()

  const handleCatClick = () => {
    // TODO: Navigate to cat test page
    console.log('Cat test clicked')
  }

  const handleDogClick = () => {
    navigate('/dog-test')
  }

  return (
    <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 md:py-16 relative overflow-hidden">
      <BackgroundEffects />
      <Hero />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full mx-auto relative z-10">
        <PetCard type="cat" onClick={handleCatClick} />
        <PetCard type="dog" onClick={handleDogClick} />
      </div>

      <TrustSection />
    </main>
  )
}

export default Home
