import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../contexts/LanguageContext'
import { useResults } from '../contexts/ResultsContext'
import { useProgress } from '../contexts/ProgressContext'
import { DOG_QUESTIONS } from '../data/dogQuestions'
import QuestionCard from '../components/QuestionCard'
import QuestionWithSideImage from '../components/TestSideImages'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const questionRefs = useRef([])

  // ✅ 언어 변경 시 테스트 상태 초기화
  useEffect(() => {
    // 언어가 변경되면 테스트를 처음부터 다시 시작
    setStage(1)
    setMainAnswers({})
    setBonusAnswers({})
    setPetName('')
    setIsSubmitting(false)
    setAgreedToTerms(false)
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
      setStage(2)
    }
  }

  const handleSeeResults = async () => {
    if (!allAnswered || stage !== 2 || !petName.trim() || !agreedToTerms || isSubmitting) return

    setIsSubmitting(true)
    
    try {
      // 백엔드 /api/calculate 호출
      const response = await axios.post(`${API_BASE_URL}/api/calculate`, {
        petName: petName.trim(),
        mainAnswers,
        bonusAnswers,
        locale: lang
      })

      const { resultId, ...resultData } = response.data

      // 결과를 캐시에 저장 (결과 페이지에서 API 재호출 방지)
      cacheResult(resultId, {
        result_id: resultId,
        pet_name: petName.trim(),
        locale: lang,
        ...resultData
      })

      // 결과 페이지로 이동 (UUID 포함)
      navigate(`/result/${resultId}`)
    } catch (error) {
      console.error('결과 계산 중 오류:', error)
      alert('결과 계산 중 오류가 발생했습니다. 다시 시도해주세요.')
      setIsSubmitting(false)
    }
  }

  const canSeeResults = allAnswered && petName.trim().length > 0 && agreedToTerms && !isSubmitting

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
      
      {/* ========== 인트로 섹션 (테스트 시작 전에만 표시) ========== */}
      {stage === 1 && Object.keys(mainAnswers).length === 0 && (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#fff8e1] to-[#F9FBF9] pt-8 pb-12 md:pt-12 md:pb-16">
          {/* 배경 장식 */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6">
            {/* 강아지 이미지들 */}
            <div className="flex justify-center gap-2 md:gap-4 mb-6 md:mb-8">
              <img 
                src="/images/dog/1.png" 
                alt="Dog 1" 
                className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-lg animate-bounce"
                style={{ animationDelay: '0ms', animationDuration: '2s' }}
              />
              <img 
                src="/images/dog/2.png" 
                alt="Dog 2" 
                className="w-20 h-20 md:w-32 md:h-32 object-contain drop-shadow-xl"
              />
              <img 
                src="/images/dog/3.png" 
                alt="Dog 3" 
                className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-lg animate-bounce"
                style={{ animationDelay: '500ms', animationDuration: '2s' }}
              />
            </div>
            
            {/* 메인 타이틀 */}
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-3xl md:text-5xl font-display font-black text-primary mb-3 md:mb-4 leading-tight">
                {lang === 'jp' ? (
                  <>愛犬の<span className="text-orange-500">本当の性格</span>を発見</>
                ) : (
                  <>Discover Your Dog's <span className="text-orange-500">True Personality</span></>
                )}
              </h1>
              <p className="text-primary/70 text-base md:text-xl font-medium">
                {lang === 'jp' 
                  ? '3分で愛犬の性格タイプがわかります' 
                  : 'Find out their personality type in just 3 minutes'}
              </p>
            </div>
            
            {/* 특징 뱃지들 */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 md:mb-10">
              <div className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white rounded-full shadow-sm border border-orange-100">
                <span className="material-symbols-outlined text-orange-500 text-lg md:text-xl">quiz</span>
                <span className="text-primary font-medium text-xs md:text-sm">
                  {lang === 'jp' ? '25の質問' : '25 Questions'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white rounded-full shadow-sm border border-orange-100">
                <span className="material-symbols-outlined text-orange-500 text-lg md:text-xl">pets</span>
                <span className="text-primary font-medium text-xs md:text-sm">
                  {lang === 'jp' ? '16の性格タイプ' : '16 Personality Types'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-white rounded-full shadow-sm border border-orange-100">
                <span className="material-symbols-outlined text-orange-500 text-lg md:text-xl">auto_awesome</span>
                <span className="text-primary font-medium text-xs md:text-sm">
                  {lang === 'jp' ? 'AI分析' : 'AI-Powered'}
                </span>
              </div>
            </div>
            
            {/* 시작 안내 */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-primary/60 text-sm md:text-base">
                <span className="material-symbols-outlined animate-bounce">arrow_downward</span>
                <span>{lang === 'jp' ? '下にスクロールして開始' : 'Scroll down to start'}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========== 기존 테스트 영역 ========== */}
      <div className="px-4 md:px-20 lg:px-40 py-6 md:py-8">
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

                {/* Terms 동의 체크박스 */}
                <label className="flex items-start gap-3 cursor-pointer mt-2 mb-2 select-none max-w-md">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/50 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-xs text-primary/60 leading-relaxed">
                    {lang === 'jp' ? (
                      <>
                        <Link to="/terms" className="underline hover:text-primary" target="_blank">利用規約</Link>
                        と
                        <Link to="/privacy" className="underline hover:text-primary" target="_blank">プライバシーポリシー</Link>
                        に同意します。テスト回答データは30日後に自動削除されます。
                      </>
                    ) : (
                      <>
                        I agree to the{' '}
                        <Link to="/terms" className="underline hover:text-primary" target="_blank">Terms of Service</Link>
                        {' '}and{' '}
                        <Link to="/privacy" className="underline hover:text-primary" target="_blank">Privacy Policy</Link>.
                        {' '}Test data is automatically deleted after 30 days.
                      </>
                    )}
                  </span>
                </label>

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
