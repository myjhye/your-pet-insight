import { createContext, useContext, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

const LanguageContext = createContext()

export const LANGUAGES = {
  en: { code: 'en', label: 'English', flag: '🇺🇸' },
  jp: { code: 'jp', label: '日本語', flag: '🇯🇵' },
}

// 지원하는 언어 목록 (여기서 관리)
export const SUPPORTED_LANGUAGES = ['en', 'jp']
export const DEFAULT_LANG = 'en'

export function LanguageProvider({ children }) {
  const { lang } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // 지원하지 않는 언어 체크 & 리다이렉트
  useEffect(() => {
    if (lang && !SUPPORTED_LANGUAGES.includes(lang)) {
      // 현재 경로에서 잘못된 언어를 기본 언어로 교체
      const newPath = location.pathname.replace(`/${lang}/`, `/${DEFAULT_LANG}/`)
      // 기본 언어로 리다이렉트 (replace로 히스토리 대체)
      navigate(newPath, { replace: true })
    }
  }, [lang, location.pathname, navigate])
  
  // URL에서 언어 코드 가져오기 (없으면 기본값 en)
  const currentLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANG
  
  // body 태그에 언어 속성 추가 (일본어 폰트 최적화용)
  useEffect(() => {
    document.body.setAttribute('data-lang', currentLang)
    document.documentElement.setAttribute('lang', currentLang)
    return () => {
      document.body.removeAttribute('data-lang')
      document.documentElement.removeAttribute('lang')
    }
  }, [currentLang])

  // 언어 변경 함수
  const changeLang = (newLang) => {
    // 지원하지 않는 언어는 무시
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return
    
    const pathParts = location.pathname.split('/')
    // 첫 번째 부분이 언어 코드인지 확인
    if (SUPPORTED_LANGUAGES.includes(pathParts[1])) {
      pathParts[1] = newLang
    } else {
      pathParts.splice(1, 0, newLang)
    }
    navigate(pathParts.join('/') + location.search)
  }

  // 현재 언어에 맞는 경로 생성 헬퍼
  const localePath = (path) => {
    if (path.startsWith('/')) {
      return `/${currentLang}${path}`
    }
    return `/${currentLang}/${path}`
  }

  return (
    <LanguageContext.Provider value={{ 
      lang: currentLang, 
      langInfo: LANGUAGES[currentLang],
      changeLang, 
      localePath,
      languages: LANGUAGES,
      SUPPORTED_LANGUAGES,
      DEFAULT_LANG
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLang must be used within a LanguageProvider')
  }
  return context
}

