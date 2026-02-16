import { createContext, useContext, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'

const LanguageContext = createContext()

// 언어 상수 정의 (Fast Refresh 호환을 위해 컴포넌트 외부에 정의)
const LANGUAGES = {
  en: { code: 'en', label: 'English', flag: '🇺🇸' },
  jp: { code: 'jp', label: '日本語', flag: '🇯🇵' },
}

// 지원하는 언어 목록 (여기서 관리)
const SUPPORTED_LANGUAGES = ['en', 'jp']
const DEFAULT_LANG = 'en'

// Fast Refresh 호환을 위해 named export로 제공
export { LANGUAGES, SUPPORTED_LANGUAGES, DEFAULT_LANG }

export function LanguageProvider({ children }) {
  const { lang } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // URL 경로에서 언어 코드 추출
  // /jp, /en 같은 경우 lang 파라미터에서 가져오고
  // /result/:resultId, /terms 같은 경우 경로 첫 번째 세그먼트 확인
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const pathLang = pathSegments[0]
  
  // 지원하는 언어인지 확인
  const detectedLang = SUPPORTED_LANGUAGES.includes(pathLang) ? pathLang : null
  
  // 지원하지 않는 언어 체크 & 리다이렉트
  useEffect(() => {
    if (detectedLang && !SUPPORTED_LANGUAGES.includes(detectedLang)) {
      // 잘못된 언어 코드면 기본 언어로 리다이렉트
      const newPath = location.pathname.replace(`/${detectedLang}`, '')
      navigate(newPath || '/', { replace: true })
    }
  }, [detectedLang, location.pathname, navigate])
  
  // URL에서 언어 코드 가져오기 (없으면 기본값 en)
  // lang 파라미터가 있으면 우선 사용, 없으면 경로에서 추출, 둘 다 없으면 기본값
  const currentLang = SUPPORTED_LANGUAGES.includes(lang) 
    ? lang 
    : (detectedLang || DEFAULT_LANG)
  
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
    
    const pathParts = location.pathname.split('/').filter(Boolean)
    
    // 현재 경로가 언어 코드로 시작하는지 확인
    if (SUPPORTED_LANGUAGES.includes(pathParts[0])) {
      // 언어 코드 교체
      pathParts[0] = newLang
    } else {
      // 언어 코드 추가
      pathParts.unshift(newLang)
    }
    
    navigate('/' + pathParts.join('/') + location.search)
  }

  // 현재 언어에 맞는 경로 생성 헬퍼
  // 결과 페이지나 다른 페이지는 언어 접두사 없이, 테스트 페이지는 언어 접두사 추가
  const localePath = (path) => {
    // 이미 언어 접두사가 있는 경로는 그대로 반환
    const pathSegments = path.split('/').filter(Boolean)
    if (SUPPORTED_LANGUAGES.includes(pathSegments[0])) {
      return path
    }
    
    // 결과 페이지나 다른 페이지는 언어 접두사 없이
    if (path.startsWith('/result/') || 
        path.startsWith('/terms') || 
        path.startsWith('/privacy') || 
        path.startsWith('/refund')) {
      return path
    }
    
    // 루트 경로는 언어별로 처리
    if (path === '/') {
      // 기본 언어면 루트, 아니면 언어 접두사 추가
      return currentLang === DEFAULT_LANG ? '/' : `/${currentLang}`
    }
    
    // 테스트 페이지는 언어 접두사 추가
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

