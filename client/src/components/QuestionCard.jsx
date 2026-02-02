import { forwardRef } from 'react'

const LIKERT_OPTIONS = [
  { value: 3, label: 'Strongly Agree' },
  { value: 2, label: 'Agree' },
  { value: 1, label: 'Slightly Agree' },
  { value: 0, label: 'Neutral' },
  { value: -1, label: 'Slightly Disagree' },
  { value: -2, label: 'Disagree' },
  { value: -3, label: 'Strongly Disagree' },
]

// UI 텍스트
const UI_TEXT = {
  en: { agree: 'AGREE', disagree: 'DISAGREE' },
  jp: { agree: '同意', disagree: '同意しない' }
}

const QuestionCard = forwardRef(({ number, question, value, onChange, disabled = false, lang = 'en' }, ref) => {
  const text = UI_TEXT[lang] || UI_TEXT.en
  
  // 버튼 크기 - 모바일에서 크기 차등, 데스크탑에서 동일
  const getSizeClasses = (index) => {
    // 중앙(index 3)이 가장 작고, 양 끝이 가장 큼
    const distanceFromCenter = Math.abs(index - 3)
    
    // 모바일: 크기 차등 / 데스크탑: 동일 크기
    switch (distanceFromCenter) {
      case 3: return 'w-11 h-11 md:w-12 md:h-12'  // 양 끝 (강하게 동의/비동의)
      case 2: return 'w-9 h-9 md:w-12 md:h-12'
      case 1: return 'w-7 h-7 md:w-12 md:h-12'
      case 0: return 'w-5 h-5 md:w-12 md:h-12'    // 중앙 (중립)
      default: return 'w-9 h-9 md:w-12 md:h-12'
    }
  }
  
  // 색상
  const getColorClasses = (index, isSelected) => {
    const isAgree = index < 3
    const isNeutral = index === 3
    
    if (isSelected) {
      if (isAgree) return 'bg-emerald-500 border-emerald-500'
      if (isNeutral) return 'bg-gray-400 border-gray-400'
      return 'bg-orange-400 border-orange-400'
    }
    
    if (isAgree) return 'border-emerald-400 hover:bg-emerald-50'
    if (isNeutral) return 'border-gray-300 hover:bg-gray-50'
    return 'border-orange-300 hover:bg-orange-50'
  }

  return (
    <div 
      ref={ref}
      className={`
        bg-white rounded-2xl p-5 md:p-8 shadow-sm border border-gray-100
        transition-all duration-300
        ${disabled ? 'opacity-40 pointer-events-none' : ''}
        ${value !== undefined ? 'border-primary/20 shadow-md' : ''}
      `}
    >
      {/* 질문 텍스트 - 모바일: 왼쪽, 데스크탑: 가운데 */}
      <div className="mb-6 md:mb-8">
        <p className="text-primary text-base md:text-xl font-bold leading-relaxed text-left md:text-center">
          <span className="text-primary/60 mr-2">{number}.</span>
          {question}
        </p>
      </div>
      
      {/* Likert 스케일 */}
      <div className="flex justify-between items-center px-0 md:px-4">
        {LIKERT_OPTIONS.map((option, idx) => {
          const isSelected = value === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`
                ${getSizeClasses(idx)}
                rounded-full border-2 transition-all duration-200
                ${getColorClasses(idx, isSelected)}
                ${!disabled && !isSelected ? 'hover:scale-110 active:scale-95' : ''}
                flex items-center justify-center flex-shrink-0
              `}
              aria-label={option.label}
            >
              {isSelected && (
                <span className="material-symbols-outlined text-white text-xs md:text-base">check</span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* 레이블 */}
      <div className="flex justify-between mt-3 md:mt-4 px-0 md:px-4">
        <span className="text-emerald-500 text-xs md:text-sm font-bold tracking-wide">
          {text.agree}
        </span>
        <span className="text-orange-400 text-xs md:text-sm font-bold tracking-wide">
          {text.disagree}
        </span>
      </div>
    </div>
  )
})

QuestionCard.displayName = 'QuestionCard'

export default QuestionCard
