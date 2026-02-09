import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react'
import axios from 'axios'

const ResultsContext = createContext()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

  // 결과 불러오기 함수 (캐시 확인 후 필요시 fetch)
  const fetchResult = useCallback(async (resultId, forceRefresh = false) => {
    if (!resultId) {
      return null
    }

    // 이미 캐시에 있고 강제 갱신이 아니면 즉시 반환
    if (!forceRefresh && cacheRef.current[resultId]) {
      setLoadingIds(prev => {
        if (prev[resultId] === false) {
          return prev
        }
        return { ...prev, [resultId]: false }
      })
      return cacheRef.current[resultId]
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
      
      // 캐시에 저장 (갱신)
      setResultsCache(prev => ({ ...prev, [resultId]: data }))
      setLoadingIds(prev => ({ ...prev, [resultId]: false }))
      
      return data
    } catch (err) {
      console.error(`결과(${resultId})를 불러오는데 실패했습니다.`, err)
      const errorMessage = err.response?.data?.detail || err.message || '결과를 불러오는데 실패했습니다.'
      setErrors(prev => ({ ...prev, [resultId]: errorMessage }))
      setLoadingIds(prev => ({ ...prev, [resultId]: false }))
      return null
    }
  }, []) // 의존성 배열 비우기 - ref 사용으로 안정적

  // 특정 resultId의 결과 가져오기 (캐시된 데이터)
  const getResult = useCallback((resultId) => {
    return resultsCache[resultId] || null
  }, [resultsCache])

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
    setResultsCache(prev => ({ ...prev, [resultId]: data }))
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

