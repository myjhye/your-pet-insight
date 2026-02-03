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
    <div className="flex flex-col min-h-[calc(100vh-60px)]"> 
      {/* [수정 포인트]
         1. justify-center 제거: 콘텐츠가 위에서부터 자연스럽게 흐르도록 변경
         2. py-4 md:py-16 -> pt-8 md:pt-20 pb-12: 위쪽은 여유 있게, 아래쪽은 TrustSection과 만나도록 조정
      */}
      <main className="flex-grow flex flex-col items-center px-4 sm:px-6 pt-6 md:pt-12 pb-12 relative overflow-hidden">
        <BackgroundEffects />
        <Hero />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl w-full mx-auto relative z-10">
          <PetCard type="cat" onClick={handleCatClick} />
          <PetCard type="dog" onClick={handleDogClick} />
        </div>
      </main>

      {/* TrustSection을 main 바로 아래에 붙임 */}
      <TrustSection />
    </div>
  )
}

export default Home