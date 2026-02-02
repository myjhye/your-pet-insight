import { forwardRef } from 'react'

const LIKERT_OPTIONS = [
  { value: 3, size: 'large', color: 'agree' },
  { value: 2, size: 'medium', color: 'agree' },
  { value: 1, size: 'small', color: 'agree' },
  { value: 0, size: 'tiny', color: 'neutral' },
  { value: -1, size: 'small', color: 'disagree' },
  { value: -2, size: 'medium', color: 'disagree' },
  { value: -3, size: 'large', color: 'disagree' },
]

// UI 텍스트
const UI_TEXT = {
  en: { agree: 'AGREE', disagree: 'DISAGREE' },
  jp: { agree: '同意', disagree: '同意しない' }
}

const QuestionCard = forwardRef(({ number, question, value, onChange, disabled = false, lang = 'en' }, ref) => {
  const text = UI_TEXT[lang] || UI_TEXT.en
  
  // 버튼 크기 설정 (모바일 최적화)
  const getSizeClasses = (size) => {
    switch (size) {
      case 'large': return 'w-12 h-12 md:w-14 md:h-14'
      case 'medium': return 'w-10 h-10 md:w-12 md:h-12'
      case 'small': return 'w-8 h-8 md:w-10 md:h-10'
      case 'tiny': return 'w-6 h-6 md:w-8 md:h-8'
      default: return 'w-10 h-10'
    }
  }
  
  // 색상 설정
  const getColorClasses = (color, isSelected) => {
    if (isSelected) {
      switch (color) {
        case 'agree': return 'bg-emerald-500 border-emerald-500'
        case 'disagree': return 'bg-orange-400 border-orange-400'
        case 'neutral': return 'bg-gray-400 border-gray-400'
        default: return 'bg-primary border-primary'
      }
    }
    switch (color) {
      case 'agree': return 'border-emerald-400 hover:bg-emerald-50'
      case 'disagree': return 'border-orange-300 hover:bg-orange-50'
      case 'neutral': return 'border-gray-300 hover:bg-gray-50'
      default: return 'border-gray-300'
    }
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
      {/* 질문 텍스트 - 왼쪽 정렬 */}
      <div className="mb-8">
        <p className="text-primary text-lg md:text-xl font-bold leading-relaxed text-left">
          <span className="text-primary/60 mr-2">{number}.</span>
          {question}
        </p>
      </div>
      
      {/* Likert 스케일 - 넉넉한 간격 */}
      <div className="flex justify-between items-end px-2 md:px-4">
        {LIKERT_OPTIONS.map((option, idx) => {
          const isSelected = value === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`
                ${getSizeClasses(option.size)}
                rounded-full border-2 transition-all duration-200
                ${getColorClasses(option.color, isSelected)}
                ${!disabled && !isSelected ? 'hover:scale-110 active:scale-95' : ''}
                flex items-center justify-center
              `}
              aria-label={`Rating ${option.value}`}
            >
              {isSelected && (
                <span className="material-symbols-outlined text-white text-sm md:text-base">check</span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* 레이블 */}
      <div className="flex justify-between mt-4 px-2 md:px-4">
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
