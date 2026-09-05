import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../contexts/LanguageContext'
import { useResults } from '../contexts/ResultsContext'
import { useProgress } from '../contexts/ProgressContext'
import { DOG_QUESTIONS } from '../data/dogQuestions'
import QuestionCard from '../components/QuestionCard'
import QuestionWithSideImage from '../components/TestSideImages'
import AnalyzingLoader from '../components/AnalyzingLoader'
import { trackEvent } from '../utils/gtm'
import { calculateMbti } from '../utils/calculateMbti'

// 개발 환경에서는 Vite 프록시 사용 (상대 경로), 배포 환경에서는 절대 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// 12개 질문에 맞게 쾌적한 간격으로 배치된 측면 이미지 설정 (Q4: 좌측, Q9: 우측)
const stage1ImageConfig = {
  3: { image: '1.png', isLeft: true },
  8: { image: '2.png', isLeft: false },
}

const QUESTION_VERSION = 'dog_v1'

// UI 텍스트 다국어 정의
const UI_TEXT = {
  en: {
    loading: "Loading Questions...",
    error: { retry: "Retry" },
    stage1: {
      title: "Dog Personality Assessment",
      subtitle: "Answer 12 questions to discover your dog's true nature."
    },
    buttons: {
      seeResults: "See Results",
      analyzing: "Analyzing..."
    }
  },
  jp: {
    loading: "質問を読み込み中...",
    error: { retry: "再試行" },
    stage1: {
      title: "犬の性格診断",
      subtitle: "愛犬の本当の性格を知るために、12の質問に答えてください。"
    },
    buttons: {
      seeResults: "結果を見る",
      analyzing: "分析中..."
    }
  }
}

// A/B 테스트용 최상단 후킹 메시지 변종 정의
const HOOK_VARIANTS = {
  A: {
    // 속마음/호기심 자극형
    en: {
      title: <>What is your dog <span className="text-orange-500">really thinking?</span></>,
      sub: "1-min secret mind assessment"
    },
    jp: {
      title: <>愛犬は今、<span className="text-orange-500">何を考えている？</span></>,
      sub: "1分でわかる隠れた本心"
    },
    default: {
      title: <>우리 강아지는 지금 <span className="text-orange-500">무슨 생각할까?</span></>,
      sub: "1분 만에 알아채는 속마음"
    }
  },
  B: {
    // 숨겨진 성격/재능 궁금증 유발형
    en: {
      title: <>Is your dog a <span className="text-orange-500">Genius or Free Spirit?</span></>,
      sub: "Discover hidden talents & traits"
    },
    jp: {
      title: <>天才犬？自由人？<span className="text-orange-500">愛犬の隠された才能</span></>,
      sub: "16のタイプで性格を完全診断"
    },
    default: {
      title: <>천재견? 자유로운 영혼? <span className="text-orange-500">숨겨진 성격</span></>,
      sub: "16가지 유형으로 보는 특별한 성향"
    }
  },
  C: {
    // 성격 파악 & 유대감 직관형
    en: {
      title: <>Discover Your Dog's <span className="text-orange-500">True Personality</span></>,
      sub: "1-min personality assessment"
    },
    jp: {
      title: <>愛犬の<span className="text-orange-500">本当の性格</span>を発見</>,
      sub: "1分でわかる性格診断"
    },
    default: {
      title: <>우리 강아지의 <span className="text-orange-500">진짜 성격</span> 알아보기</>,
      sub: "1분 만에 완성하는 성격 리포트"
    }
  }
}

const getOrAssignHookVariant = () => {
  try {
    const saved = sessionStorage.getItem('ab_hook_variant')
    if (saved && HOOK_VARIANTS[saved]) {
      return saved
    }
  } catch (e) {}

  const variants = ['A', 'B', 'C']
  const randomVariant = variants[Math.floor(Math.random() * variants.length)]
  try {
    sessionStorage.setItem('ab_hook_variant', randomVariant)
  } catch (e) {}
  return randomVariant
}

