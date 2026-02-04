import React, { useState } from 'react'
import { useLang } from '../contexts/LanguageContext'

// 1. 스타일 설정
const styleConfig = {
  cat: {
    // 배경: 시원한 민트/틸 그라데이션
    cardBg: 'bg-gradient-to-br from-[#e0f7fa] to-[#b2ebf2]',
    borderColor: 'border-teal-200/50',
    hoverBorder: 'group-hover:border-teal-300',
    buttonBg: 'bg-teal-700',
    buttonHover: 'hover:bg-teal-800',
    buttonText: 'text-white',
    buttonShadow: 'shadow-teal-900/20',
    titleColor: 'text-teal-950',
    descriptionColor: 'text-teal-800/90',
    imagePath: '/assets/cat-3d.png'
  },
  dog: {
    // 배경: 따뜻한 오렌지/앰버 그라데이션
    cardBg: 'bg-gradient-to-br from-[#fff8e1] to-[#ffe0b2]',
    borderColor: 'border-orange-200/50',
    hoverBorder: 'group-hover:border-orange-300',
    buttonBg: 'bg-orange-600',
    buttonHover: 'hover:bg-orange-700',
    buttonText: 'text-white',
    buttonShadow: 'shadow-orange-900/20',
    titleColor: 'text-orange-950',
    descriptionColor: 'text-orange-900/90',
    imagePath: '/assets/dog-3d.png'
  }
}

// 2. 텍스트 데이터 (언어별)
const textContent = {
  en: {
    cat: {
      title: 'Start Cat Test',
      desc: "Analyze your cat's behavior patterns to understand their independence style.",
      btn: 'Start Assessment'
    },
    dog: {
      title: 'Dog Personality Test',
      desc: "Discover your dog's unique character type, social style, and hidden traits with our AI-powered assessment.",
      btn: 'Analyze Personality'
    }
  },
  jp: {
    cat: {
      title: '猫の性格診断を始める',
      desc: "行動パターンを分析して、独立心や愛情表現のスタイルを理解します。",
      btn: '診断を開始'
    },
    dog: {
      title: '犬の性格診断',
      desc: "AIを活用した診断で、あなたの愛犬の独自の性格タイプ、社交スタイル、隠れた特性を発見します。",
      btn: '性格を分析'
    }
  }
}

function PetCard({ type, onClick }) {
  const { lang } = useLang()
  const [imageError, setImageError] = useState(false)
  
  const config = styleConfig[type]
  const text = textContent[lang]?.[type] || textContent.en[type]

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden group cursor-pointer
        ${config.cardBg} border-2 ${config.borderColor} ${config.hoverBorder}
        rounded-3xl 
        /* [중요] 카드의 패딩을 제거하여 이미지가 꽉 차게 만듦 */
        p-0
        shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)]
        transform transition-all duration-500 ease-out hover:-translate-y-1
        flex flex-col items-center justify-between
      `}
    >
      {/* 배경 후광 효과 */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-white/40 blur-3xl rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      {/* 중앙 캐릭터 이미지 영역 */}
      <div className="relative z-10 flex items-center justify-center w-full mt-6 md:mt-8">
        {/* 뒤쪽 고정 후광 */}
        <div className="absolute w-56 h-56 md:w-80 md:h-80 bg-white/40 blur-2xl rounded-full"></div>
        
        {!imageError ? (
          <img
            src={config.imagePath}
            alt={text.title}
            /* [중요] 이미지 크기 초대형화: w-full로 가로 꽉 채우고, 높이를 아주 크게 설정 */
            className="w-full h-64 sm:h-80 md:h-96 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)] transform transition-transform duration-500 ease-out group-hover:scale-[1.02] group-hover:-rotate-1"
            onError={() => setImageError(true)}
          />
        ) : null}
      </div>

      {/* 텍스트 콘텐츠 영역 (별도 패딩 적용) */}
      <div className="relative z-10 w-full text-center mt-auto p-5 sm:p-6 md:p-8 pt-0">
        <h2 className={`text-xl sm:text-2xl md:text-3xl font-display font-bold ${config.titleColor} mb-2 tracking-tight`}>
          {text.title}
        </h2>
        
        <p className={`${config.descriptionColor} text-sm md:text-base font-medium mb-4 md:mb-6 leading-snug px-1 line-clamp-2`}>
          {text.desc}
        </p>

        {/* 버튼 */}
        <div className={`
          w-full ${config.buttonBg} ${config.buttonText} 
          font-bold py-3.5 md:py-4 px-6 rounded-2xl
          ${config.buttonHover} transition-all duration-300 
          flex items-center justify-center shadow-md ${config.buttonShadow}
        `}>
          <span className="text-sm md:text-base">{text.btn}</span>
          <span className="material-symbols-outlined ml-2 text-base md:text-xl bg-white/20 rounded-full p-0.5 transition-transform duration-300 group-hover:translate-x-1">
            arrow_forward
          </span>
        </div>
      </div>
    </div>
  )
}

export default PetCard