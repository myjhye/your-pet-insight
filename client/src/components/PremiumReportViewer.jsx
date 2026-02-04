import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function PremiumReportViewer({ petName, reportPages, activeTab, setActiveTab, uiText, onCopyLink, onNativeShare, isCopied }) {
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

      {/* [본문 영역]
        - 불필요한 패딩 제거, 텍스트 가독성 중심
        - border-x, border-b: 상단 컨테이너와 연결된 느낌
        - 모바일: rounded-b-none, 데스크탑: rounded-b-[2rem]
      */}
      <main className="min-h-[500px] bg-white pb-20 border-x border-b border-primary/5 md:border-x-0 md:rounded-b-[2rem] shadow-sm">
        {activePageData && (
          <div
            key={activeTab}
            className="px-5 py-8 md:px-12 md:py-12 max-w-4xl mx-auto"
          >
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
          </div>
        )}
      </main>
    </div>
  )
}

export default PremiumReportViewer
