import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useState, useEffect } from 'react'

// 사용 가능한 강아지 이미지 목록
const DOG_IMAGES = [
  'dog_enfj_main.png',
  'dog_enfp_main.png',
  'dog_entj_main.png',
  'dog_entp_main.png',
  'dog_esfj_main.png',
  'dog_esfp_main.png',
  'dog_estj_main.png',
  'dog_estp_main.png',
  'dog_infj_main.png',
  'dog_infp_main.png',
  'dog_intj_main.png',
  'dog_intp_main.png',
  'dog_isfj_main.png',
  'dog_isfp_main.png',
  'dog_istj_main.png',
  'dog_istp_main.png',
]

// UI 텍스트 다국어
const UI_TEXT = {
  en: {
    title: "Oops! Page Not Found",
    subtitle: "The page you're looking for doesn't exist or has been moved.",
    suggestion: "How about trying one of these?",
    buttons: {
      test: "Take the Test",
      types: "Personality Types",
      home: "Go Home"
    }
  },
  jp: {
    title: "ページが見つかりません",
    subtitle: "お探しのページは存在しないか、移動された可能性があります。",
    suggestion: "こちらはいかがですか？",
    buttons: {
      test: "テストを受ける",
      types: "性格タイプ",
      home: "ホームへ"
    }
  },
  ko: {
    title: "오류. 존재하지 않는 페이지입니다.",
    subtitle: "찾으시는 페이지가 존재하지 않거나 이동되었습니다.",
    suggestion: "다음과 같이 해보는 건 어떠신가요?",
    buttons: {
      test: "테스트 시작",
      types: "성격 유형",
      home: "홈으로"
    }
  }
}

function NotFound() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const [randomImage, setRandomImage] = useState('')
  const [imageError, setImageError] = useState(false)
  
  // 랜덤 강아지 이미지 선택
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * DOG_IMAGES.length)
    setRandomImage(DOG_IMAGES[randomIndex])
  }, [])
  
  // 언어별 텍스트 (fallback: en)
  const text = UI_TEXT[lang] || UI_TEXT.en

  return (
    <main className="min-h-screen bg-[#F9FBF9] flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full text-center">
        {/* 404 숫자 + 강아지 이미지 */}
        <div className="relative flex items-center justify-center mb-8">
          {/* 4 */}
          <span className="text-[8rem] md:text-[12rem] font-display font-black text-primary/10 select-none">
            4
          </span>
          
          {/* 강아지 이미지 (0 대신) */}
          <div className="relative w-32 h-32 md:w-48 md:h-48 mx-[-1rem]">
            {randomImage && !imageError ? (
              <img 
                src={`/images/archetypes/${randomImage}`}
                alt="Lost puppy"
                className="w-full h-full object-contain drop-shadow-lg"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary/30 text-8xl md:text-9xl">
                  pets
                </span>
              </div>
            )}
            
            {/* 물음표 말풍선 */}
            <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 bg-white rounded-full p-2 md:p-3 shadow-lg">
              <span className="material-symbols-outlined text-primary text-xl md:text-2xl">
                help
              </span>
            </div>
          </div>
          
          {/* 4 */}
          <span className="text-[8rem] md:text-[12rem] font-display font-black text-primary/10 select-none">
            4
          </span>
        </div>
        
        {/* 타이틀 */}
        <h1 className="text-2xl md:text-3xl font-display font-bold text-primary mb-4">
          {text.title}
        </h1>
        
        {/* 설명 */}
        <p className="text-primary/60 text-lg mb-8 max-w-md mx-auto">
          {text.subtitle}
        </p>
        
        {/* 제안 텍스트 */}
        <p className="text-primary/80 font-medium mb-6">
          {text.suggestion}
        </p>
        
        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* 테스트 시작 버튼 */}
          <button
            onClick={() => navigate(`/${lang}/dog-test/personality`)}
            className="px-8 py-4 bg-primary text-white font-bold rounded-full hover:bg-primary/90 transition-all transform hover:-translate-y-1 shadow-lg"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">quiz</span>
              {text.buttons.test}
            </span>
          </button>
          
          {/* 성격 유형 버튼 */}
          <button
            onClick={() => navigate(`/${lang}`)}
            className="px-8 py-4 bg-white text-primary font-bold rounded-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">category</span>
              {text.buttons.types}
            </span>
          </button>
          
          {/* 홈으로 버튼 */}
          <button
            onClick={() => navigate(`/${lang}`)}
            className="px-8 py-4 bg-secondary text-primary font-bold rounded-full hover:bg-secondary/80 transition-all"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">home</span>
              {text.buttons.home}
            </span>
          </button>
        </div>
        
        {/* 하단 장식 */}
        <div className="mt-12 flex justify-center gap-2">
          <span className="material-symbols-outlined text-primary/20 text-2xl">pets</span>
          <span className="material-symbols-outlined text-primary/15 text-2xl">pets</span>
          <span className="material-symbols-outlined text-primary/10 text-2xl">pets</span>
        </div>
      </div>
    </main>
  )
}

export default NotFound

