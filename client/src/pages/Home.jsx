import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import Hero from '../components/Hero'
import PetCard from '../components/PetCard'
import TrustSection from '../components/TrustSection'
import BackgroundEffects from '../components/BackgroundEffects'

function Home() {
  const navigate = useNavigate()
  // [수정] lang 변수를 구조 분해 할당으로 가져옵니다.
  const { localePath, lang } = useLang()

  const handleCatClick = () => {
    // TODO: Navigate to cat test page
    console.log('Cat test clicked')
  }

  const handleDogClick = () => {
    navigate(localePath('/dog-test/personality'))
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)]"> 
      <main className="flex-grow flex flex-col items-center px-4 sm:px-6 pt-6 md:pt-12 pb-8 relative overflow-hidden">
        <BackgroundEffects />
        <Hero />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl w-full mx-auto relative z-10">
          {/* [수정] 언어(lang)가 'en'일 때는 강아지가 먼저, 그 외(jp 등)는 고양이가 먼저 오도록 분기 처리 */}
          {lang === 'en' ? (
            <>
              <PetCard type="dog" onClick={handleDogClick} />
              <PetCard type="cat" onClick={handleCatClick} />
            </>
          ) : (
            <>
              <PetCard type="cat" onClick={handleCatClick} />
              <PetCard type="dog" onClick={handleDogClick} />
            </>
          )}
        </div>
      </main>

      <TrustSection />
    </div>
  )
}

export default Home