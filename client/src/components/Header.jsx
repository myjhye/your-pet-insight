import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useProgress } from '../contexts/ProgressContext'

function Header({ fixed = false }) {
  const { lang, langInfo, changeLang, localePath, languages } = useLang()
  const { progress } = useProgress()
  const [isLangOpen, setIsLangOpen] = useState(false)
  const location = useLocation()
  
  // 결과 페이지인지 확인 (result가 경로에 포함되어 있으면)
  const isResultPage = location.pathname.includes('/result/')

  return (
    <div className="sticky top-0 z-50 w-full bg-primary">
      <header className="w-full px-8 py-6 flex justify-between items-center max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4">
          <Link to={localePath('/')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full border-2 border-secondary flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
              <span className="material-symbols-outlined text-secondary text-sm">pets</span>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">
              <span className="text-secondary font-light">Your</span> Pet Insight
            </span>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex space-x-6 text-sm font-medium text-secondary/80">
            <a className="hover:text-accent transition-colors" href="#">Methodology</a>
            <a className="hover:text-accent transition-colors" href="#">About Us</a>
            <a className="hover:text-accent transition-colors" href="#">Blog</a>
          </nav>
          
          {/* Language Selector - 결과 페이지에서는 숨김 */}
          {!isResultPage && (
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
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLangOpen(false)}
                  />
                  
                  {/* Dropdown */}
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
        <div className="md:hidden">
          <button className="text-white hover:text-accent focus:outline-none p-1">
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </header>
      
      {/* ✅ 프로그레스바 - 헤더 하단 전체 너비 */}
      {progress !== null && (
        <div className="h-1 bg-white/20">
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
