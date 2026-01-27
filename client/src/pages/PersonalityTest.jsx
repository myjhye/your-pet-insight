import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import TestNavbar from '../components/TestNavbar'
import QuestionCard from '../components/QuestionCard'

// 1-20번 기본 질문
const mainQuestions = [
  "My dog follows me everywhere I go in the house.",
  "My dog has no hesitation walking up to strangers and making contact.",
  "Around other dogs, my dog is often the one who kicks off the playtime.",
  "Even in loud, busy environments, my dog stays lively and doesn't try to hide.",
  "My dog barks at strangers passing by the house.",
  "My dog enjoys car rides and doesn't get motion sick.",
  "My dog gets anxious when left alone for more than an hour.",
  "My dog quickly adapts to new environments or routines.",
  "My dog is protective of their food or toys around other animals.",
  "My dog seeks physical affection like cuddles or belly rubs frequently.",
  "My dog is easily distracted during training sessions.",
  "My dog shows excitement when meeting new people.",
  "My dog prefers to sleep close to family members.",
  "My dog is cautious when exploring new places.",
  "My dog responds well to verbal commands.",
  "My dog shows signs of jealousy when attention is given to others.",
  "My dog enjoys playing with interactive toys.",
  "My dog is calm during thunderstorms or fireworks.",
  "My dog has a consistent daily routine they prefer.",
  "My dog is comfortable being handled by the vet or groomer.",
]

// 21-25번 랜덤 보너스 질문 풀
const bonusQuestionPool = [
  "My dog gets excited when I pick up the leash.",
  "My dog remembers where treats are hidden.",
  "My dog prefers one family member over others.",
  "My dog reacts to their name being called.",
  "My dog brings toys to initiate play.",
  "My dog watches TV or reacts to sounds from it.",
  "My dog seems to understand my mood.",
  "My dog greets visitors at the door.",
  "My dog follows a command the first time it's given.",
  "My dog enjoys being groomed or brushed.",
  "My dog sleeps in the same spot every night.",
  "My dog gets along well with cats or other animals.",
  "My dog shows fear of specific objects or sounds.",
  "My dog enjoys swimming or playing in water.",
  "My dog pulls on the leash during walks.",
]

// 배열을 섞는 함수
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function PersonalityTest() {
  const navigate = useNavigate()
  const [stage, setStage] = useState(1) // 1: 메인 질문, 2: 보너스 질문
  const [mainAnswers, setMainAnswers] = useState({})
  const [bonusAnswers, setBonusAnswers] = useState({})
  const questionRefs = useRef([])
  
  // 랜덤 보너스 질문 5개 선택 (컴포넌트 마운트 시 한 번만)
  const bonusQuestions = useMemo(() => {
    return shuffleArray(bonusQuestionPool).slice(0, 5)
  }, [])

  const currentQuestions = stage === 1 ? mainQuestions : bonusQuestions
  const currentAnswers = stage === 1 ? mainAnswers : bonusAnswers
  const setCurrentAnswers = stage === 1 ? setMainAnswers : setBonusAnswers
  
  const answeredCount = Object.keys(currentAnswers).length
  const allAnswered = answeredCount === currentQuestions.length
  const totalQuestions = mainQuestions.length + bonusQuestions.length
  const totalAnswered = Object.keys(mainAnswers).length + Object.keys(bonusAnswers).length

  // 다음 답변할 질문 인덱스 계산
  const getNextUnansweredIndex = () => {
    for (let i = 0; i < currentQuestions.length; i++) {
      if (currentAnswers[i] === undefined) return i
    }
    return currentQuestions.length
  }

  const currentActiveIndex = getNextUnansweredIndex()

  // 스테이지 변경 시 스크롤 최상단으로
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    questionRefs.current = []
  }, [stage])

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

  const handleSeeResults = () => {
    if (allAnswered && stage === 2) {
      console.log('All answers:', { mainAnswers, bonusAnswers })
      // TODO: Navigate to results page
    }
  }

  const getQuestionNumber = (index) => {
    return stage === 1 ? index + 1 : mainQuestions.length + index + 1
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Fixed Header */}
      <header className="w-full px-8 py-4 flex justify-between items-center bg-primary/95 backdrop-blur-md border-b border-white/10 fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full border-2 border-secondary flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
              <span className="material-symbols-outlined text-secondary text-sm">pets</span>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">
              <span className="text-secondary font-light">Your</span> Pet Insight
            </span>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex space-x-6 text-sm font-medium text-secondary/80">
            <a className="hover:text-accent transition-colors" href="#">Methodology</a>
            <a className="hover:text-accent transition-colors" href="#">About Us</a>
            <a className="hover:text-accent transition-colors" href="#">Blog</a>
          </nav>
          <div className="relative group">
            <button className="flex items-center space-x-2 text-white hover:text-accent transition-colors text-sm font-medium">
              <span className="material-symbols-outlined text-xl">language</span>
              <span>English</span>
            </button>
          </div>
        </div>
        <div className="md:hidden">
          <button className="text-white hover:text-accent focus:outline-none p-1">
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <TestNavbar answered={totalAnswered} total={totalQuestions} />
      
      <main className="pt-36 pb-20 px-4 md:px-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center text-white mb-10 mt-4">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">
              {stage === 1 ? 'Personality Assessment' : 'Bonus Questions'}
            </h1>
            <p className="text-secondary text-lg opacity-90 font-light tracking-wide">
              {stage === 1 
                ? 'Answer each question in order to complete the assessment.'
                : 'Almost done! Just 5 more questions.'
              }
            </p>
            {stage === 2 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full">
                <span className="material-symbols-outlined text-accent">stars</span>
                <span className="text-accent font-medium text-sm">Random Bonus Round</span>
              </div>
            )}
          </div>

          {/* Questions */}
          {currentQuestions.map((question, index) => {
            const isDisabled = index > currentActiveIndex

            return (
              <QuestionCard
                key={`${stage}-${index}`}
                ref={el => questionRefs.current[index] = el}
                number={getQuestionNumber(index)}
                question={question}
                value={currentAnswers[index]}
                onChange={(value) => handleAnswer(index, value)}
                disabled={isDisabled}
              />
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
              <div className="w-full flex justify-center">
                <button
                  onClick={handleSeeResults}
                  disabled={!allAnswered}
                  className={`
                    group px-16 py-6 font-display text-xl font-bold rounded-2xl transition-all flex items-center gap-3
                    ${allAnswered 
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg hover:shadow-xl cursor-pointer' 
                      : 'bg-accent text-primary cursor-not-allowed shadow-lg opacity-60'
                    }
                  `}
                >
                  <span>See Results</span>
                  <span className={`material-symbols-outlined text-2xl transform transition-transform ${allAnswered ? 'group-hover:translate-x-1' : ''}`}>
                    celebration
                  </span>
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
