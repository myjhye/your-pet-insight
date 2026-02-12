import { useRef, useState, useCallback } from 'react'

export function useSaveAsImage() {
  const cardRef = useRef(null)      // SNS 카드용 ref
  const fullPageRef = useRef(null)  // 전체 결과용 ref
  const [isSaving, setIsSaving] = useState(false)
  const [saveMode, setSaveMode] = useState(null)  // 'card' | 'full' | null

  /**
   * 이미지 캡처 공통 로직
   * @param {HTMLElement} element - 캡처할 DOM 요소
   * @param {string} fileName - 저장할 파일 이름
   * @param {object} options - html2canvas 추가 옵션
   */
  const captureElement = useCallback(async (element, fileName, options = {}) => {
    if (!element) return { error: 'Element not found' }

    try {
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,  // 요소 자체 배경 사용
        logging: false,
        ...options,
      })

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png', 1.0)
      )

      if (!blob) throw new Error('Failed to create image blob')

      // 모바일 + Web Share API → 네이티브 공유
      if (isMobile && navigator.share && navigator.canShare) {
        const file = new File([blob], `${fileName}.png`, { type: 'image/png' })
        const shareData = { files: [file] }

        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData)
            return { shared: true }
          } catch (e) {
            if (e.name === 'AbortError') return { cancelled: true }
          }
        }
      }

      // 데스크탑 또는 Share 미지원 → 파일 다운로드
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${fileName}.png`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { downloaded: true }
    } catch (error) {
      console.error('Image capture failed:', error)
      return { error: error.message }
    }
  }, [])

  // ★ SNS 카드 저장 (히든 카드 캡처)
  const saveAsCard = useCallback(async (fileName = 'pet-result') => {
    if (!cardRef.current || isSaving) return
    setIsSaving(true)
    setSaveMode('card')

    const result = await captureElement(cardRef.current, fileName, {
      // 카드는 고정 너비, 높이는 자동
      width: 1080,
      windowWidth: 1080,
    })

    setIsSaving(false)
    setSaveMode(null)
    return result
  }, [isSaving, captureElement])

  // ★ 전체 결과 저장 (실제 화면 영역 캡처)
  const saveAsFullPage = useCallback(async (fileName = 'pet-full-result') => {
    if (!fullPageRef.current || isSaving) return
    setIsSaving(true)
    setSaveMode('full')

    const result = await captureElement(fullPageRef.current, fileName, {
      // 실제 렌더링된 크기 그대로 캡처
      windowWidth: fullPageRef.current.scrollWidth,
    })

    setIsSaving(false)
    setSaveMode(null)
    return result
  }, [isSaving, captureElement])

  return { cardRef, fullPageRef, isSaving, saveMode, saveAsCard, saveAsFullPage }
}
