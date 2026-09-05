import { useState, useEffect } from 'react'

const DOG_IMAGES = [
  '/images/dog/1.png',
  '/images/dog/2.png',
  '/images/dog/3.png',
  '/images/dog/4.png',
  '/images/dog/5.png',
  '/images/dog/6.png',
  '/images/dog/7.png',
  '/images/dog/8.png',
]

const SINGLE_SENTENCE_TEXT = {
  en: "Analyzing responses to find your pet's personality type...",
  jp: "回答を分析して愛犬の性格タイプを診断しています...",
  default: "답변을 분석하여 강아지의 성격 유형을 진단하고 있습니다..."
}

export default function AnalyzingLoader({ lang = 'en' }) {
  const [imgIndex, setImgIndex] = useState(0)

  const sentenceText = SINGLE_SENTENCE_TEXT[lang] || SINGLE_SENTENCE_TEXT.default

  // 여유롭고 부드러운 이미지 교체 (650ms 주기)
  useEffect(() => {
    const imgInterval = setInterval(() => {
      setImgIndex((prev) => (prev + 1) % DOG_IMAGES.length)
    }, 650)
    return () => clearInterval(imgInterval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#FFFDF9] via-[#F9FBF9] to-[#FFF7ED] px-6">
      {/* Soft ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-200/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        {/* 강아지 이미지 애니메이션 컨테이너 */}
        <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-dashed border-orange-300/40 rounded-full animate-spin" style={{ animationDuration: '12s' }}></div>
          
          <img
            key={imgIndex}
            src={DOG_IMAGES[imgIndex]}
            alt="Analyzing pet"
            className="w-32 h-32 object-contain drop-shadow-xl transition-all duration-500 ease-in-out transform scale-105"
          />
        </div>

        {/* 단일 문장 안내 텍스트 */}
        <p className="text-lg sm:text-xl font-display font-bold text-primary leading-snug px-2">
          {sentenceText}
        </p>
      </div>
    </div>
  )
}
