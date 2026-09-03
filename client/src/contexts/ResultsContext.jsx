import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'
import axios from 'axios'

const ResultsContext = createContext()

// 개발 환경에서는 Vite 프록시 사용 (상대 경로), 배포 환경에서는 절대 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export function ResultsProvider({ children }) {
  // resultId별 결과 캐시
  const [resultsCache, setResultsCache] = useState({})
  const [loadingIds, setLoadingIds] = useState({})
  const [errors, setErrors] = useState({})
  
  // 최신 캐시 상태를 참조하기 위한 ref
  const cacheRef = useRef({})
  const loadingRef = useRef({})
  
  // 캐시와 ref 동기화
  cacheRef.current = resultsCache
  loadingRef.current = loadingIds

  // 특정 resultId의 결과 가져오기 (메모리 또는 sessionStorage)
  const getResult = useCallback((resultId) => {
    if (!resultId) return null
    if (resultsCache[resultId]) {
      return resultsCache[resultId]
    }
    try {
      const stored = sessionStorage.getItem(`pet_result_${resultId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setResultsCache(prev => ({ ...prev, [resultId]: parsed }))
        return parsed
      }
    } catch (e) {
      console.warn('sessionStorage 읽기 실패:', e)
    }
    return null
  }, [resultsCache])

  // 결과 불러오기 함수 (캐시 확인 후 필요시 fetch)
  const fetchResult = useCallback(async (resultId, forceRefresh = false) => {
    if (!resultId) {
      return null
    }

    // 1. 메모리 캐시에 있는 경우
    if (cacheRef.current[resultId]) {
      setLoadingIds(prev => ({ ...prev, [resultId]: false }))
      if (!forceRefresh) return cacheRef.current[resultId]
    }

    // 2. sessionStorage 확인
    try {
      const stored = sessionStorage.getItem(`pet_result_${resultId}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setResultsCache(prev => ({ ...prev, [resultId]: parsed }))
        setLoadingIds(prev => ({ ...prev, [resultId]: false }))
        if (!forceRefresh) return parsed
      }
    } catch (e) {
      console.warn('sessionStorage 읽기 실패:', e)
    }

    // 이미 로딩 중이면 대기 (강제 갱신이 아닐 때만)
    if (!forceRefresh && loadingRef.current[resultId]) {
      return null
    }

    // 로딩 시작
    setLoadingIds(prev => ({ ...prev, [resultId]: true }))
    setErrors(prev => ({ ...prev, [resultId]: null }))

    try {
      const res = await axios.get(`${API_BASE_URL}/api/results/${resultId}`)
      const data = res.data
      
      // 캐시 및 sessionStorage에 저장
      setResultsCache(prev => ({ ...prev, [resultId]: data }))
      try {
        sessionStorage.setItem(`pet_result_${resultId}`, JSON.stringify(data))
      } catch (e) {}

      setLoadingIds(prev => ({ ...prev, [resultId]: false }))
      return data
    } catch (err) {
      console.warn(`결과 API 조회 실패 (${resultId}), 로컬 데이터 확인 시도`, err)
      
      // API 실패 시에도 sessionStorage 데이터가 있으면 복원해서 사용
      try {
        const stored = sessionStorage.getItem(`pet_result_${resultId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          setResultsCache(prev => ({ ...prev, [resultId]: parsed }))
          setLoadingIds(prev => ({ ...prev, [resultId]: false }))
          return parsed
        }
      } catch (e) {}

      const errorMessage = err.response?.data?.detail || err.message || '결과를 불러오는데 실패했습니다.'
      setErrors(prev => ({ ...prev, [resultId]: errorMessage }))
      setLoadingIds(prev => ({ ...prev, [resultId]: false }))
      return null
    }
  }, [])

  // 특정 resultId의 로딩 상태
  const isLoading = useCallback((resultId) => {
    return loadingIds[resultId] || false
  }, [loadingIds])

  // 특정 resultId의 에러 상태
  const getError = useCallback((resultId) => {
    return errors[resultId] || null
  }, [errors])

  // 결과 캐시에 직접 저장 (calculate 후 바로 저장용)
  const cacheResult = useCallback((resultId, data) => {
    if (!resultId || !data) return
    setResultsCache(prev => ({ ...prev, [resultId]: data }))
    try {
      sessionStorage.setItem(`pet_result_${resultId}`, JSON.stringify(data))
    } catch (e) {
      console.warn('sessionStorage 저장 실패:', e)
    }
  }, [])

  const value = useMemo(() => ({
    fetchResult,
    getResult,
    isLoading,
    getError,
    cacheResult,
  }), [fetchResult, getResult, isLoading, getError, cacheResult])

  return (
    <ResultsContext.Provider value={value}>
      {children}
    </ResultsContext.Provider>
  )
}

export function useResults() {
  const context = useContext(ResultsContext)
  if (!context) {
    throw new Error('useResults must be used within a ResultsProvider')
  }
  return context
}

