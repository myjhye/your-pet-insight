import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useResults } from '../contexts/ResultsContext'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'

// Stats 고정 순서 및 설정
const STATS_ORDER = [
  { key: 'sociability', color: 'bg-red-500' },
  { key: 'sagacity', color: 'bg-violet-500' },
  { key: 'emotionality', color: 'bg-pink-500' },
  { key: 'obedience', color: 'bg-cyan-500' },
  { key: 'temperament', color: 'bg-yellow-400' },
]

// UI 텍스트 다국어 정의
const UI_TEXT = {
  en: {
    loading: {
      title: 'Analyzing Results...',
      subtitle: "Creating your pet's personality profile"
    },
    error: {
      title: "Oops! Something went wrong",
      tryAgain: "Try Again",
      noData: "Result data not found."
    },
    tabs: {
      basic: "Basic Results",
      premium: "Premium Report"
    },
    petName: {
      subtitle: "Your Beloved Companion"
    },
    sections: {
      coreTraits: "Core Traits",
      dailyLife: "Daily Life with You"
    },
    premium: {
      title: "Premium Deep Report",
      subtitle: "AI's complete personality profile of {name}",
      pageTitles: {
        table_of_contents: "Table of Contents",
        deep_dive_traits: "Personality Analysis",
        cognitive_strengths: "Cognitive Strengths",
        owner_chemistry: "Chemistry Analysis",
        training_roadmap: "Training Guide",
        social_adaptation: "Social Adaptation",
        lifestyle_guide: "Lifestyle Guide",
        heartfelt_message: "Special Message"
      },
      cta: {
        title: "Go Beyond the Surface",
        description: "Unlock the 25-page Premium Report to discover detailed training roadmaps, breed-specific insights, and scientific cognitive benchmarks.",
        getReport: "Get Premium Full Report",
        generating: "Generating your premium report...",
        generatingSub: "This may take up to 30 seconds",
        viewReport: "View Premium Report",
        ready: "Report ready! Click to view",
        failed: "Report generation failed. Please try again.",
        retry: "Retry",
        devTest: "Premium Report Generation Test (Dev Only)",
        join: "Join 50,000+ happy pet parents worldwide."
      }
    },
    share: {
      title: "Share your result",
      copyLink: "Copy Link"
    }
  },
  jp: {
    loading: {
      title: '結果を分析中...',
      subtitle: "ペットの性格プロファイルを作成しています"
    },
    error: {
      title: "エラーが発生しました",
      tryAgain: "再試行",
      noData: "結果データが見つかりません。"
    },
    tabs: {
      basic: "基本結果",
      premium: "プレミアムレポート"
    },
    petName: {
      subtitle: "あなたの愛するパートナー"
    },
    sections: {
      coreTraits: "コア特性",
      dailyLife: "あなたとの日常生活"
    },
    premium: {
      title: "プレミアム詳細レポート",
      subtitle: "AIが分析した{name}の完全な性格プロファイル",
      pageTitles: {
        table_of_contents: "目次",
        deep_dive_traits: "性格分析",
        cognitive_strengths: "認知的強み",
        owner_chemistry: "相性分析",
        training_roadmap: "トレーニングガイド",
        social_adaptation: "社会適応",
        lifestyle_guide: "ライフスタイルガイド",
        heartfelt_message: "特別なメッセージ"
      },
      cta: {
        title: "表面を超えて",
        description: "25ページのプレミアムレポートを解除して、詳細なトレーニングロードマップ、品種固有の洞察、科学的認知ベンチマークを発見してください。",
        getReport: "プレミアム完全レポートを取得",
        generating: "プレミアムレポートを生成中...",
        generatingSub: "最大30秒かかる場合があります",
        viewReport: "プレミアムレポートを表示",
        ready: "レポート準備完了！クリックして表示",
        failed: "レポート生成に失敗しました。もう一度お試しください。",
        retry: "再試行",
        devTest: "プレミアムレポート生成テスト（開発者専用）",
        join: "世界中の50,000人以上の幸せなペットの親に参加してください。"
      }
    },
    share: {
      title: "結果を共有",
      copyLink: "リンクをコピー"
    }
  }
}

