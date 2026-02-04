import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function PremiumReportViewer({ petName, reportPages, activeTab, setActiveTab, uiText }) {
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

  // 스마트 네비게이션: 탭 클릭 시 해당 버튼이 중앙으로 스크롤
  const handleTabClick = (pageKey, event) => {
    setActiveTab(pageKey)
    // 탭 버튼이 스크롤 영역의 중앙에 오도록 스크롤
    if (event?.target) {
      event.target.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
      })
    }
  }

  return (
    <div className="mt-2 md:mt-12 w-full">
      {/* 통합 컨테이너 - 모바일: Flat 디자인, 데스크탑: 양장본 스타일 */}
      <div className="bg-white md:rounded-[2.5rem] md:shadow-[0_20px_50px_rgba(0,0,0,0.05)] md:overflow-hidden md:border border-primary/5">
        {/* 1. 헤더 영역 (타이틀) - 모바일: 패딩 축소, 데스크탑: 기존 유지 */}
        <header className="bg-primary/5 pt-6 pb-2 px-4 md:p-12 text-center md:border-b border-primary/10">
          <span className="material-symbols-outlined text-primary text-3xl md:text-5xl mb-2 block">workspace_premium</span>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-primary mb-1">
            {uiText.premium.title}
          </h2>
          <p className="text-primary/60 text-sm md:text-lg">{uiText.premium.subtitle.replace('{name}', petName)}</p>
        </header>

        {/* 2. 네비게이션 (탭 메뉴) - Sticky Header with Solid Background */}
        <nav className="border-b border-primary/10 bg-white sticky top-0 z-50">
          <div className="flex gap-2 p-3 md:p-4 overflow-x-auto scrollbar-hide">
            {availablePages.map((pageKey) => {
              const isActive = activeTab === pageKey
              return (
                <button
                  key={pageKey}
                  onClick={(e) => handleTabClick(pageKey, e)}
                  className={`px-3 py-2 rounded-xl font-medium text-xs md:text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-50 text-primary hover:bg-primary/10'
                  }`}
                >
                  {pageTitles[pageKey] || pageKey.replace(/_/g, ' ')}
                </button>
              )
            })}
          </div>
        </nav>

        {/* 3. 본문 영역 - 모바일: Reader Mode (최소 패딩), 데스크탑: 기존 스타일 */}
        <main className="p-4 md:p-16 min-h-[600px] bg-white">
          <AnimatePresence mode="wait">
            {activePageData && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* 페이지 헤더 - 모바일: 간소화 */}
                <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 md:pb-6 border-b border-primary/10">
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">auto_stories</span>
                    <div>
                      <h3 className="text-xl md:text-2xl font-display font-bold text-primary">
                        {activePageTitle}
                      </h3>
                      <p className="text-xs md:text-sm text-primary/60 mt-1">Page {currentPageIndex} / {totalPages}</p>
                    </div>
                  </div>
                </div>
                
                {/* ReactMarkdown으로 마크다운 렌더링 - 모바일 Reader Mode 최적화 */}
                <div className="report-content px-2 md:px-0">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl md:text-4xl font-display font-black text-primary mb-4 md:mb-8 pb-2 md:pb-4 border-b-4 border-primary/10">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl md:text-2xl font-display font-bold text-primary/90 mt-6 md:mt-10 mb-3 md:mb-6 flex items-center">
                          <span className="w-1.5 h-6 bg-secondary rounded-full mr-3"></span>
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg md:text-xl font-display font-semibold text-primary/80 mt-5 md:mt-8 mb-2 md:mb-4">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-[#2D3436] leading-relaxed mb-4 md:mb-6 text-[17px] md:text-base">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-bold text-primary">{children}</strong>
                      ),
                      ul: ({ children }) => (
                        <ul className="my-4 md:my-6 ml-5 md:ml-6 space-y-2 md:space-y-3 list-disc list-outside marker:text-secondary">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-[#2D3436] leading-relaxed pl-2 text-[17px] md:text-base">
                          {children}
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-secondary bg-secondary/5 p-4 md:p-6 my-6 md:my-8 rounded-r-xl italic text-base md:text-lg text-[#2D3436]">
                          {children}
                        </blockquote>
                      ),
                      hr: () => <hr className="my-8 md:my-10 border-t-2 border-primary/10" />,
                    }}
                  >
                    {activePageData.content}
                  </ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default PremiumReportViewer

