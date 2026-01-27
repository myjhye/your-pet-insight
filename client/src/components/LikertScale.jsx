const scaleOptions = [
  { value: 3, size: 'w-12 h-12 md:w-16 md:h-16', border: 'border-[4px]', type: 'agree' },
  { value: 2, size: 'w-10 h-10 md:w-12 md:h-12', border: 'border-[3px]', type: 'agree' },
  { value: 1, size: 'w-8 h-8 md:w-9 md:h-9', border: 'border-[3px]', type: 'agree' },
  { value: 0, size: 'w-6 h-6 md:w-7 md:h-7', border: 'border-2', type: 'neutral' },
  { value: -1, size: 'w-8 h-8 md:w-9 md:h-9', border: 'border-[3px]', type: 'disagree' },
  { value: -2, size: 'w-10 h-10 md:w-12 md:h-12', border: 'border-[3px]', type: 'disagree' },
  { value: -3, size: 'w-12 h-12 md:w-16 md:h-16', border: 'border-[4px]', type: 'disagree' },
]

function LikertScale({ value, onChange, disabled = false }) {
  const getBorderColor = (type) => {
    if (type === 'agree') return 'border-emerald-400'
    if (type === 'disagree') return 'border-orange-400'
    return 'border-gray-400'
  }

  const getSelectedStyles = (option) => {
    if (value !== option.value) return ''
    
    if (option.type === 'agree') {
      return 'bg-emerald-500 ring-4 ring-emerald-400/40 scale-110 shadow-lg'
    }
    if (option.type === 'disagree') {
      return 'bg-orange-500 ring-4 ring-orange-400/40 scale-110 shadow-lg'
    }
    return 'bg-gray-600 ring-4 ring-gray-500/40 scale-125 shadow-lg'
  }

  const getHoverStyles = (type) => {
    if (disabled) return ''
    if (type === 'agree') return 'hover:bg-emerald-400/20'
    if (type === 'disagree') return 'hover:bg-orange-400/20'
    return 'hover:bg-gray-300'
  }

  const isSelected = (optionValue) => value === optionValue

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center justify-between w-full max-w-lg px-2 sm:px-4">
        {scaleOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`
              rounded-full transition-all duration-200 flex items-center justify-center
              ${option.size} ${option.border} ${getBorderColor(option.type)}
              ${getSelectedStyles(option)}
              ${!isSelected(option.value) ? getHoverStyles(option.type) : ''}
              ${!isSelected(option.value) ? 'bg-transparent' : ''}
              ${!disabled ? 'hover:scale-110' : ''}
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {isSelected(option.value) && (
              <span className="material-symbols-outlined text-xl md:text-2xl font-bold text-white">
                check
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="flex justify-between w-full max-w-lg px-2 text-xs md:text-sm font-bold uppercase tracking-wider">
        <span className="text-emerald-400">Agree</span>
        <span className="text-orange-400">Disagree</span>
      </div>
    </div>
  )
}

export default LikertScale
