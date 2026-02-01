import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import axios from 'axios'

const QuestionsContext = createContext()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function QuestionsProvider({ children }) {
  // 버전+언어별 질문 캐시 (예: "dog_v1_en", "dog_v1_ko")
  const [questionsCache, setQuestionsCache] = useState({})
  const [loadingKeys, setLoadingKeys] = useState({})
  const [errors, setErrors] = useState({})

  // 캐시 키 생성 (version + lang 조합)
  const getCacheKey = (version, lang) => `${version}_${lang}`

  // 질문 불러오기 함수 (언어별 필터링된 데이터)
  const fetchQuestions = useCallback(async (version, lang) => {
    const cacheKey = getCacheKey(version, lang)
    
    // 이미 캐시에 있으면 즉시 반환
    if (questionsCache[cacheKey]) {
      return questionsCache[cacheKey]
    }

    // 이미 로딩 중이면 대기
    if (loadingKeys[cacheKey]) {
      return null
    }

    // 로딩 시작
    setLoadingKeys(prev => ({ ...prev, [cacheKey]: true }))
    setErrors(prev => ({ ...prev, [cacheKey]: null }))

    try {
      // 새 API: /api/questions/{version}/{lang}
      const res = await axios.get(`${API_BASE_URL}/api/questions/${version}/${lang}`)
      const data = res.data
      
      // 캐시에 저장
      setQuestionsCache(prev => ({ ...prev, [cacheKey]: data }))
      setLoadingKeys(prev => ({ ...prev, [cacheKey]: false }))
      
      return data
    } catch (err) {
      console.error(`질문(${version}/${lang})을 불러오는데 실패했습니다.`, err)
      setErrors(prev => ({ ...prev, [cacheKey]: err.message }))
      setLoadingKeys(prev => ({ ...prev, [cacheKey]: false }))
      return null
    }
  }, [questionsCache, loadingKeys])

  // 특정 버전+언어의 질문 가져오기 (캐시된 데이터)
  const getQuestions = useCallback((version, lang) => {
    const cacheKey = getCacheKey(version, lang)
    return questionsCache[cacheKey] || null
  }, [questionsCache])

  // 특정 버전+언어의 로딩 상태
  const isLoading = useCallback((version, lang) => {
    const cacheKey = getCacheKey(version, lang)
    return loadingKeys[cacheKey] || false
  }, [loadingKeys])

  // 특정 버전+언어의 에러 상태
  const getError = useCallback((version, lang) => {
    const cacheKey = getCacheKey(version, lang)
    return errors[cacheKey] || null
  }, [errors])

  // 프리페칭 함수 (페이지 진입 전에 미리 호출)
  const prefetchQuestions = useCallback((version, lang) => {
    const cacheKey = getCacheKey(version, lang)
    if (!questionsCache[cacheKey] && !loadingKeys[cacheKey]) {
      fetchQuestions(version, lang)
    }
  }, [questionsCache, loadingKeys, fetchQuestions])

  const value = useMemo(() => ({
    fetchQuestions,
    getQuestions,
    isLoading,
    getError,
    prefetchQuestions,
  }), [fetchQuestions, getQuestions, isLoading, getError, prefetchQuestions])

  return (
    <QuestionsContext.Provider value={value}>
      {children}
    </QuestionsContext.Provider>
  )
}

export function useQuestions() {
  const context = useContext(QuestionsContext)
  if (!context) {
    throw new Error('useQuestions must be used within a QuestionsProvider')
  }
  return context
}
