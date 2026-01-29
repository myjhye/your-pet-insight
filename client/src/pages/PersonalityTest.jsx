import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../contexts/LanguageContext'
import { useQuestions } from '../contexts/QuestionsContext'
import TestNavbar from '../components/TestNavbar'
import QuestionCard from '../components/QuestionCard'
import QuestionWithSideImage from '../components/TestSideImages'

const API_BASE_URL = 'http://localhost:8000'

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

function PersonalityTest() {
  const navigate = useNavigate()
  const { lang, localePath } = useLang()
  const { fetchQuestions, getQuestions, isLoading, getError } = useQuestions()
  
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

      const { resultId } = response.data

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

  // 로딩 화면 (데이터가 아직 없을 때도 포함)
  if (loading || !questions?.stage1?.length) {
    return (
      <div className="min-h-screen bg-[#F9FBF9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary/60 font-medium">Loading Questions...</p>
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
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9FBF9]">
      {/* Progress Bar */}
      <TestNavbar answered={totalAnswered} total={totalQuestions} />
      
      <main className="pt-16 pb-20 px-4 md:px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center mb-10 mt-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 text-primary">
              {stage === 1 ? 'Personality Assessment' : 'Owner Connection'}
            </h1>
            <p className="text-primary/60 text-lg font-light tracking-wide">
              {stage === 1 
                ? 'Answer each question in order to complete the assessment.'
                : 'Almost done! Just 5 more questions about you.'
              }
            </p>
            {stage === 2 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full">
                <span className="material-symbols-outlined text-accent">favorite</span>
                <span className="text-accent font-medium text-sm">Owner Connection Round</span>
              </div>
            )}
          </div>

          {/* Questions */}
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
                />
              </QuestionWithSideImage>
            )
          })}

          {/* Button */}
          <div className="pt-8 pb-12 flex justify-end">
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
                <span>Next</span>
                <span className={`material-symbols-outlined transform transition-transform ${allAnswered ? 'group-hover:translate-x-1' : ''}`}>
                  arrow_forward
                </span>
              </button>
            ) : (
              <div className="w-full flex flex-col items-center gap-6">
                {/* Pet Name Input */}
                <div className="w-full max-w-md">
                  <label className="block text-primary text-lg font-medium mb-3 text-center">
                    🐾 What's your pet's name?
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="Enter your pet's name"
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
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span>See Results</span>
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
      </main>
    </div>
  )
}

export default PersonalityTest
