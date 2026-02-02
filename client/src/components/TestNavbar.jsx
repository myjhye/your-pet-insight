// UI 텍스트 다국어 정의
const UI_TEXT = {
  en: {
    progress: "Progress",
    answered: "Answered"
  },
  jp: {
    progress: "進捗",
    answered: "回答済み"
  }
}

function TestNavbar({ answered, total, lang = 'en' }) {
  const progress = total > 0 ? (answered / total) * 100 : 0
  const uiText = UI_TEXT[lang] || UI_TEXT.en

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary text-white">
      <div className="px-4 py-3">
        {/* 로고 & 메뉴 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg md:text-xl">pets</span>
            </div>
            <span className="font-display font-bold text-base md:text-lg">
              <span className="font-light">Your</span> Pet Insight
            </span>
          </div>
          <button className="p-2">
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>
        
        {/* 프로그레스 바 - 여백 추가 */}
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-xs font-medium whitespace-nowrap">{uiText.progress}</span>
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-secondary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-white/90 text-xs font-bold whitespace-nowrap min-w-[60px] text-right">
            {answered} / {total} {uiText.answered}
          </span>
        </div>
      </div>
    </nav>
  )
}

export default TestNavbar
