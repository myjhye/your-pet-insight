import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'

const QuestionsContext = createContext()

const API_BASE_URL = 'http://localhost:8000'

export function QuestionsProvider({ children }) {
  // 버전별 질문 캐시
  const [questionsCache, setQuestionsCache] = useState({})
  const [loadingVersions, setLoadingVersions] = useState({})
  const [errors, setErrors] = useState({})

  // 질문 불러오기 함수 (캐시 확인 후 필요시 fetch)
  const fetchQuestions = useCallback(async (version) => {
    // 이미 캐시에 있으면 즉시 반환
    if (questionsCache[version]) {
      return questionsCache[version]
    }

    // 이미 로딩 중이면 대기
    if (loadingVersions[version]) {
      return null
    }

    // 로딩 시작
    setLoadingVersions(prev => ({ ...prev, [version]: true }))
    setErrors(prev => ({ ...prev, [version]: null }))

    try {
      const res = await axios.get(`${API_BASE_URL}/api/questions/${version}`)
      const data = res.data
      
      // 캐시에 저장
      setQuestionsCache(prev => ({ ...prev, [version]: data }))
      setLoadingVersions(prev => ({ ...prev, [version]: false }))
      
      return data
    } catch (err) {
      console.error(`질문(${version})을 불러오는데 실패했습니다.`, err)
      setErrors(prev => ({ ...prev, [version]: err.message }))
      setLoadingVersions(prev => ({ ...prev, [version]: false }))
      return null
    }
  }, [questionsCache, loadingVersions])

  // 특정 버전의 질문 가져오기 (캐시된 데이터)
  const getQuestions = useCallback((version) => {
    return questionsCache[version] || null
  }, [questionsCache])

  // 특정 버전의 로딩 상태
  const isLoading = useCallback((version) => {
    return loadingVersions[version] || false
  }, [loadingVersions])

  // 특정 버전의 에러 상태
  const getError = useCallback((version) => {
    return errors[version] || null
  }, [errors])

  // 프리페칭 함수 (페이지 진입 전에 미리 호출)
  const prefetchQuestions = useCallback((version) => {
    if (!questionsCache[version] && !loadingVersions[version]) {
      fetchQuestions(version)
    }
  }, [questionsCache, loadingVersions, fetchQuestions])

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

