import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import axios from 'axios'

const ResultsContext = createContext()

const API_BASE_URL = 'http://localhost:8000'

export function ResultsProvider({ children }) {
  // resultId별 결과 캐시
  const [resultsCache, setResultsCache] = useState({})
  const [loadingIds, setLoadingIds] = useState({})
  const [errors, setErrors] = useState({})

  // 결과 불러오기 함수 (캐시 확인 후 필요시 fetch)
  const fetchResult = useCallback(async (resultId) => {
    // 이미 캐시에 있으면 즉시 반환
    if (resultsCache[resultId]) {
      return resultsCache[resultId]
    }

    // 이미 로딩 중이면 대기
    if (loadingIds[resultId]) {
      return null
    }

    // 로딩 시작
    setLoadingIds(prev => ({ ...prev, [resultId]: true }))
    setErrors(prev => ({ ...prev, [resultId]: null }))

    try {
      const res = await axios.get(`${API_BASE_URL}/api/results/${resultId}`)
      const data = res.data
      
      // 캐시에 저장
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
  }, [resultsCache, loadingIds])

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

