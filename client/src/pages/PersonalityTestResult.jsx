import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useResults } from '../contexts/ResultsContext'
import axios from 'axios'
import PremiumReportViewer from '../components/PremiumReportViewer'

// API Base URL (환경 변수 또는 기본값)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
      noData: "Result data not found.",
      languageMismatch: "This result was created in a different language.",
      viewInOriginal: "View in Original Language"
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
        title: "Unlock Your Premium Report",
        description: "Get {name}'s complete personality analysis with personalized training strategies, daily routines, and compatibility insights.",
        getReport: "Get Premium Report",
        price: "$5.99",
        generating: "Generating your report...",
        generatingSub: "This may take up to 30 seconds",
        viewReport: "View Premium Report",
        ready: "Your report is ready!",
        failed: "Generation failed. Please try again.",
        retry: "Try Again"
      },
      premiumPreview: {
        sectionTitle: "View Complete Results",
        unlockButton: "Unlock",
        lockedDescription: "This section contains personalized insights for {name}",
        sections: [
          {
            key: "deep_dive_traits",
            title: "Personality Analysis",
            icon: "psychology",
            preview: "Detailed breakdown of your pet's unique personality traits and behavioral patterns..."
          },
          {
            key: "cognitive_strengths",
            title: "Cognitive Strengths",
            icon: "neurology",
            preview: "Understanding how your pet learns, solves problems, and processes information..."
          },
          {
            key: "owner_chemistry",
            title: "Chemistry Analysis",
            icon: "favorite",
            preview: "Discover why you and your pet make a great team and how to strengthen your bond..."
          },
          {
            key: "training_roadmap",
            title: "Training Guide",
            icon: "school",
            preview: "Step-by-step training strategies tailored to your pet's personality type..."
          },
          {
            key: "social_adaptation",
            title: "Social Adaptation",
            icon: "groups",
            preview: "Tips for helping your pet interact with other dogs, people, and new environments..."
          },
          {
            key: "lifestyle_guide",
            title: "Lifestyle Guide",
            icon: "routine",
            preview: "The perfect daily routine designed specifically for your pet's needs..."
          }
        ]
      }
    },
    share: {
      title: "Share your result",
      copyLink: "Copy Link",
      copied: "Copied!",
      shareTest: "Take the test"
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
      noData: "結果データが見つかりません。",
      languageMismatch: "この結果は別の言語で作成されました。",
      viewInOriginal: "元の言語で表示"
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
        title: "プレミアムレポートをアンロック",
        description: "{name}の完全な性格分析、パーソナライズされたトレーニング戦略、毎日のルーティン、相性の洞察を入手してください。",
        getReport: "プレミアムレポートを取得",
        price: "$5.99",
        generating: "レポートを生成中...",
        generatingSub: "最大30秒かかる場合があります",
        viewReport: "プレミアムレポートを表示",
        ready: "レポートの準備ができました！",
        failed: "生成に失敗しました。もう一度お試しください。",
        retry: "再試行"
      },
      premiumPreview: {
        sectionTitle: "完全な結果を確認",
        unlockButton: "アンロック",
        lockedDescription: "このセクションには{name}のためのパーソナライズされた洞察が含まれています",
        sections: [
          {
            key: "deep_dive_traits",
            title: "性格分析",
            icon: "psychology",
            preview: "ペットの独特な性格特性と行動パターンの詳細な分析..."
          },
          {
            key: "cognitive_strengths",
            title: "認知的強み",
            icon: "neurology",
            preview: "ペットがどのように学び、問題を解決し、情報を処理するかを理解..."
          },
          {
            key: "owner_chemistry",
            title: "相性分析",
            icon: "favorite",
            preview: "あなたとペットが最高のチームである理由と絆を深める方法..."
          },
          {
            key: "training_roadmap",
            title: "トレーニングガイド",
            icon: "school",
            preview: "ペットの性格タイプに合わせたステップバイステップのトレーニング戦略..."
          },
          {
            key: "social_adaptation",
            title: "社会適応",
            icon: "groups",
            preview: "他の犬、人、新しい環境との交流を助けるヒント..."
          },
          {
            key: "lifestyle_guide",
            title: "ライフスタイルガイド",
            icon: "routine",
            preview: "ペットのニーズに合わせて設計された完璧な毎日のルーティン..."
          }
        ]
      }
    },
    share: {
      title: "結果を共有",
      copyLink: "リンクをコピー",
      copied: "コピーしました！",
      shareTest: "テストを受ける"
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

// 언어 불일치 전용 에러 컴포넌트
function LanguageMismatchScreen({ originalLang, currentLang, onViewOriginal }) {
  const text = UI_TEXT[currentLang] || UI_TEXT.en
  
  // 언어 이름 매핑
  const langNames = {
    en: { en: 'English', jp: '英語' },
    jp: { en: 'Japanese', jp: '日本語' }
  }
  
  const originalLangName = langNames[originalLang]?.[currentLang] || originalLang.toUpperCase()
  
  return (
    <main className="min-h-screen bg-[#F9FBF9] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <span className="material-symbols-outlined text-7xl text-primary/40 mb-6 block">translate</span>
        <h2 className="text-2xl font-display font-bold text-primary mb-4">
          {text.error.languageMismatch}
        </h2>
        <p className="text-primary/60 mb-8">
          {currentLang === 'jp' 
            ? `このテストは${originalLangName}で受けました。元の言語で結果をご覧ください。`
            : `This test was taken in ${originalLangName}. Please view the result in the original language.`
          }
        </p>
        <button
          onClick={onViewOriginal}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">open_in_new</span>
          {text.error.viewInOriginal}
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
    <div className="space-y-2 md:space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-xs md:text-sm font-bold text-primary/60 uppercase tracking-wider">{name}</span>
        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-xs md:text-sm font-bold text-primary">{label}</span>
          <span className={`text-xs md:text-sm font-bold ${color.replace('bg-', 'text-')}`}>{strengthPercent}%</span>
        </div>
      </div>
      <div className="h-2 md:h-3 w-full bg-gray-100 rounded-full overflow-hidden">
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
  const baseClasses = "p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
  const variantClasses = variant === 'alt'
    ? "bg-secondary/10 border border-secondary/30"
    : "bg-white border-l-4 border-[#2D5A47]"

  return (
    <div className={`${baseClasses} ${variantClasses}`}>
      <h3 className="text-lg md:text-xl font-display font-bold text-primary mb-3 md:mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#2D5A47] text-2xl md:text-xl">{icon}</span>
        {title}
      </h3>
      <p className="text-[#2D3436] leading-7 md:leading-relaxed text-[15px] md:text-[1.05rem] font-medium opacity-90">
        {description}
      </p>
    </div>
  )
}

function LockedPreviewCard({ icon, title, preview, petName, onUnlockClick, unlockButtonText }) {
  return (
    <div className="relative p-5 md:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all min-h-[120px]">
      {/* Header: Icon Badge & Title */}
      <div className="flex items-start gap-4 mb-3">
        {/* Icon Badge */}
        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
        </div>
        {/* Title */}
        <div className="flex-1 pt-1">
          <h3 className="text-lg md:text-xl font-display font-bold text-primary leading-tight mb-1">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-primary/40 font-medium">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Premium Content</span>
          </div>
        </div>
      </div>
      
      {/* Blurred Preview Content */}
      <div className="relative mt-2">
        <p className="text-[#2D3436]/60 text-sm leading-relaxed blur-[5px] select-none pointer-events-none line-clamp-2">
          {preview} {preview}
        </p>
        
        {/* Unlock Overlay & Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
          <button
            onClick={onUnlockClick}
            className="px-5 py-2.5 bg-white border border-primary/20 shadow-md rounded-full text-primary text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">lock_open</span>
            {unlockButtonText}
          </button>
        </div>
      </div>
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
  const [isStartingPayment, setIsStartingPayment] = useState(false) // 결제 시작 로딩 상태
  const [paymentProcessed, setPaymentProcessed] = useState(false) // 결제 성공 여부를 추적하는 상태 (중복 실행 방지)
  const [reportGenerationStarted, setReportGenerationStarted] = useState(false) // 리포트 생성 시작 여부 (중복 실행 방지)
  
  // Share 기능 상태
  const [copied, setCopied] = useState(false)
  
  // 언어 불일치 상태
  const [languageMismatch, setLanguageMismatch] = useState(false)
  
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
  
  // 언어 불일치 체크 (locale 또는 lang 필드 사용)
  useEffect(() => {
    if (resultData) {
      const originalLang = resultData.locale || resultData.lang
      if (originalLang && lang !== originalLang) {
        setLanguageMismatch(true)
      } else {
        setLanguageMismatch(false)
      }
    }
  }, [resultData, lang])
  
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
  
  // 리포트 상태 확인 및 activeTab 초기값 설정
  useEffect(() => {
    if (resultData) {
      setReportStatus(resultData.report_status || 'not_generated')
      setReportPages(resultData.report_pages || null)
      
      // 리포트가 ready이고 첫 페이지가 있으면 기본 탭 설정
      // PremiumReportViewer와 동일한 순서 정의
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
        // 실제 데이터가 있는 첫 번째 페이지를 활성화
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
  
  // Polar 결제 시작 함수
  // 최하단 결제 버튼으로 스크롤하는 함수
  const scrollToPremiumCTA = () => {
    const ctaElement = document.getElementById('premium-cta')
    if (ctaElement) {
      // 헤더 높이를 고려한 오프셋
      const headerOffset = 80
      const elementPosition = ctaElement.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  const handleStartPayment = async () => {
    if (!resultId) return
    
    setIsStartingPayment(true)
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/polar/create-checkout`,
        null,
        {
          params: {
            result_id: resultId,
            lang: lang
          }
        }
      )
      
      if (response.data.status === 'success' && response.data.checkout_url) {
        // Polar Checkout 페이지로 리다이렉트
        window.location.href = response.data.checkout_url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('결제 세션 생성 실패:', error)
      setIsStartingPayment(false)
      alert(lang === 'jp' 
        ? '결제 세션 생성에 실패했습니다. 다시 시도해주세요.' 
        : 'Failed to create checkout session. Please try again.')
    }
  }
  
  // 리포트 생성 함수
  const handleGenerateReport = async () => {
    if (!resultId) return
    
    setIsGeneratingReport(true)
    setReportStatus('generating')
    
    try {
      // URL이나 Context에서 가져온 lang을 쿼리 파라미터로 전달
      const response = await axios.post(`${API_BASE_URL}/api/test/generate-report/${resultId}?lang=${lang}`)
      
      if (response.data.status === 'success') {
        // 리포트 생성 완료, 상태 확인을 위해 결과 다시 불러오기
        await fetchResult(resultId)
        
        // 폴링으로 리포트 상태 확인 (최대 30초)
        let attempts = 0
        const maxAttempts = 30
        
        const checkStatus = setInterval(async () => {
          attempts++
          try {
            const resultResponse = await axios.get(`${API_BASE_URL}/api/results/${resultId}`)
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

  // 결제 완료 후 처리 (URL 파라미터 확인) - 최초 1회만 실행
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    
    // 결제 성공 + 아직 처리 안 됨 + resultId 있음
    if (paymentStatus === 'success' && !paymentProcessed && resultId) {
      // 즉시 처리 완료 표시 (중복 실행 방지)
      setPaymentProcessed(true)
      
      // URL에서 payment 파라미터 즉시 제거
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // 즉시 로딩 상태로 전환 (화면에 바로 표시)
      setReportStatus('generating')
      setIsGeneratingReport(true)
      
      // 최상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [resultId, paymentProcessed])

  // 로딩 상태가 설정된 후 리포트 생성 시작
  useEffect(() => {
    // generating 상태이고, 결제 처리된 경우 + 아직 생성 시작 안 한 경우
    if (reportStatus === 'generating' && paymentProcessed && resultId && !reportGenerationStarted) {
      // 중복 실행 방지
      setReportGenerationStarted(true)
      
      // 리포트 생성 API 호출
      const generateReport = async () => {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/test/generate-report/${resultId}?lang=${lang}`)
          
          if (response.data.status === 'success') {
            // 폴링으로 리포트 상태 확인 (최대 90초)
            let attempts = 0
            const maxAttempts = 90
            
            const checkStatus = setInterval(async () => {
              attempts++
              try {
                const resultResponse = await axios.get(`${API_BASE_URL}/api/results/${resultId}`)
                const updatedData = resultResponse.data
                
                if (updatedData.report_status === 'ready') {
                  setReportStatus('ready')
                  setReportPages(updatedData.report_pages)
                  setIsGeneratingReport(false)
                  setCurrentTab('premium')
                  clearInterval(checkStatus)
                } else if (updatedData.report_status === 'failed') {
                  setReportStatus('failed')
                  setIsGeneratingReport(false)
                  setCurrentTab('basic')
                  clearInterval(checkStatus)
                } else if (attempts >= maxAttempts) {
                  setReportStatus('failed')
                  setIsGeneratingReport(false)
                  setCurrentTab('basic')
                  clearInterval(checkStatus)
                }
              } catch (err) {
                console.error('리포트 상태 확인 실패:', err)
                if (attempts >= maxAttempts) {
                  setReportStatus('failed')
                  setIsGeneratingReport(false)
                  setCurrentTab('basic')
                  clearInterval(checkStatus)
                }
              }
            }, 1000)
          }
        } catch (error) {
          console.error('리포트 생성 실패:', error)
          setReportStatus('failed')
          setIsGeneratingReport(false)
          setCurrentTab('basic')
        }
      }
      
      generateReport()
    }
  }, [reportStatus, paymentProcessed, resultId, reportGenerationStarted, lang]) // eslint-disable-line react-hooks/exhaustive-deps

  // 링크 복사 함수
  const handleCopyLink = async () => {
    const shareUrl = `https://www.yourpetinsight.com/${lang}/dog-test/personality`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 네이티브 공유 함수 (모바일)
  const handleNativeShare = async () => {
    const shareUrl = `https://www.yourpetinsight.com/${lang}/dog-test/personality`
    const shareData = {
      title: lang === 'jp' 
        ? `${displayPetName}の性格テスト` 
        : `${displayPetName}'s Personality Test`,
      text: lang === 'jp'
        ? `${displayPetName}の性格タイプを発見しました！あなたのペットもテストしてみてください。`
        : `I just discovered ${displayPetName}'s personality type! Take the test for your pet too.`,
      url: shareUrl
    }
    
    try {
      await navigator.share(shareData)
    } catch (err) {
      // 사용자가 취소하거나 지원 안 되는 경우
      console.log('Share cancelled or not supported')
    }
  }

  // UI 텍스트 가져오기 (언어별)
  const uiText = UI_TEXT[lang] || UI_TEXT.en
  
  // 로딩 중
  if (loading) {
    return <LoadingScreen lang={lang} />
  }

  // 에러 발생 - 한국어 메시지가 오면 UI_TEXT 메시지 사용
  if (error) {
    const errorMessage = (typeof error === 'string' && (error.includes('찾을 수 없습니다') || error.includes('결과'))) 
      ? uiText.error.noData 
      : error
    return <ErrorScreen message={errorMessage} onRetry={() => window.location.reload()} lang={lang} />
  }

  // 데이터 없음
  if (!resultData) {
    return <ErrorScreen message={uiText.error.noData} onRetry={() => window.location.reload()} lang={lang} />
  }

  // 언어 불일치 - 에러 화면 표시
  if (languageMismatch && resultData) {
    const originalLang = resultData.locale || resultData.lang
    return (
      <LanguageMismatchScreen 
        originalLang={originalLang}
        currentLang={lang}
        onViewOriginal={() => {
          const newPath = window.location.pathname.replace(`/${lang}/`, `/${originalLang}/`)
          window.location.href = newPath
        }}
      />
    )
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
    <>
      {/* 전체 화면 리포트 생성 로딩 오버레이 */}
      {reportStatus === 'generating' && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-primary text-xl md:text-2xl font-bold mb-2">
                {uiText.premium.cta.generating}
              </p>
              <p className="text-primary/60 text-sm md:text-base">
                {uiText.premium.cta.generatingSub}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <main className={`min-h-screen text-[#2D3436] ${currentTab === 'premium' ? 'bg-[#F8F7F4]' : 'bg-[#F9FBF9]'}`}>
        <div className="max-w-5xl mx-auto px-4 py-2 md:px-6 md:py-12">
        {/* Main Result Card */}
        <div className={`bg-white shadow-sm border border-primary/5 overflow-hidden
          ${currentTab === 'premium' && reportStatus === 'ready' 
            ? 'rounded-t-xl md:rounded-t-[2rem] rounded-b-none border-b-0 mb-0' 
            : 'rounded-xl mb-4 md:mb-12 md:rounded-[2rem]'}`}>
          {/* 1. Tabs (최상단) */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentTab('basic')}
                className={`px-3 md:px-6 py-2 rounded-lg font-medium transition-all text-xs md:text-sm ${
                  currentTab === 'basic'
                    ? 'bg-white text-primary shadow-sm'
                    : 'bg-transparent text-primary/70 hover:text-primary'
                }`}
              >
                {uiText.tabs.basic}
              </button>
              <button
                onClick={() => {
                  if (reportStatus === 'ready') {
                    setCurrentTab('premium')
                    // Premium 탭으로 전환 후 최상단으로 스크롤 (즉시)
                    window.scrollTo({ top: 0, behavior: 'auto' })
                  } else {
                    // 최하단 결제 버튼으로 스크롤
                    scrollToPremiumCTA()
                  }
                }}
                className={`px-3 md:px-6 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 text-xs md:text-sm ${
                  currentTab === 'premium' && reportStatus === 'ready'
                    ? 'bg-white text-primary shadow-sm'
                    : 'bg-transparent text-primary/70 hover:text-primary'
                }`}
              >
                {reportStatus !== 'ready' && (
                  <span className="material-symbols-outlined text-sm">lock</span>
                )}
                {uiText.tabs.premium}
              </button>
            </div>
          </div>

          {/* 2. Header: Name & Share (데스크탑만 표시, Basic 탭에서만) */}
          {currentTab === 'basic' && (
          <div className="hidden md:flex md:flex-row md:items-center justify-between border-b border-gray-50 p-4 gap-4">
            {/* Left: Pet Name */}
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-primary text-xl md:text-2xl">pets</span>
              <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-primary tracking-tight leading-none">
                  {displayPetName}
                </h1>
                <p className="text-xs text-primary/60 font-medium mt-0.5">{uiText.petName.subtitle}</p>
              </div>
            </div>

            {/* Right: Share Buttons (Icon Only) */}
            <div className="flex gap-2 justify-center md:justify-end">
              <button 
                onClick={handleCopyLink}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                  copied 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-white border-gray-200 text-primary hover:bg-gray-50'
                }`}
                title={copied ? uiText.share.copied : uiText.share.copyLink}
              >
                <span className="material-symbols-outlined text-lg">
                  {copied ? 'check' : 'link'}
                </span>
              </button>
              
              {/* 네이티브 공유 버튼 (모바일에서 유용) */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button 
                  onClick={handleNativeShare}
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary hover:bg-gray-50 transition-all"
                  title={lang === 'jp' ? '共有' : 'Share'}
                >
                  <span className="material-symbols-outlined text-lg">share</span>
                </button>
              )}
            </div>
          </div>
          )}

          {/* 메인 이미지 & 유형 뱃지 (기본 탭일 때만 표시) */}
          {currentTab === 'basic' && (
            <>
          <div className="p-6 md:p-10 relative flex flex-col items-center">
            {/* 모바일: 결론 우선 구조 */}
            <div className="w-full md:hidden flex flex-col items-center">
              {/* 1. Header Area (Pet Name + Share Buttons) - Basic 탭에서만 표시 */}
              {currentTab === 'basic' && (
              <div className="flex flex-col w-full mb-6">
                {/* Row 1: Share Buttons (Right Aligned) */}
                <div className="flex justify-end gap-2 w-full mb-1 px-1">
                  <button 
                    onClick={handleCopyLink}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-md ${
                      copied 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'bg-white border-gray-200 text-primary hover:bg-gray-50'
                    }`}
                    title={copied ? uiText.share.copied : uiText.share.copyLink}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {copied ? 'check' : 'link'}
                    </span>
                  </button>
                  
                  {/* 네이티브 공유 버튼 (모바일에서 유용) */}
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button 
                      onClick={handleNativeShare}
                      className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary hover:bg-gray-50 transition-all shadow-md"
                      title={lang === 'jp' ? '共有' : 'Share'}
                    >
                      <span className="material-symbols-outlined text-lg">share</span>
                    </button>
                  )}
                </div>
                
                {/* Row 2: Pet Name (Centered & Safe) */}
                <div className="flex flex-col items-center justify-center px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="material-symbols-outlined text-primary text-2xl shrink-0">pets</span>
                    <h1 className="text-3xl font-display font-bold text-primary tracking-tight leading-tight text-center break-words break-keep max-w-full">
                    {displayPetName}
                  </h1>
                </div>
                <p className="text-sm text-primary/60 font-medium">{uiText.petName.subtitle}</p>
              </div>
              </div>
              )}

              {/* 2. Hero Image Area */}
              <div className="relative w-80 h-80 mb-6">
                <div className="absolute inset-8 bg-secondary/5 rounded-full blur-2xl"></div>
                {imageSrc && !imageError ? (
                  <img 
                    src={imageSrc}
                    alt={alias || mbti_code || 'Pet Archetype'}
                    className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
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
                  <div className="relative z-10 w-full h-full bg-secondary/30 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-9xl">pets</span>
                  </div>
                )}
              </div>

              {/* 3. Title Area (이미지 바로 아래) */}
              <div className="text-center mb-8 px-2 w-full">
                <h2 className="font-black text-primary uppercase tracking-tighter leading-none whitespace-nowrap text-[clamp(1.2rem,5vw,2.5rem)] mb-2 w-full overflow-visible">
                  {alias || mbti_code}
                </h2>
                {summary && (
                  <p className="text-sm text-primary/80 leading-relaxed font-medium">
                    {summary}
                  </p>
                )}
              </div>

              {/* 4. Stats Area (Title 아래) */}
              <div className="w-full bg-gray-50 rounded-2xl p-5 space-y-3">
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
            </div>

            {/* 데스크탑: 기존 레이아웃 유지 */}
            <div className="hidden md:block w-full">
              {/* TOP SECTION: Image & Stats */}
              <div className="flex flex-row items-center justify-center gap-8 mb-2">
                
                {/* 1. Hero Image Area */}
                <div className="relative w-[28rem] h-[28rem] flex-shrink-0">
                  <div className="absolute inset-8 bg-secondary/5 rounded-full blur-2xl"></div>
                  {imageSrc && !imageError ? (
                    <img 
                      src={imageSrc}
                      alt={alias || mbti_code || 'Pet Archetype'}
                      className="relative z-10 w-full h-full object-contain drop-shadow-2xl transform scale-110 origin-center"
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
                    <div className="relative z-10 w-full h-full bg-secondary/30 rounded-full flex items-center justify-center transform scale-110 origin-center">
                      <span className="material-symbols-outlined text-primary text-[14rem]">pets</span>
                    </div>
                  )}
                </div>

                {/* 2. Stats (데스크탑: 우측) */}
                <div className="w-1/2 space-y-3 z-20">
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
              </div>

              {/* BOTTOM SECTION: Text (데스크탑) */}
              <div className="text-center pt-0 -mt-8 relative z-30">
                <h2 className="font-black text-primary uppercase tracking-tighter leading-none whitespace-nowrap text-6xl mb-3 w-full overflow-visible">
                  {alias || mbti_code}
                </h2>
                {summary && (
                  <p className="text-lg text-primary/70 max-w-2xl mx-auto leading-relaxed">
                    {summary}
                  </p>
                )}
              </div>
            </div>
          </div>
            </>
          )}
        </div>

        {/* 기본 결과 섹션 (기본 탭일 때만 표시) */}
        {currentTab === 'basic' && (
          <>
            {/* Core Traits */}
            {coreTraits.length > 0 && (
              <div className="space-y-4 md:space-y-12 mb-6 md:mb-16">
                <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-8">
                  <h2 className="text-xl md:text-3xl font-display font-bold text-primary">{uiText.sections.coreTraits}</h2>
                  <div className="flex-grow h-[1px] bg-primary/10"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
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
              <div className="space-y-4 md:space-y-12 mb-6 md:mb-16">
                <div className="flex items-center gap-2 md:gap-4 my-2 md:my-8">
                  <h2 className="text-xl md:text-3xl font-display font-bold text-primary">{uiText.sections.dailyLife}</h2>
                  <div className="flex-grow h-[1px] bg-primary/10"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
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

            {/* Premium Content Preview (잠긴 카드들) */}
            <div className="space-y-4 md:space-y-8 mb-8 md:mb-16">
              {/* 섹션 헤더 */}
              <div className="flex items-center gap-2 md:gap-4 mb-6 md:mb-8">
                <h2 className="text-xl md:text-3xl font-display font-bold text-primary">
                  {uiText.premium.premiumPreview.sectionTitle}
                </h2>
                <div className="flex-grow h-[1px] bg-primary/10"></div>
                <span className="material-symbols-outlined text-primary/40 text-lg md:text-2xl">workspace_premium</span>
              </div>
              
              {/* 잠긴 카드 그리드 (2열) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {uiText.premium.premiumPreview.sections.map((section) => (
                  <LockedPreviewCard
                    key={section.key}
                    icon={section.icon}
                    title={section.title}
                    preview={section.preview}
                    petName={displayPetName}
                    unlockButtonText={uiText.premium.premiumPreview.unlockButton}
                    onUnlockClick={scrollToPremiumCTA}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Premium CTA (기본 탭에서만 표시) */}
        {currentTab === 'basic' && (
          <div id="premium-cta" className="relative mt-8 mb-12">
            <div className="relative bg-gradient-to-br from-primary to-[#1B4D3E] rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 text-center overflow-hidden shadow-2xl border border-white/10">
              {/* Background Effects (Glow) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#2D5A47]/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                {/* 1. Glowing Icon Badge */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 md:mb-6 backdrop-blur-sm border border-white/10 shadow-inner">
                  <span className="material-symbols-outlined text-white text-3xl md:text-4xl">workspace_premium</span>
                </div>

                {/* 2. Title & Description */}
                <h4 className="text-2xl md:text-4xl font-display font-bold text-white mb-3 md:mb-4">
                  {uiText.premium.cta.title}
                </h4>
                <p className="text-white/80 text-sm md:text-lg leading-relaxed max-w-lg mx-auto mb-8 md:mb-10">
                  {uiText.premium.cta.description.replace('{name}', displayPetName)}
                </p>

                {/* 3. Main Action Button (Full Width on Mobile) */}
                <div className="flex flex-col items-center gap-4 w-full">
                  {/* Price Display */}
                  {reportStatus !== 'ready' && reportStatus !== 'generating' && (
                    <div className="flex items-center gap-2 text-white/90 mb-2">
                      <span className="text-3xl md:text-4xl font-bold">{uiText.premium.cta.price}</span>
                      <span className="text-sm md:text-base opacity-80">USD</span>
                    </div>
                  )}
                  
                  {reportStatus !== 'generating' && (
                    <button 
                        onClick={async () => {
                          if (reportStatus === 'ready' && reportPages) {
                            setCurrentTab('premium')
                            // Premium 탭으로 전환 후 최상단으로 스크롤 (즉시)
                            window.scrollTo({ top: 0, behavior: 'auto' })
                          } else {
                            // Polar 결제 플로우
                            handleStartPayment()
                          }
                        }}
                        disabled={isGeneratingReport || isStartingPayment}
                        className={`w-full md:w-auto font-bold text-base md:text-lg py-4 px-8 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:cursor-not-allowed ${
                          isStartingPayment 
                            ? 'bg-white/60 text-primary/60' 
                            : 'bg-white text-primary hover:bg-gray-50'
                        }`}
                      >
                        {isStartingPayment ? (
                          <>
                            <div className="w-5 h-5 border-2 border-primary/60 border-t-transparent rounded-full animate-spin"></div>
                            <span>{uiText.premium.cta.getReport}</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {reportStatus === 'ready' && reportPages 
                                ? uiText.premium.cta.viewReport 
                                : reportStatus === 'failed'
                                ? uiText.premium.cta.retry
                                : uiText.premium.cta.getReport}
                            </span>
                            <span className="material-symbols-outlined text-xl">arrow_forward</span>
                          </>
                        )}
                      </button>
                  )}
                  
                  {reportStatus === 'ready' && reportPages && (
                    <div className="flex items-center gap-2 text-white/80">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span className="text-sm font-medium">{uiText.premium.cta.ready}</span>
                    </div>
                  )}
                  
                  {reportStatus === 'failed' && (
                    <p className="text-white/70 text-sm">{uiText.premium.cta.failed}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 프리미엄 리포트 전용 뷰어 (프리미엄 탭일 때만 표시) - 여백 없이 바로 연결 */}
        {currentTab === 'premium' && reportStatus === 'ready' && reportPages && (
          <PremiumReportViewer
            petName={displayPetName}
            reportPages={reportPages}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            uiText={uiText}
            onCopyLink={handleCopyLink}
            onNativeShare={handleNativeShare}
            isCopied={copied}
          />
        )}
        
        </div>
      </main>
    </>
  )
}

export default PersonalityTestResult
