import { forwardRef } from 'react'
import LikertScale from './LikertScale'

const QuestionCard = forwardRef(function QuestionCard({ 
  number, 
  question, 
  value, 
  onChange, 
  disabled = false,
  isPlaceholder = false 
}, ref) {
  if (isPlaceholder) {
    return (
      <div className="bg-white/50 rounded-2xl p-8 border border-white/20">
        <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-8 animate-pulse"></div>
        <div className="h-12 bg-gray-200 rounded-full w-full max-w-lg mx-auto animate-pulse"></div>
      </div>
    )
  }

  return (
    <div 
      ref={ref}
      className={`
        bg-card-bg rounded-2xl shadow-soft p-8 md:p-10 transform transition-all duration-300
        ${disabled ? 'opacity-40 pointer-events-none' : 'hover:shadow-xl'}
      `}
    >
      <div className="mb-8 text-center">
        <h2 className="font-display text-xl md:text-2xl font-bold text-text-dark leading-relaxed">
          {number}. {question}
        </h2>
      </div>
      <LikertScale value={value} onChange={onChange} disabled={disabled} />
    </div>
  )
})

export default QuestionCard
