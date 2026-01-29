import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useLang } from '../contexts/LanguageContext'

const API_BASE_URL = 'http://localhost:8000'

// Stats별 색상 및 아이콘 매핑
const STATS_CONFIG = {
  sociability: { color: 'bg-red-500', icon: 'groups' },
  obedience: { color: 'bg-cyan-500', icon: 'volunteer_activism' },
  temperament: { color: 'bg-yellow-400', icon: 'mood' },
  emotionality: { color: 'bg-pink-500', icon: 'favorite' },
  sagacity: { color: 'bg-violet-500', icon: 'psychology' },
}

// 로딩 컴포넌트
function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#F9FBF9] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-primary font-display text-xl font-bold">Analyzing Results...</p>
        <p className="text-primary/60 mt-2">Creating your pet's personality profile</p>
      </div>
    </main>
  )
}

// 에러 컴포넌트
function ErrorScreen({ message, onRetry }) {
  return (
    <main className="min-h-screen bg-[#F9FBF9] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <span className="material-symbols-outlined text-7xl text-red-400 mb-6">error</span>
        <h2 className="text-2xl font-display font-bold text-primary mb-4">Oops! Something went wrong</h2>
        <p className="text-primary/60 mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  )
}

// Stats 막대 그래프 컴포넌트
function StatBar({ name, label, value, color }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm font-bold text-primary/60 uppercase tracking-wider">{name}</span>
        <span className="text-sm font-bold text-primary">{label}</span>
      </div>
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000`}
          style={{ width: `${Math.min(value, 100)}%` }}
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
  
  const [resultData, setResultData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // API에서 결과 데이터 가져오기
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await axios.get(`${API_BASE_URL}/api/results/${resultId}`)
        setResultData(response.data)
      } catch (err) {
        console.error('결과 조회 실패:', err)
        setError(err.response?.data?.detail || '결과를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (resultId) {
      fetchResult()
    }
  }, [resultId])

  // 로딩 중
  if (loading) {
    return <LoadingScreen />
  }

  // 에러 발생
  if (error) {
    return <ErrorScreen message={error} onRetry={() => window.location.reload()} />
  }

  // 데이터 없음
  if (!resultData) {
    return <ErrorScreen message="결과 데이터를 찾을 수 없습니다." onRetry={() => window.location.reload()} />
  }

  // 데이터 추출
  const { pet_name, stats, archetype, mbti_code } = resultData
  
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

  return (
    <main className="min-h-screen bg-[#F9FBF9] text-[#2D3436]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Main Result Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-primary/5 overflow-hidden mb-12">
          {/* 유형 뱃지 */}
          <div className="p-4 text-center border-b border-dashed border-gray-100">
            <span className="inline-block px-6 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-[0.2em] uppercase">
              {alias || mbti_code}
            </span>
          </div>

          {/* 메인 이미지 & 펫 이름 */}
          <div className="p-10 flex flex-col items-center">
            <div className="relative w-64 h-64 md:w-72 md:h-72 bg-secondary/20 rounded-full flex items-center justify-center mb-10">
              {archetype?.image_id ? (
                <img 
                  src={`/images/archetypes/${archetype.image_id}.png`}
                  alt={alias}
                  className="w-48 h-48 md:w-56 md:h-56 object-contain z-10"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div className={`w-48 h-48 md:w-56 md:h-56 bg-secondary/30 rounded-full items-center justify-center ${archetype?.image_id ? 'hidden' : 'flex'}`}>
                <span className="material-symbols-outlined text-primary text-8xl">pets</span>
              </div>
              <div className="absolute inset-0 border border-primary/10 rounded-full scale-110"></div>
              <div className="absolute inset-0 border border-dashed border-primary/20 rounded-full scale-125"></div>
            </div>
            
            <div className="text-center">
              <h2 className="text-5xl md:text-6xl font-display font-bold text-primary tracking-tight uppercase">
                {pet_name}
              </h2>
              {summary && (
                <p className="mt-4 text-primary/60 text-lg max-w-lg mx-auto">{summary}</p>
              )}
            </div>
          </div>

          {/* Stats 막대 그래프 */}
          <div className="px-10 pb-12 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {Object.entries(stats || {}).map(([key, value]) => {
              const config = STATS_CONFIG[key] || { color: 'bg-gray-400' }
              const label = getLocalizedText(statsLabels[key]) || key
              
              return (
                <div key={key} className={key === 'sagacity' ? 'md:col-span-2' : ''}>
                  <StatBar
                    name={key.charAt(0).toUpperCase() + key.slice(1)}
                    label={label}
                    value={value}
                    color={config.color}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Core Traits */}
        {coreTraits.length > 0 && (
          <div className="space-y-12 mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-display font-bold text-primary">Core Traits</h2>
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
              <h2 className="text-3xl font-display font-bold text-primary">Daily Life with You</h2>
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

        {/* Premium CTA */}
        <div className="relative bg-primary rounded-[2.5rem] p-10 md:p-16 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-[#2D5A47]/30 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <span className="material-symbols-outlined text-white text-6xl mb-6">workspace_premium</span>
            <h4 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">Go Beyond the Surface</h4>
            <p className="text-white/70 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
              Unlock the 25-page Premium Report to discover detailed training roadmaps, breed-specific insights, and scientific cognitive benchmarks.
            </p>
            <button className="bg-white hover:bg-gray-100 text-primary font-display font-bold text-xl py-5 px-14 rounded-full shadow-xl transition-all transform hover:-translate-y-1 active:scale-95">
              Get Premium Full Report
            </button>
            <div className="mt-8 flex items-center justify-center gap-2 text-white/40 text-sm">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>Join 50,000+ happy pet parents worldwide.</span>
            </div>
          </div>
        </div>

        {/* 결과 공유 (선택적) */}
        <div className="mt-12 text-center">
          <p className="text-primary/40 text-sm mb-4">Share your result</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-primary/10 rounded-full text-primary hover:bg-primary/5 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">link</span>
              <span className="font-medium">Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PersonalityTestResult
