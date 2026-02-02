import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../contexts/LanguageContext'
import { useQuestions } from '../contexts/QuestionsContext'
import { useResults } from '../contexts/ResultsContext'
import { useProgress } from '../contexts/ProgressContext'
import Breadcrumb from '../components/Breadcrumb'
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
    error: {
      retry: "Retry"
    },
    stage1: {
      title: "Personality Assessment",
      subtitle: "Answer each question in order to complete the assessment."
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
    error: {
      retry: "再試行"
    },
    stage1: {
      title: "性格評価",
      subtitle: "評価を完了するために、各質問に順番に答えてください。"
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
  const { fetchQuestions, getQuestions, isLoading, getError } = useQuestions()
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

  // Context에서 질문 가져오기 (캐시 활용, 현재 언어 기준)
  useEffect(() => {
    fetchQuestions(QUESTION_VERSION, lang)
  }, [fetchQuestions, lang])

  // Context에서 데이터 읽기 (버전 + 언어 조합)
  const questions = getQuestions(QUESTION_VERSION, lang) || { stage1: [], stage2: [] }
  const loading = isLoading(QUESTION_VERSION, lang)
  const error = getError(QUESTION_VERSION, lang)

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
    if (!allAnswered || stage !== 2 || !petName.trim() || isSubmitting) return

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
      navigate(localePath(`/dog-test/personality/result/${resultId}`))
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

  const breadcrumbItems = [
    { label: lang === 'jp' ? 'ホーム' : 'Home', href: '/' },
    { label: lang === 'jp' ? '犬テスト' : 'Dog Tests', href: '/dog-test' },
    { label: lang === 'jp' ? '性格テスト' : 'Personality Test' },
  ]

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
      <div className="px-6 md:px-20 lg:px-40 py-8">
        <div className="max-w-[800px] mx-auto">
          
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />
          
          {/* 진행 상태 텍스트 */}
          <div className="flex justify-end mb-4">
            <span className="text-primary/60 text-sm font-medium">
              {totalAnswered} / {totalQuestions} {lang === 'jp' ? '回答済み' : 'Answered'}
            </span>
          </div>
          
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-primary text-3xl md:text-4xl font-display font-extrabold leading-tight tracking-tight mb-2">
              {stage === 1 ? uiText.stage1.title : uiText.stage2.title}
            </h1>
            <p className="text-primary/60 text-base font-normal leading-normal">
              {stage === 1 ? uiText.stage1.subtitle : uiText.stage2.subtitle}
            </p>
            {stage === 2 && (
              <div className="mt-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full">
                  <span className="material-symbols-outlined text-accent">favorite</span>
                  <span className="text-accent font-medium text-sm">{uiText.stage2.badge}</span>
                </span>
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-6">
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

          {/* Button */}
          <div className="pt-10 pb-8 flex justify-end">
            {stage === 1 ? (
              <button
                onClick={handleNext}
                disabled={!allAnswered}
                className={`
                  group px-8 py-4 font-display text-lg font-bold rounded-xl transition-all flex items-center gap-2
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
                {/* Pet Name Input */}
                <div className="w-full max-w-md">
                  <label className="block text-primary text-lg font-medium mb-3 text-center">
                    {uiText.petName.label}
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder={uiText.petName.placeholder}
                    className="w-full px-6 py-4 text-lg rounded-xl border-2 border-primary/20 bg-white text-primary placeholder-primary/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center font-medium"
                  />
                </div>

                {/* See Results Button */}
                <button
                  onClick={handleSeeResults}
                  disabled={!canSeeResults || isSubmitting}
                  className={`
                    group px-16 py-6 font-display text-xl font-bold rounded-2xl transition-all flex items-center gap-3
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
