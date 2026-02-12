import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import html2canvas from 'html2canvas'
import { useRef, useState, useCallback, useEffect } from 'react'

function PremiumReportViewer({ petName, reportPages, activeTab, setActiveTab, uiText, onCopyLink, onNativeShare, isCopied, expireAt, lang }) {
  const pageOrder = [
    'table_of_contents',
    'deep_dive_traits',
    'cognitive_strengths',
    'owner_chemistry',
    'training_roadmap',
    'social_adaptation',
    'lifestyle_guide',
    'heartfelt_message'
  ]
  
  const pageTitles = uiText.premium.pageTitles
  
  const availablePages = pageOrder.filter(pageKey => reportPages[pageKey])
  const activePageData = reportPages[activeTab]
  const activePageTitle = pageTitles[activeTab] || activeTab.replace(/_/g, ' ')
  const currentPageIndex = availablePages.indexOf(activeTab) + 1
  const totalPages = availablePages.length

  // expire_at 포맷팅
  const formatExpiredDate = (dateValue) => {
    if (!dateValue) return null
    
    let date
    // Firestore Timestamp 객체인 경우
    if (dateValue?.toDate) {
      date = dateValue.toDate()
    } 
    // seconds 필드가 있는 경우 (Firestore REST API)
    else if (dateValue?._seconds) {
      date = new Date(dateValue._seconds * 1000)
    }
    // ISO string인 경우
    else if (typeof dateValue === 'string') {
      date = new Date(dateValue)
    }
    // 숫자(timestamp)인 경우
    else if (typeof dateValue === 'number') {
      date = new Date(dateValue * 1000)
    }
    else {
      return null
    }
    
    if (isNaN(date.getTime())) return null
    
    // 언어별 포맷
    if (lang === 'jp') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // 만료일 포맷 (DB 값만 사용)
  const formattedExpiry = expireAt ? formatExpiredDate(expireAt) : null

  // 각 페이지 콘텐츠를 참조하는 ref
  const pageContentRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)

  // 탭 변경 시 저장 상태 초기화
  useEffect(() => {
    setIsSaving(false)
  }, [activeTab])

  // 이미지 저장 핸들러
  const handleSaveImage = useCallback(async () => {
    if (!pageContentRef.current || isSaving) return

    setIsSaving(true)

    try {
      // 저장 버튼 자체를 캡처에서 제외하기 위해 일시적으로 숨김
      const saveButton = pageContentRef.current.querySelector('[data-save-button]')
      if (saveButton) saveButton.style.visibility = 'hidden'

      const element = pageContentRef.current

      const canvas = await html2canvas(element, {
        scale: 2,                    // 고해상도 (Retina 대응)
        useCORS: true,               // 외부 이미지 허용
        backgroundColor: '#FFFFFF',   // 리포트 배경색과 동일
        logging: false,
        // 전체 콘텐츠를 캡처하기 위한 설정
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        // 모바일에서 position: fixed 요소 무시
        ignoreElements: (el) => {
          return el.tagName === 'HEADER' || el.tagName === 'NAV' || el.classList?.contains('fixed')
        }
      })

      // 저장 버튼 복원
      if (saveButton) saveButton.style.visibility = 'visible'

      // 파일명 생성
      const lang = uiText?.tabs?.basic === '基本結果' ? 'jp' : 'en'
      const pageTitle = activeTab.replace(/_/g, '-')
      const fileName = `${petName}-${pageTitle}.png`

      // 플랫폼별 저장 방식
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      const dataUrl = canvas.toDataURL('image/png')

      if (isIOS) {
        // iOS Safari: 새 탭에서 이미지 열기 → 길게 눌러 저장 유도
        const newTab = window.open()
        if (newTab) {
          const tipText = lang === 'jp' 
            ? '💡 画像を長押し → 写真に保存' 
            : '💡 Long press the image → Save to Photos'
          newTab.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>${fileName}</title>
              <style>
                body { margin: 0; background: #f5f5f5; }
                img { max-width: 100%; height: auto; display: block; }
                .tip { text-align: center; padding: 14px 16px; font-family: -apple-system, sans-serif;
                       font-size: 14px; color: #555; background: #fff; border-bottom: 1px solid #eee;
                       position: sticky; top: 0; z-index: 10; }
              </style>
            </head>
            <body>
              <div class="tip">${tipText}</div>
              <img src="${dataUrl}" alt="${fileName}" />
            </body>
            </html>
          `)
          newTab.document.close()
        } else {
          // 팝업 차단된 경우 fallback
          window.location.href = dataUrl
        }
      } else if (navigator.share && /Android/i.test(navigator.userAgent)) {
        // Android: Web Share API로 직접 공유/저장 (지원 시)
        try {
          const blob = await (await fetch(dataUrl)).blob()
          const file = new File([blob], fileName, { type: 'image/png' })
          await navigator.share({ files: [file] })
        } catch {
          // share 실패 시 일반 다운로드 fallback
          const link = document.createElement('a')
          link.download = fileName
          link.href = dataUrl
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
      } else {
        // Desktop / 기타: 직접 다운로드
        const link = document.createElement('a')
        link.download = fileName
        link.href = dataUrl
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('이미지 저장 실패:', error)
      const saveButton = pageContentRef.current?.querySelector('[data-save-button]')
      if (saveButton) saveButton.style.visibility = 'visible'
    } finally {
      setIsSaving(false)
    }
  }, [activeTab, petName, isSaving, uiText])

  // 저장 버튼 컴포넌트
  const SaveButton = () => {
    const lang = uiText?.tabs?.basic === '基本結果' ? 'jp' : 'en'
    return (
      <button
        data-save-button
        onClick={handleSaveImage}
        disabled={isSaving}
        className={`
          inline-flex items-center gap-1.5
          px-3 py-1.5
          rounded-lg
          text-xs font-medium
          transition-all duration-200
          ${isSaving 
            ? 'bg-primary/10 text-primary/40 cursor-wait' 
            : 'bg-white text-primary/60 hover:text-primary hover:bg-primary/5 border border-primary/15 hover:border-primary/30 shadow-sm hover:shadow'
          }
        `}
        title={isSaving 
          ? (lang === 'jp' ? '保存中...' : 'Saving...') 
          : (lang === 'jp' ? '画像を保存' : 'Save as Image')
        }
      >
        {isSaving ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-transparent rounded-full animate-spin" />
            <span>{lang === 'jp' ? '保存中...' : 'Saving...'}</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">download</span>
            <span>{lang === 'jp' ? '画像保存' : 'Save'}</span>
          </>
        )}
      </button>
    )
  }

  // 탭 클릭 핸들러
  const handleTabClick = (pageKey, event) => {
    // 1. 탭 상태 변경
    setActiveTab(pageKey)
    
    // 2. 탭 버튼 가로 스크롤 정렬 (메뉴바 내에서 중앙으로)
    if (event?.target) {
      event.target.scrollIntoView({ 
        behavior: 'auto', 
        block: 'nearest', 
        inline: 'center' 
      })
    }

    // 3. 화면 스크롤을 '리포트 시작 위치'에 맞춰 조정
    // setTimeout을 0으로 주어 렌더링 사이클에 맞춰 안전하게 실행
    setTimeout(() => {
      const element = document.getElementById('premium-viewer-top')
      if (element) {
        // 글로벌 헤더 높이(약 60~80px) + 여유 공간
        const headerOffset = 100
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.scrollY - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'auto'
        })
      }
    }, 0)
  }

  return (
    <div id="premium-viewer-top" className="w-full bg-white border-x border-b border-primary/5 md:border-x-0">
      {/* [상단 헤더 + 네비게이션 통합 영역] 
        - 모바일: 상단 탭 바로 아래에 딱 붙음 (마진 없음)
        - 디자인: 흰색 배경에 하단 경계선으로만 구분 (Clean & Flat)
        - border-t-0: 상단 컨테이너와 경계선 없이 합체
      */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 border-t-0">
        {/* 1. 리포트 정보 (타이틀 + 공유 버튼) */}
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          {/* Left: 타이틀 */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-lg">verified</span>
              <span className="text-xs font-bold text-primary/60 uppercase tracking-wider">Premium Report</span>
            </div>
            <h2 className="text-lg font-bold text-primary leading-tight">
               {petName} <span className="font-normal text-primary/80">| {uiText.premium.title}</span>
            </h2>
          </div>

          {/* Right: 공유 버튼 그룹 */}
          <div className="flex gap-2">
            <button 
              onClick={onCopyLink}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                isCopied 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'bg-white border-gray-200 text-primary hover:bg-gray-50'
              }`}
              title={isCopied ? 'Copied!' : 'Copy Link'}
            >
              <span className="material-symbols-outlined text-lg">
                {isCopied ? 'check' : 'link'}
              </span>
            </button>
            
            {typeof navigator !== 'undefined' && navigator.share && (
              <button 
                onClick={onNativeShare}
                className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary hover:bg-gray-50 transition-all"
                title="Share"
              >
                <span className="material-symbols-outlined text-lg">share</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. 챕터 네비게이션 (가로 스크롤) */}
        <nav className="w-full">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {availablePages.map((pageKey) => {
              const isActive = activeTab === pageKey
              return (
                <button
                  key={pageKey}
                  onClick={(e) => handleTabClick(pageKey, e)}
                  className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap flex-shrink-0 border ${
                    isActive
                      ? 'bg-[#2D5A47] text-white border-[#2D5A47] shadow-sm'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageTitles[pageKey] || pageKey.replace(/_/g, ' ')}
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* ★ 만료일 + 이메일 안내 배너 */}
      {formattedExpiry && (
        <div className="mx-4 md:mx-6 mt-4 mb-2 md:mt-6 md:mb-3 px-4 py-3 md:px-5 md:py-4 
          bg-[#F4F1EB] rounded-xl border border-[#E8E2D6]">
          
          {/* 이메일 안내 */}
          <div className="flex items-start gap-2.5 mb-2">
            <span className="material-symbols-outlined text-primary/50 text-lg mt-0.5 shrink-0">
              mail
            </span>
            <p className="text-sm text-primary/70 leading-relaxed">
              {lang === 'jp'
                ? 'このレポートのコピーは、チェックアウト時に入力したメールアドレスに送信されました。'
                : 'A copy of this report has been sent to the email you entered during checkout.'}
            </p>
          </div>
          
          {/* 만료일 안내 */}
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary/50 text-lg mt-0.5 shrink-0">
              schedule
            </span>
            <p className="text-sm text-primary/70 leading-relaxed">
              {lang === 'jp'
                ? <>このレポートは <span className="font-semibold text-primary">{formattedExpiry}</span> までウェブサイトで閲覧できます。</>
                : <>This report will be available on our website until <span className="font-semibold text-primary">{formattedExpiry}</span>.</>}
            </p>
          </div>
        </div>
      )}

      {/* [본문 영역]
        - 불필요한 패딩 제거, 텍스트 가독성 중심
        - border-x, border-b: 상단 컨테이너와 연결된 느낌
        - 모바일: rounded-b-none, 데스크탑: rounded-b-[2rem]
      */}
      <main className="min-h-[500px] bg-white pb-20 border-x border-b border-primary/5 md:border-x-0 md:rounded-b-[2rem] shadow-sm">
        {activePageData && (
          <div
            key={activeTab}
            ref={pageContentRef}
            className="px-5 py-8 md:px-12 md:py-12 max-w-4xl mx-auto relative"
          >
              {/* 저장 버튼 - 우측 상단 고정 */}
              <div className="flex justify-end mb-3 sticky top-0 z-10">
                <SaveButton />
              </div>

              {/* 챕터 제목 */}
              <div className="mb-8">
                <h3 className="text-2xl font-display font-bold text-primary mb-2">
                  {activePageTitle}
                </h3>
                <div className="h-1 w-12 bg-[#E5E7EB] rounded-full"></div>
              </div>

              {/* 마크다운 콘텐츠 */}
              <div className="report-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold text-primary mt-8 mb-4 flex items-center gap-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold text-primary/90 mt-8 mb-3 pl-3 border-l-4 border-secondary">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-bold text-primary/80 mt-6 mb-2">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-700 leading-7 mb-5 text-[16px] font-normal">
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-[#2D5A47]">{children}</strong>
                    ),
                    ul: ({ children }) => (
                      <ul className="my-5 space-y-3 pl-1">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-700 leading-7 text-[16px] flex items-start gap-2">
                        <span className="mt-2 w-1.5 h-1.5 bg-secondary rounded-full flex-shrink-0"></span>
                        <span>{children}</span>
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="bg-gray-50 border border-gray-100 p-5 my-6 rounded-xl text-gray-600 italic">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {activePageData.content}
                </ReactMarkdown>
              </div>

              {/* 이미지 저장 시 포함되는 브랜딩 (화면에서도 보임) */}
              <div className="mt-8 pt-4 border-t border-primary/10 flex items-center justify-between text-xs text-primary/30">
                <span>🐾 yourpetinsight.com</span>
                <span>{petName}'s Premium Report</span>
              </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default PremiumReportViewer
