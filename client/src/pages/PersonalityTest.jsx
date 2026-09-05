import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../contexts/LanguageContext'
import { useResults } from '../contexts/ResultsContext'
import { useProgress } from '../contexts/ProgressContext'
import { DOG_QUESTIONS } from '../data/dogQuestions'
import QuestionCard from '../components/QuestionCard'
import QuestionWithSideImage from '../components/TestSideImages'
import { trackEvent } from '../utils/gtm'
import { calculateMbti } from '../utils/calculateMbti'

// 개발 환경에서는 Vite 프록시 사용 (상대 경로), 배포 환경에서는 절대 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// 스테이지 1: 4개 이미지 (질문 4, 9, 14, 18에 배치) - 좌우 번갈아
const stage1ImageConfig = {
  3: { image: '1.png', isLeft: true },
  8: { image: '2.png', isLeft: false },
  13: { image: '3.png', isLeft: true },
  17: { image: '4.png', isLeft: false },
}

// 스테이지 2: 2개 이미지 (질문 2, 4에 배치) - 좌우 번갈아
const stage2ImageConfig = {
  1: { image: '5.png', isLeft: true },
  3: { image: '6.png', isLeft: false },
}

const QUESTION_VERSION = 'dog_v1'

// UI 텍스트 다국어 정의
const UI_TEXT = {
  en: {
    loading: "Loading Questions...",
    error: { retry: "Retry" },
    stage1: {
      title: "Dog Personality Assessment",
      subtitle: "Answer 20 questions to discover your dog's true nature."
    },
    stage2: {
      title: "Owner Connection",
      subtitle: "Almost done! Just 5 more questions about you.",
      badge: "Owner Connection Round"
    },
    buttons: {
      next: "Next",
      seeResults: "See Results",
      analyzing: "Analyzing..."
    },
    petName: {
      label: "🐾 What's your pet's name?",
      placeholder: "Enter your pet's name"
    }
  },
  jp: {
    loading: "質問を読み込み中...",
    error: { retry: "再試行" },
    stage1: {
      title: "犬の性格診断",
      subtitle: "愛犬の本当の性格を知るために、質問に答えてください。"
    },
    stage2: {
      title: "飼い主とのつながり",
      subtitle: "もう少しです！あなたについて5つの質問に答えてください。",
      badge: "飼い主とのつながりラウンド"
    },
    buttons: {
      next: "次へ",
      seeResults: "結果を見る",
      analyzing: "分析中..."
    },
    petName: {
      label: "🐾 ペットの名前は？",
      placeholder: "ペットの名前を入力してください"
    }
  }
}