// 로딩 컴포넌트
function LoadingScreen({ lang = 'en' }) {
  const text = UI_TEXT[lang] || UI_TEXT.en
  return (
    <main className="min-h-screen bg-[#F9FBF9] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-primary font-display text-xl font-bold">{text.loading.title}</p>
        <p className="text-primary/60 mt-2">{text.loading.subtitle}</p>
      </div>
    </main>
  )
}

// 에러 컴포넌트
function ErrorScreen({ message, onRetry, lang = 'en' }) {
  const text = UI_TEXT[lang] || UI_TEXT.en
  return (
    <main className="min-h-screen bg-[#F9FBF9] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <span className="material-symbols-outlined text-7xl text-red-400 mb-6">error</span>
        <h2 className="text-2xl font-display font-bold text-primary mb-4">{text.error.title}</h2>
        <p className="text-primary/60 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          {text.error.tryAgain}
        </button>
      </div>
    </main>
  )
}

// Stats 막대 그래프 컴포넌트
function StatBar({ name, label, value, color }) {
  // 성향 강도 계산: 항상 50~100% 사이로 표시 (주도 성향의 강도)
  // 예: 43% → 57% (반대 성향이 57% 강함), 65% → 65% (해당 성향이 65% 강함)
  const strengthPercent = value >= 50 ? value : (100 - value)
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-primary/60 uppercase tracking-wider">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">{label}</span>
          <span className={`text-sm font-bold ${color.replace('bg-', 'text-')}`}>{strengthPercent}%</span>
        </div>
      </div>
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000`}
          style={{ width: `${strengthPercent}%` }}
        ></div>
      </div>
    </div>
  )
}

// Trait 카드 컴포넌트
function TraitCard({ icon, title, description, variant = 'default' }) {
  const baseClasses = "p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
  const variantClasses = variant === 'alt'
    ? "bg-secondary/10 border border-secondary/30"
    : "bg-white border-l-4 border-[#2D5A47]"

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <h3 className="text-xl font-display font-bold text-primary mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#2D5A47]">{icon}</span>
        {title}
      </h3>
      <p className="text-[#2D3436] leading-relaxed text-[1.05rem] font-medium opacity-90">
        {description}
      </p>
    </div>
  )
}

function PersonalityTestResult() {
  const { resultId } = useParams()
  const { lang } = useLang()
  const { fetchResult, getResult, isLoading, getError } = useResults()
  
  // 이미지 로드 상태 관리
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)
  
  // 리포트 생성 상태 관리
  const [reportStatus, setReportStatus] = useState(null) // not_generated, generating, ready, failed
  const [reportPages, setReportPages] = useState(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  
  // 메인 탭 상태 관리 (기본 결과 / 프리미엄 리포트)
  const [currentTab, setCurrentTab] = useState('basic')
  
  // 리포트 내부 탭 상태 관리
  const [activeTab, setActiveTab] = useState('table_of_contents')

  // Context에서 결과 가져오기 (캐시 활용)
  useEffect(() => {
    if (resultId) {
      fetchResult(resultId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId]) // fetchResult는 안정적인 함수이므로 의존성에서 제외

  // Context에서 데이터 읽기
  const resultData = getResult(resultId)
  const loading = isLoading(resultId)
  const error = getError(resultId)
  
  // 이미지 경로 설정 및 확장자 시도
  useEffect(() => {
    if (resultData?.archetype?.image_id) {
      const imageId = resultData.archetype.image_id
      const extensions = ['.png', '.jpg', '.jpeg', '.webp']
      let currentIndex = 0
      
      // 첫 번째 확장자로 시작
      setImageSrc(`/images/archetypes/${imageId}${extensions[currentIndex]}`)
      setImageError(false)
    } else {
      setImageSrc(null)
      setImageError(true)
    }
  }, [resultData])
  
  // 리포트 상태 확인
  useEffect(() => {
    if (resultData) {
      setReportStatus(resultData.report_status || 'not_generated')
      setReportPages(resultData.report_pages || null)
      
      // 리포트가 ready이고 첫 페이지가 있으면 기본 탭 설정
      if (resultData.report_status === 'ready' && resultData.report_pages) {
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
        const firstAvailablePage = pageOrder.find(pageKey => resultData.report_pages[pageKey])
        if (firstAvailablePage) {
          setActiveTab(firstAvailablePage)
        }
      }
    }
  }, [resultData])
  
  // 숫자와 % 강조 처리 (렌더링 후)
  useEffect(() => {
    if (currentTab === 'premium' && reportStatus === 'ready' && reportPages) {
      const highlightNumbers = () => {
        const proseElement = document.querySelector('.prose')
        if (!proseElement) return
        
        // 이미 처리된 요소는 건너뛰기
        const processedElements = proseElement.querySelectorAll('.highlight-processed')
        processedElements.forEach(el => {
          el.classList.remove('highlight-processed')
          const original = el.getAttribute('data-original')
          if (original) {
            el.innerHTML = original
          }
        })
        
        // 모든 텍스트 노드 찾기
        const walker = document.createTreeWalker(
          proseElement,
          NodeFilter.SHOW_TEXT,
          null
        )
        
        const textNodes = []
        let node
        while (node = walker.nextNode()) {
          if (node.textContent.match(/\d+%/)) {
            textNodes.push(node)
          }
        }
        
        textNodes.forEach(textNode => {
          const parent = textNode.parentElement
          if (parent && !parent.classList.contains('highlight-processed')) {
            parent.classList.add('highlight-processed')
            const original = textNode.textContent
            parent.setAttribute('data-original', original)
            const highlighted = original.replace(/(\d+%)/g, '<span class="text-primary font-bold text-lg">$1</span>')
            if (highlighted !== original) {
              const wrapper = document.createElement('span')
              wrapper.innerHTML = highlighted
              textNode.replaceWith(...Array.from(wrapper.childNodes))
            }
          }
        })
      }
      
      // 약간의 지연 후 실행 (렌더링 완료 후)
      const timer = setTimeout(highlightNumbers, 200)
      return () => clearTimeout(timer)
    }
  }, [activeTab, currentTab, reportStatus, reportPages])
  
  // 리포트 생성 함수
  const handleGenerateReport = async () => {
    if (!resultId) return
    
    setIsGeneratingReport(true)
    setReportStatus('generating')
    
    try {
      // URL이나 Context에서 가져온 lang을 쿼리 파라미터로 전달
      const response = await axios.post(`http://localhost:8000/api/test/generate-report/${resultId}?lang=${lang}`)
      
      if (response.data.status === 'success') {
        // 리포트 생성 완료, 상태 확인을 위해 결과 다시 불러오기
        await fetchResult(resultId)
        
        // 폴링으로 리포트 상태 확인 (최대 30초)
        let attempts = 0
        const maxAttempts = 30
        
        const checkStatus = setInterval(async () => {
          attempts++
          try {
            const resultResponse = await axios.get(`http://localhost:8000/api/results/${resultId}`)
            const updatedData = resultResponse.data
            
            if (updatedData.report_status === 'ready') {
              setReportStatus('ready')
              setReportPages(updatedData.report_pages)
              setIsGeneratingReport(false)
              clearInterval(checkStatus)
            } else if (updatedData.report_status === 'failed') {
              setReportStatus('failed')
              setIsGeneratingReport(false)
              clearInterval(checkStatus)
            } else if (attempts >= maxAttempts) {
              setIsGeneratingReport(false)
              clearInterval(checkStatus)
            }
          } catch (err) {
            console.error('리포트 상태 확인 실패:', err)
            if (attempts >= maxAttempts) {
              setIsGeneratingReport(false)
              clearInterval(checkStatus)
            }
          }
        }, 1000)
      }
    } catch (error) {
      console.error('리포트 생성 실패:', error)
      setReportStatus('failed')
      setIsGeneratingReport(false)
    }
  }

  // UI 텍스트 가져오기 (언어별)
  const uiText = UI_TEXT[lang] || UI_TEXT.en
  
  // 로딩 중
  if (loading) {
    return <LoadingScreen lang={lang} />
  }

  // 에러 발생
  if (error) {
    return <ErrorScreen message={error} onRetry={() => window.location.reload()} lang={lang} />
  }

  // 데이터 없음
  if (!resultData) {
    return <ErrorScreen message={uiText.error.noData} onRetry={() => window.location.reload()} lang={lang} />
  }

  // 데이터 추출
  const { pet_name, stats, archetype, mbti_code } = resultData
  
  // 펫 이름 첫 글자 대문자 변환 함수
  const capitalizeFirstLetter = (str) => {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  
  const displayPetName = capitalizeFirstLetter(pet_name)
  
  // Archetype 데이터에서 현재 언어 텍스트 추출
  const getLocalizedText = (obj) => {
    if (!obj) return ''
    if (typeof obj === 'string') return obj
    return obj[lang] || obj['en'] || ''
  }

  const alias = getLocalizedText(archetype?.alias)
  const summary = getLocalizedText(archetype?.summary)
  const coreTraits = archetype?.coreTraits || []
  const dailyLife = archetype?.dailyLife || []
  const statsLabels = archetype?.statsLabels || {}
  
  // Stats 값 안전하게 추출 및 숫자 변환
  const getStatValue = (key) => {
    if (!stats || typeof stats !== 'object') {
      console.warn(`⚠️ Stats 객체가 없거나 유효하지 않습니다:`, stats)
      return 0
    }
    
    const value = stats[key]
    if (value === undefined || value === null) {
      console.warn(`⚠️ Stats[${key}] 값이 없습니다. 전체 stats:`, stats)
      return 0
    }
    
    // 숫자로 변환 (문자열일 경우 대비)
    const numValue = typeof value === 'number' ? value : Number(value)
    
    if (isNaN(numValue)) {
      console.warn(`⚠️ Stats[${key}] 값이 숫자가 아닙니다:`, value)
      return 0
    }
    
    // 0-100 범위로 제한
    return Math.max(0, Math.min(100, numValue))
  }

  return (
    <main className={`min-h-screen text-[#2D3436] ${currentTab === 'premium' ? 'bg-[#F8F7F4]' : 'bg-[#F9FBF9]'}`}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Main Result Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-primary/5 overflow-hidden mb-12">
          {/* 펫 이름 */}
          <div className="p-6 md:p-8 text-center border-b border-dashed border-gray-100 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">pets</span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-primary tracking-tight">
                {displayPetName}
              </h1>
              <span className="material-symbols-outlined text-primary text-2xl md:text-3xl">pets</span>
            </div>
            <p className="text-sm text-primary/60 font-medium">{uiText.petName.subtitle}</p>
          </div>

          {/* 메인 탭 버튼 (기본 결과 / 프리미엄 리포트) */}
          <div className="px-6 md:px-8 py-4 border-b border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentTab('basic')}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                  currentTab === 'basic'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-50 text-primary hover:bg-primary/10'
                }`}
              >
                {uiText.tabs.basic}
              </button>
              <button
                onClick={() => {
                  if (reportStatus === 'ready') {
                    setCurrentTab('premium')
                  } else {
                    // 결제 유도 섹션으로 스크롤
                    const premiumSection = document.getElementById('premium-cta')
                    if (premiumSection) {
                      premiumSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }
                }}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                  currentTab === 'premium' && reportStatus === 'ready'
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-gray-50 text-primary hover:bg-primary/10'
                }`}
              >
                {reportStatus !== 'ready' && (
                  <span className="material-symbols-outlined text-lg">lock</span>
                )}
                {uiText.tabs.premium}
              </button>
            </div>
          </div>

          {/* 메인 이미지 & 유형 뱃지 (기본 탭일 때만 표시) */}
          {currentTab === 'basic' && (
            <>
          <div className="p-10 flex flex-col items-center">
            <div className="relative w-80 h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] bg-secondary/20 rounded-full flex items-center justify-center mb-10">
              {imageSrc && !imageError ? (
                <img 
                  src={imageSrc}
                  alt={alias || mbti_code || 'Pet Archetype'}
                  className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain z-10"
                  onError={() => {
                    // 다음 확장자 시도
                    const imageId = archetype?.image_id
                    if (imageId) {
                      const extensions = ['.png', '.jpg', '.jpeg', '.webp']
                      const currentPath = imageSrc
                      const currentExt = extensions.find(ext => currentPath.endsWith(ext))
                      
                      if (currentExt) {
                        const currentIndex = extensions.indexOf(currentExt)
                        if (currentIndex < extensions.length - 1) {
                          // 다음 확장자 시도
                          setImageSrc(`/images/archetypes/${imageId}${extensions[currentIndex + 1]}`)
                          return
                        }
                      }
                    }
                    // 모든 확장자 시도 실패 시 fallback 표시
                    setImageError(true)
                  }}
                  onLoad={() => {
                    // 이미지 로드 성공 시 에러 상태 초기화
                    setImageError(false)
                  }}
                />
              ) : null}
              {/* Fallback: 이미지가 없거나 로드 실패 시 */}
              {(!imageSrc || imageError) && (
                <div className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-secondary/30 rounded-full flex items-center justify-center z-10">
                  <span className="material-symbols-outlined text-primary text-9xl md:text-[12rem]">pets</span>
                </div>
              )}
              <div className="absolute inset-0 border border-primary/10 rounded-full scale-110"></div>
              <div className="absolute inset-0 border border-dashed border-primary/20 rounded-full scale-125"></div>
            </div>
            
            <div className="text-center">
              <h2 className="text-5xl md:text-6xl font-display font-bold text-primary tracking-tight uppercase">
                {alias || mbti_code}
              </h2>
              {summary && (
                <p className="mt-4 text-primary/60 text-lg max-w-lg mx-auto">{summary}</p>
              )}
            </div>
          </div>

              {/* Stats 막대 그래프 (일렬 배치) */}
              <div className="px-10 pb-12 space-y-6">
                {STATS_ORDER.map(({ key, color }) => {
                  const value = getStatValue(key)  // 안전한 값 추출
                  const label = getLocalizedText(statsLabels[key]) || key
                  
                  return (
                    <StatBar
                      key={key}
                      name={key.charAt(0).toUpperCase() + key.slice(1)}
                      label={label}
                      value={value}
                      color={color}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* 기본 결과 섹션 (기본 탭일 때만 표시) */}
        {currentTab === 'basic' && (
          <>
            {/* Core Traits */}
            {coreTraits.length > 0 && (
              <div className="space-y-12 mb-16">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-3xl font-display font-bold text-primary">{uiText.sections.coreTraits}</h2>
                  <div className="flex-grow h-[1px] bg-primary/10"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {coreTraits.slice(0, 2).map((trait, index) => (
                    <TraitCard
                      key={index}
                      icon={trait.icon || 'auto_awesome'}
                      title={getLocalizedText(trait.title)}
                      description={getLocalizedText(trait.description)}
                      variant={index % 2 === 1 ? 'alt' : 'default'}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Daily Life */}
            {dailyLife.length > 0 && (
              <div className="space-y-12 mb-16">
                <div className="flex items-center gap-4 my-8">
                  <h2 className="text-3xl font-display font-bold text-primary">{uiText.sections.dailyLife}</h2>
                  <div className="flex-grow h-[1px] bg-primary/10"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {dailyLife.slice(0, 2).map((item, index) => (
                    <TraitCard
                      key={index}
                      icon={item.icon || 'schedule'}
                      title={getLocalizedText(item.title)}
                      description={getLocalizedText(item.description)}
                      variant={index % 2 === 0 ? 'alt' : 'default'}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Premium CTA (기본 탭에서만 표시) */}
        {currentTab === 'basic' && (
          <div id="premium-cta" className="relative bg-primary rounded-[2.5rem] p-10 md:p-16 text-center overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-[#2D5A47]/30 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <span className="material-symbols-outlined text-white text-6xl mb-6">workspace_premium</span>
              <h4 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">{uiText.premium.cta.title}</h4>
              <p className="text-white/70 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
                {uiText.premium.cta.description}
              </p>
              
              {/* 리포트 생성 상태에 따른 버튼 표시 */}
              {reportStatus === 'not_generated' && (
                <button 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="bg-white hover:bg-gray-100 text-primary font-display font-bold text-xl py-5 px-14 rounded-full shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uiText.premium.cta.getReport}
                </button>
              )}
              
              {reportStatus === 'generating' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-white/90 text-lg font-medium">{uiText.premium.cta.generating}</p>
                  <p className="text-white/60 text-sm">{uiText.premium.cta.generatingSub}</p>
                </div>
              )}
              
              {reportStatus === 'ready' && reportPages && (
                <div className="space-y-6">
                  <button 
                    onClick={() => setCurrentTab('premium')}
                    className="bg-white hover:bg-gray-100 text-primary font-display font-bold text-xl py-5 px-14 rounded-full shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                    {uiText.premium.cta.viewReport}
                  </button>
                  <div className="text-white/80 text-sm">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>
                    {uiText.premium.cta.ready}
                  </div>
                </div>
              )}
              
              {reportStatus === 'failed' && (
                <div className="space-y-4">
                  <p className="text-white/90 text-lg">{uiText.premium.cta.failed}</p>
                  <button 
                    onClick={handleGenerateReport}
                    className="bg-white hover:bg-gray-100 text-primary font-display font-bold text-lg py-3 px-8 rounded-full shadow-xl transition-all"
                  >
                    {uiText.premium.cta.retry}
                  </button>
                </div>
              )}
              
              {/* 개발자 모드 테스트 버튼 */}
              {process.env.NODE_ENV === 'development' && reportStatus !== 'generating' && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="bg-white/20 hover:bg-white/30 text-white text-sm font-medium py-2 px-6 rounded-full transition-all disabled:opacity-50"
                  >
                    {isGeneratingReport ? (lang === 'jp' ? '生成中...' : 'Generating...') : uiText.premium.cta.devTest}
                  </button>
                </div>
              )}
              
              <div className="mt-8 flex items-center justify-center gap-2 text-white/40 text-sm">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>{uiText.premium.cta.join}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 프리미엄 리포트 전용 뷰어 (프리미엄 탭일 때만 표시) - 통합 양장본 구조 */}
        {currentTab === 'premium' && reportStatus === 'ready' && reportPages && (() => {
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
          
          return (
            <div className="mt-12">
              {/* 통합 컨테이너 - 커다란 고급 양장본 */}
              <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-primary/5">
                {/* 1. 헤더 영역 (타이틀) */}
                <header className="bg-primary/5 p-10 md:p-12 text-center border-b border-primary/10">
                  <span className="material-symbols-outlined text-primary text-5xl mb-4 block">workspace_premium</span>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-2">
                    {uiText.premium.title}
                  </h2>
                  <p className="text-primary/60 text-lg">{uiText.premium.subtitle.replace('{name}', displayPetName)}</p>
                </header>

                {/* 2. 네비게이션 (탭 메뉴) */}
                <nav className="border-y border-primary/10 bg-white sticky top-0 z-20">
                  <div className="flex flex-wrap gap-2 p-4 overflow-x-auto">
                    {availablePages.map((pageKey) => {
                      const isActive = activeTab === pageKey
                      return (
                        <button
                          key={pageKey}
                          onClick={() => setActiveTab(pageKey)}
                          className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
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

                {/* 3. 본문 영역 (애니메이션 적용) */}
                <main className="p-10 md:p-16 min-h-[600px] bg-white">
                  <AnimatePresence mode="wait">
                    {activePageData && (
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        {/* 페이지 헤더 */}
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-primary/10">
                          <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-primary text-3xl">auto_stories</span>
                            <div>
                              <h3 className="text-2xl font-display font-bold text-primary">
                                {activePageTitle}
                              </h3>
                              <p className="text-sm text-primary/60 mt-1">Page {currentPageIndex} / {totalPages}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* ReactMarkdown으로 마크다운 렌더링 - 에디토리얼 타이포그래피 */}
                        <div className="report-content">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-3xl md:text-4xl font-display font-black text-primary mb-8 pb-4 border-b-4 border-primary/10">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-2xl font-display font-bold text-primary/90 mt-10 mb-6 flex items-center">
                                  <span className="w-1.5 h-6 bg-secondary rounded-full mr-3"></span>
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-xl font-display font-semibold text-primary/80 mt-8 mb-4">
                                  {children}
                                </h3>
                              ),
                              p: ({ children }) => (
                                <p className="text-[#2D3436] leading-relaxed mb-6 text-base">{children}</p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-primary">{children}</strong>
                              ),
                              ul: ({ children }) => (
                                <ul className="my-6 ml-6 space-y-3 list-disc list-outside marker:text-secondary">{children}</ul>
                              ),
                              li: ({ children }) => (
                                <li className="text-[#2D3436] leading-relaxed pl-2">{children}</li>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-secondary bg-secondary/5 p-6 my-8 rounded-r-xl italic text-lg text-[#2D3436]">
                                  {children}
                                </blockquote>
                              ),
                              hr: () => <hr className="my-10 border-t-2 border-primary/10" />,
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
        })()}

        {/* 결과 공유 (기본 탭에서만 표시) */}
        {currentTab === 'basic' && (
          <div className="mt-12 text-center">
            <p className="text-primary/40 text-sm mb-4">{uiText.share.title}</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-primary/10 rounded-full text-primary hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">link</span>
                <span className="font-medium">{uiText.share.copyLink}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default PersonalityTestResult
