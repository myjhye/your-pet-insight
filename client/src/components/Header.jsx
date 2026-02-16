import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useProgress } from '../contexts/ProgressContext'

function Header({ fixed = false }) {
  const { lang, langInfo, changeLang, localePath, languages } = useLang()
  const { progress } = useProgress()
  
  // 언어 선택 드롭다운 상태 (데스크탑용)
  const [isLangOpen, setIsLangOpen] = useState(false)
  // 모바일 메뉴 열림/닫힘 상태 (새로 추가됨)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const location = useLocation()
  const isResultPage = location.pathname.includes('/result/')
  const isBlogPage = location.pathname.startsWith('/ko/blog')

  // 모바일 메뉴 토글 함수
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    setIsLangOpen(false) // 모바일 메뉴 열 때 데스크탑 언어 메뉴는 닫음
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-primary shadow-sm">
      <header className="w-full px-4 sm:px-6 md:px-8 py-3 md:py-5 flex justify-between items-center max-w-7xl mx-auto relative z-20">
        
        {/* 1. 로고 영역 */}
        <div className="flex items-center gap-3">
          <Link to={localePath('/')} className="flex items-center gap-2 group" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center p-1.5 shadow-sm border border-white/20">
              <img 
                src="/favicon.png" 
                alt="Your Pet Insight Logo" 
                className="w-full h-full object-contain opacity-90"
              />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl md:text-2xl tracking-tight text-white">
              <span className="text-secondary font-light">Your</span> Pet Insight
            </span>
          </Link>
        </div>

        {/* 2. 데스크탑 메뉴 (MD 이상에서만 보임) */}
        <div className="hidden md:flex items-center space-x-8">
          {!isResultPage && !isBlogPage && (
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-2 text-white hover:text-accent transition-colors text-sm font-medium"
              >
                <span className="material-symbols-outlined text-xl">language</span>
                <span>{langInfo.flag} {langInfo.label}</span>
                <span className={`material-symbols-outlined text-sm transition-transform ${isLangOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              
              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]">
                    {Object.values(languages).map((language) => (
                      <button
                        key={language.code}
                        onClick={() => {
                          changeLang(language.code)
                          setIsLangOpen(false)
                        }}
                        className={`
                          w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-2
                          transition-colors hover:bg-primary/10
                          ${lang === language.code ? 'bg-primary/5 text-primary' : 'text-gray-700'}
                        `}
                      >
                        <span>{language.flag}</span>
                        <span>{language.label}</span>
                        {lang === language.code && (
                          <span className="material-symbols-outlined text-primary text-sm ml-auto">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 3. 모바일 햄버거 버튼 (MD 미만에서만 보임) */}
        <div className="md:hidden">
          <button 
            onClick={toggleMobileMenu}
            className="text-white hover:text-accent focus:outline-none p-1 transition-colors"
          >
            {/* 메뉴가 열려있으면 'close(X)', 닫혀있으면 'menu' 아이콘 표시 */}
            <span className="material-symbols-outlined text-2xl">
              {isMobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>
      
      {/* 4. 모바일 드롭다운 메뉴 (햄버거 클릭 시 등장) */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-100 shadow-lg z-10 animate-fade-in-down">
          <div className="flex flex-col py-4 px-6 space-y-4">
            
            {/* 언어 선택 영역 (모바일용) */}
            {!isResultPage && !isBlogPage && (
              <div className="pt-2">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Select Language</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(languages).map((language) => (
                    <button
                      key={language.code}
                      onClick={() => {
                        changeLang(language.code)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`
                        flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all
                        ${lang === language.code 
                          ? 'bg-primary/5 border-primary text-primary' 
                          : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}
                      `}
                    >
                      <span>{language.flag}</span>
                      <span>{language.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. 프로그레스바 */}
      {progress !== null && (
        <div className="h-1 bg-white/20 absolute bottom-0 w-full z-30">
          <div 
            className="h-full bg-secondary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default Header