function PersonalityTest() {
  const navigate = useNavigate()
  const { lang, localePath } = useLang()
  const { cacheResult } = useResults()
  const { setProgress } = useProgress()
  
  // UI 텍스트 가져오기 (언어별)
  const uiText = UI_TEXT[lang] || UI_TEXT.en
  
  const [stage] = useState(1)
  const [mainAnswers, setMainAnswers] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hookVariant] = useState(() => getOrAssignHookVariant())
  const questionRefs = useRef([])
  const hasTrackedFirstQuestion = useRef(false)

  // 최초 컴포넌트 마운트 시 test_start 및 hook_variant_shown 이벤트 발행
  useEffect(() => {
    trackEvent('test_start', { stage: 1, lang, hook_variant: hookVariant })
    trackEvent('hook_variant_shown', { variant: hookVariant, lang })
  }, [hookVariant, lang])

  // ✅ 언어 변경 시 테스트 상태 초기화
  useEffect(() => {
    // 언어가 변경되면 테스트를 처음부터 다시 시작
    setMainAnswers({})
    setIsSubmitting(false)
    questionRefs.current = []
    hasTrackedFirstQuestion.current = false
    // 스크롤 최상단으로
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [lang])

  // 직접 데이터 사용 (로컬 파일에서 즉시 로드)
  const questions = DOG_QUESTIONS[lang] || DOG_QUESTIONS.en
  const loading = false
  const error = null

  // 현재 질문 및 답변 데이터
  const currentQuestions = questions?.stage1 || []
  const currentAnswers = mainAnswers
  const setCurrentAnswers = setMainAnswers
  const currentImageConfig = stage1ImageConfig

  // 안전한 길이 계산
  const totalQuestions = currentQuestions.length || 12
  const totalAnswered = Object.keys(mainAnswers).length
  const allAnswered = currentQuestions.length > 0 && Object.keys(currentAnswers).length === currentQuestions.length

  // 📌 1. 1번 문항 뷰포트 실제 노출 트래킹 (IntersectionObserver)
  useEffect(() => {
    if (stage !== 1 || hasTrackedFirstQuestion.current) return

    const targetEl = questionRefs.current[0]
    if (!targetEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && !hasTrackedFirstQuestion.current) {
          hasTrackedFirstQuestion.current = true
          trackEvent('first_question_viewed', { lang, hook_variant: hookVariant })
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(targetEl)

    return () => observer.disconnect()
  }, [stage, lang, currentQuestions, hookVariant])

  // 진행률 계산
  const progressPercent = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0
  
  // ✅ 프로그레스 상태 업데이트
  useEffect(() => {
    setProgress(progressPercent)
    
    // 컴포넌트 언마운트 시 프로그레스바 숨김
    return () => setProgress(null)
  }, [progressPercent, setProgress])

  // 다음 답변할 질문 인덱스 계산
  const getNextUnansweredIndex = () => {
    for (let i = 0; i < currentQuestions.length; i++) {
      if (currentAnswers[i] === undefined) return i
    }
    return currentQuestions.length
  }

  const currentActiveIndex = getNextUnansweredIndex()

  const handleAnswer = (questionIndex, value) => {
    const stepNumber = questionIndex + 1
    trackEvent('question_answer', {
      step_number: stepNumber,
      stage: 1,
      question_index: questionIndex + 1,
      option_value: value,
      lang: lang,
      hook_variant: hookVariant
    })

    setCurrentAnswers(prev => ({
      ...prev,
      [questionIndex]: value
    }))

    // 다음 질문으로 자동 스크롤
    const nextIndex = questionIndex + 1
    if (nextIndex < currentQuestions.length) {
      setTimeout(() => {
        questionRefs.current[nextIndex]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 300)
    }
  }

  const handleSeeResults = async () => {
    if (!allAnswered || isSubmitting) return

    trackEvent('test_submit', { lang, hook_variant: hookVariant })
    setIsSubmitting(true)
    
    try {
      // 클라이언트 전용 즉시 MBTI 계산 (서버 없이 0.001초 계산)
      const resultData = calculateMbti({
        petName: '',
        mainAnswers,
        locale: lang
      })

      const resultId = resultData.result_id || resultData.resultId

      // 결과를 캐시에 저장 (sessionStorage 및 ResultsContext)
      cacheResult(resultId, resultData)

      // 📌 백엔드가 동작하는 환경일 경우 백그라운드 백업 전달 시도
      try {
        axios.post(`${API_BASE_URL}/api/calculate`, {
          petName: '',
          mainAnswers,
          locale: lang
        }).catch((err) => {
          trackEvent('backup_api_error', {
            lang,
            error_message: String(err?.message || err).slice(0, 100)
          })
        })
      } catch (e) {
        trackEvent('backup_api_error', {
          lang,
          error_message: String(e?.message || e).slice(0, 100)
        })
      }

      // 3초간 AI 분석 애니메이션 연출 후 결과 페이지 이동
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // 결과 페이지로 이동
      navigate(`/result/${resultId}`)
    } catch (error) {
      console.error('결과 계산 중 오류:', error)
      trackEvent('test_submit_error', {
        lang,
        error_message: String(error?.message || error).slice(0, 100)
      })
      alert('결과 계산 중 오류가 발생했습니다. 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }

  const canSeeResults = allAnswered && !isSubmitting

  const getQuestionNumber = (index) => index + 1

  // 제출 중 3초 로딩 연출 화면
  if (isSubmitting) {
    return <AnalyzingLoader lang={lang} />
  }

  // 로딩 화면 (데이터가 아직 없을 때도 포함)
  if (loading || !questions?.stage1?.length) {
    return (
      <div className="min-h-screen bg-[#F9FBF9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary/60 font-medium">{uiText.loading}</p>
        </div>
      </div>
    )
  }

  // 에러 화면
  if (error) {
    return (
      <div className="min-h-screen bg-[#F9FBF9] flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
          <p className="text-primary/60 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            {uiText.error.retry}
          </button>
        </div>
      </div>
    )
  }

  // 현재 후킹 문구 변종 선택
  const activeHook = HOOK_VARIANTS[hookVariant]?.[lang] || HOOK_VARIANTS[hookVariant]?.default

  return (
    <main className="flex-grow bg-[#F9FBF9] min-h-screen">
      
      {/* ========== 인트로 헤더 (A/B 테스트 후킹 문구 고정 노출) ========== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fff8e1] to-[#F9FBF9] pt-4 pb-3 md:pt-6 md:pb-4 border-b border-orange-100/60 shadow-xs">
        {/* 배경 장식 */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-orange-200/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-[800px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              {/* 메인 타이틀 (A/B 변종 적용) */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-primary leading-tight tracking-tight">
                {activeHook.title}
              </h1>

              {/* 서브문구 & 뱃지 (A/B 변종 적용) */}
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-xs sm:text-sm text-primary/70 font-medium">
                  {activeHook.sub}
                </span>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white rounded-full text-xs font-semibold text-primary border border-orange-200 shadow-2xs">
                  <span className="material-symbols-outlined text-orange-500 text-xs">quiz</span>
                  <span>{lang === 'jp' ? '12の質問' : '12 Questions'}</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white rounded-full text-xs font-semibold text-primary border border-orange-200 shadow-2xs">
                  <span className="material-symbols-outlined text-orange-500 text-xs">pets</span>
                  <span>{lang === 'jp' ? '16の性格タイプ' : '16 Types'}</span>
                </div>
              </div>
            </div>

            {/* 우측 강아지 일러스트 썸네일 */}
            <div className="flex items-center shrink-0">
              <img 
                src="/images/dog/2.png" 
                alt="Dog" 
                className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== 기존 테스트 영역 ========== */}
      <div className="px-4 md:px-20 lg:px-40 py-3 md:py-6">
        <div className="max-w-[800px] mx-auto">
          
          {/* 진행 상황 카운터 */}
          <div className="flex justify-end mb-3 md:mb-4">
            <span className="text-primary/60 text-xs md:text-sm font-medium">
              {totalAnswered} / {totalQuestions} {lang === 'jp' ? '回答済み' : 'Answered'}
            </span>
          </div>

          <div className="space-y-4 md:space-y-6">
            {currentQuestions.map((q, index) => {
              const isDisabled = index > currentActiveIndex

              return (
                <QuestionWithSideImage
                  key={`${stage}-${index}`}
                  questionIndex={index}
                  imageConfig={currentImageConfig}
                  basePath="/images/dog"
                >
                  <QuestionCard
                    ref={el => questionRefs.current[index] = el}
                    number={getQuestionNumber(index)}
                    question={q.text}
                    value={currentAnswers[index]}
                    onChange={(value) => handleAnswer(index, value)}
                    disabled={isDisabled}
                    lang={lang}
                  />
                </QuestionWithSideImage>
              )
            })}
          </div>

          <div className="pt-8 md:pt-10 pb-8 flex justify-center">
            <div className="w-full flex flex-col items-center gap-6">
              <button
                onClick={handleSeeResults}
                disabled={!canSeeResults || isSubmitting}
                className={`
                  w-full md:w-auto group px-16 py-6 font-display text-lg md:text-xl font-bold rounded-2xl transition-all flex items-center justify-center gap-3
                  ${canSeeResults && !isSubmitting
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg hover:shadow-xl cursor-pointer' 
                    : 'bg-accent text-primary cursor-not-allowed shadow-lg opacity-60'
                  }
                `}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{uiText.buttons.analyzing}</span>
                  </>
                ) : (
                  <>
                    <span>{uiText.buttons.seeResults}</span>
                    <span className={`material-symbols-outlined text-2xl transform transition-transform ${canSeeResults ? 'group-hover:translate-x-1' : ''}`}>
                      celebration
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PersonalityTest