function PersonalityTest() {
  const navigate = useNavigate()
  const { lang, localePath } = useLang()
  const { cacheResult } = useResults()
  const { setProgress } = useProgress()
  
  // UI 텍스트 가져오기 (언어별)
  const uiText = UI_TEXT[lang] || UI_TEXT.en
  
  const [stage, setStage] = useState(1)
  const [mainAnswers, setMainAnswers] = useState({})
  const [bonusAnswers, setBonusAnswers] = useState({})
  const [petName, setPetName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const questionRefs = useRef([])

  // 최초 컴포넌트 마운트 시 test_start 이벤트 발행
  useEffect(() => {
    trackEvent('test_start', { stage: 1, lang })
  }, [])

  // ✅ 언어 변경 시 테스트 상태 초기화
  useEffect(() => {
    // 언어가 변경되면 테스트를 처음부터 다시 시작
    setStage(1)
    setMainAnswers({})
    setBonusAnswers({})
    setPetName('')
    setIsSubmitting(false)
    questionRefs.current = []
    // 스크롤 최상단으로
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [lang])

  // 직접 데이터 사용 (로컬 파일에서 즉시 로드)
  const questions = DOG_QUESTIONS[lang] || DOG_QUESTIONS.en
  const loading = false
  const error = null

  // 스테이지 변경 시 스크롤 최상단으로
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    questionRefs.current = []
  }, [stage])

  // 현재 스테이지에 맞는 질문 및 답변 데이터 (안전한 기본값 설정)
  const currentQuestions = stage === 1 ? (questions?.stage1 || []) : (questions?.stage2 || [])
  const currentAnswers = stage === 1 ? mainAnswers : bonusAnswers
  const setCurrentAnswers = stage === 1 ? setMainAnswers : setBonusAnswers
  const currentImageConfig = stage === 1 ? stage1ImageConfig : stage2ImageConfig

  // 안전한 길이 계산 (Optional Chaining)
  const totalQuestions = (questions?.stage1?.length || 0) + (questions?.stage2?.length || 0)
  const totalAnswered = Object.keys(mainAnswers).length + Object.keys(bonusAnswers).length
  const allAnswered = currentQuestions.length > 0 && Object.keys(currentAnswers).length === currentQuestions.length
  
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
    const stepNumber = stage === 1 ? questionIndex + 1 : 20 + questionIndex + 1
    trackEvent('question_answer', {
      step_number: stepNumber,
      stage: stage,
      question_index: questionIndex + 1,
      option_value: value,
      lang: lang
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

  const handleNext = () => {
    if (allAnswered && stage === 1) {
      trackEvent('stage1_complete', {
        lang,
        completed_questions: 20
      })
      trackEvent('test_start', { stage: 2, lang })
      setStage(2)
    }
  }

  const handleSeeResults = async () => {
    if (!allAnswered || stage !== 2 || !petName.trim() || isSubmitting) return

    trackEvent('test_submit', { lang })
    setIsSubmitting(true)
    
    try {
      // 클라이언트 전용 즉시 MBTI 계산 (서버 없이 0.001초 계산)
      const resultData = calculateMbti({
        petName: petName.trim(),
        mainAnswers,
        bonusAnswers,
        locale: lang
      })

      const resultId = resultData.result_id || resultData.resultId

      // 결과를 캐시에 저장 (sessionStorage 및 ResultsContext)
      cacheResult(resultId, resultData)

      // 백엔드가 동작하는 환경일 경우 백그라운드 백업 전달 시도 (실패 시 무시)
      try {
        axios.post(`${API_BASE_URL}/api/calculate`, {
          petName: petName.trim(),
          mainAnswers,
          bonusAnswers,
          locale: lang
        }).catch(() => {})
      } catch (e) {}

      // 결과 페이지로 즉시 이동
      navigate(`/result/${resultId}`)
    } catch (error) {
      console.error('결과 계산 중 오류:', error)
      alert('결과 계산 중 오류가 발생했습니다. 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }

  const canSeeResults = allAnswered && petName.trim().length > 0 && !isSubmitting

  const getQuestionNumber = (index) => {
    return stage === 1 ? index + 1 : questions.stage1.length + index + 1
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

  return (
    <main className="flex-grow bg-[#F9FBF9] min-h-screen">
      
      {/* ========== 인트로 헤더 (컴팩트하게 배치하여 첫 번째 문제가 첫 화면에 즉시 노출되도록 구현) ========== */}
      {stage === 1 && Object.keys(mainAnswers).length === 0 && (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#fff8e1] to-[#F9FBF9] pt-4 pb-3 md:pt-6 md:pb-4 border-b border-orange-100/60 shadow-xs">
          {/* 배경 장식 */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-orange-200/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 max-w-[800px] mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                {/* 메인 타이틀 */}
                <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-primary leading-tight tracking-tight">
                  {lang === 'jp' ? (
                    <>愛犬の<span className="text-orange-500">本当の性格</span>を発見</>
                  ) : (
                    <>Discover Your Dog's <span className="text-orange-500">True Personality</span></>
                  )}
                </h1>

                {/* 서브문구 & 뱃지 (AI Powered 문구 제거) */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-xs sm:text-sm text-primary/70 font-medium">
                    {lang === 'jp' ? '3分でわかる性格診断' : '3-min personality assessment'}
                  </span>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white rounded-full text-xs font-semibold text-primary border border-orange-200 shadow-2xs">
                    <span className="material-symbols-outlined text-orange-500 text-xs">quiz</span>
                    <span>{lang === 'jp' ? '25の質問' : '25 Questions'}</span>
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
      )}

      {/* ========== 기존 테스트 영역 ========== */}
      <div className="px-4 md:px-20 lg:px-40 py-3 md:py-6">
        <div className="max-w-[800px] mx-auto">
          
          {/* 진행 상황 (인트로 지나면 표시) */}
          {(stage !== 1 || Object.keys(mainAnswers).length > 0) && (
            <div className="flex justify-end mb-4">
              <span className="text-primary/60 text-xs md:text-sm font-medium">
                {totalAnswered} / {totalQuestions} {lang === 'jp' ? '回答済み' : 'Answered'}
              </span>
            </div>
          )}
          
          {/* 기존 스테이지 헤더 (인트로 후에만 간략하게) */}
          {(stage !== 1 || Object.keys(mainAnswers).length > 0) && (
            <div className="mb-6 md:mb-8">
              <h2 className="text-primary text-xl md:text-2xl font-display font-bold leading-tight tracking-tight mb-2">
                {stage === 1 ? uiText.stage1.title : uiText.stage2.title}
              </h2>
              {stage === 2 && (
                <div className="mt-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/20 rounded-full">
                    <span className="material-symbols-outlined text-accent text-sm">favorite</span>
                    <span className="text-accent font-medium text-xs">{uiText.stage2.badge}</span>
                  </span>
                </div>
              )}
            </div>
          )}

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

          <div className="pt-8 md:pt-10 pb-8 flex justify-end">
            {stage === 1 ? (
              <button
                onClick={handleNext}
                disabled={!allAnswered}
                className={`
                  w-full md:w-auto group px-8 py-4 font-display text-lg font-bold rounded-xl transition-all flex items-center justify-center gap-2
                  ${allAnswered 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg hover:shadow-xl cursor-pointer' 
                    : 'bg-accent text-primary cursor-not-allowed shadow-lg opacity-60'
                  }
                `}
              >
                <span>{uiText.buttons.next}</span>
                <span className={`material-symbols-outlined transform transition-transform ${allAnswered ? 'group-hover:translate-x-1' : ''}`}>
                  arrow_forward
                </span>
              </button>
            ) : (
              <div className="w-full flex flex-col items-center gap-6">
                <div className="w-full max-w-md">
                  <label className="block text-primary text-base md:text-lg font-medium mb-3 text-center">
                    {uiText.petName.label}
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder={uiText.petName.placeholder}
                    className="w-full px-6 py-4 text-base md:text-lg rounded-xl border-2 border-primary/20 bg-white text-primary placeholder-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center font-medium"
                  />
                </div>

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
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default PersonalityTest
