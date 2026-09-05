import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useResults } from '../contexts/ResultsContext'
import { useSaveAsImage } from '../hooks/useSaveAsImage'
import { trackEvent } from '../utils/gtm'

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
      title: "Something went wrong",
      tryAgain: "Try Again",
      noData: "Result data not found.",
      languageMismatch: "This result was taken in another language.",
      viewInOriginal: "View in Original Language"
    },
    petName: {
      subtitle: "Your beloved companion"
    },
    sections: {
      coreTraits: "Core Traits",
      dailyLife: "Daily Life With You"
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
    petName: {
      subtitle: "あなたの愛するパートナー"
    },
    sections: {
      coreTraits: "コア特性",
      dailyLife: "あなたとの日常生活"
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

function PersonalityTestResult() {
  const { resultId } = useParams()
  const navigate = useNavigate()
  const { lang, localePath } = useLang()
  const { fetchResult, getResult, isLoading, getError } = useResults()
  
  // 이미지 로드 상태 관리
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)
  
  // 이미지 저장 기능
  const { fullPageRef, isSaving, saveMode, saveAsFullPage } = useSaveAsImage()
  const [saveToast, setSaveToast] = useState(null)
  
  // 결과 저장 CTA 문구 A/B 분기 (50:50 세션 고정)
  const [saveCtaVariant] = useState(() => (Math.random() < 0.5 ? 'A' : 'B'))
  const hasTrackedCtaVariant = useRef(false)
  
  // 언어 불일치 상태
  const [languageMismatch, setLanguageMismatch] = useState(false)

  // Context에서 결과 가져오기
  useEffect(() => {
    if (resultId) {
      const cached = getResult(resultId)
      if (!cached) {
        fetchResult(resultId, false)
      }
    }
  }, [resultId, getResult, fetchResult])

  // Context에서 데이터 읽기
  const resultData = getResult(resultId)
  const loading = isLoading(resultId)
  const error = getError(resultId)
  
  // 언어 불일치 체크
  useEffect(() => {
    if (resultData) {
      const originalLang = resultData.locale || resultData.lang
      if (originalLang && lang !== originalLang) {
        setLanguageMismatch(true)
      } else {
        setLanguageMismatch(false)
      }

      trackEvent('result_view', {
        result_id: resultId,
        archetype_id: resultData.archetype?.id || resultData.archetype?.image_id,
        lang: lang
      })
    }
  }, [resultData, lang, resultId])

  // 📌 2. CTA 변형(A/B) 노출 이벤트 트래킹 (전환율 분모 데이터)
  useEffect(() => {
    if (resultData && saveCtaVariant && !hasTrackedCtaVariant.current) {
      hasTrackedCtaVariant.current = true
      trackEvent('cta_variant_shown', {
        lang,
        cta_variant: saveCtaVariant
      })
    }
  }, [resultData, lang, saveCtaVariant])
  
  // 이미지 경로 설정
  useEffect(() => {
    if (resultData?.archetype?.image_id) {
      const imageId = resultData.archetype.image_id
      const extensions = ['.png', '.jpg', '.jpeg', '.webp']
      setImageSrc(`/images/archetypes/${imageId}${extensions[0]}`)
      setImageError(false)
    } else {
      setImageSrc(null)
      setImageError(true)
    }
  }, [resultData])

  // 언어별 텍스트 추출 헬퍼 함수
  const getLocalizedText = useCallback((textObj) => {
    if (!textObj) return ''
    if (typeof textObj === 'string') return textObj
    return textObj[lang] || textObj.en || textObj.ko || ''
  }, [lang])

  // 공유용 URL 생성 헬퍼 (홈 경로 기준 + UTM 파라미터 자동 포함)
  const getShareUrl = useCallback(() => {
    try {
      const homePath = localePath('/')
      const baseUrl = `${window.location.origin}${homePath}`
      const url = new URL(baseUrl)
      url.searchParams.set('utm_source', 'user_share')
      url.searchParams.set('utm_medium', 'viral')
      return url.toString()
    } catch {
      const homePath = localePath('/')
      const baseUrl = `${window.location.origin}${homePath}`
      return `${baseUrl}?utm_source=user_share&utm_medium=viral`
    }
  }, [localePath])

  // 클립보드 링크 복사 핸들러
  const handleCopyLink = useCallback(async () => {
    const shareUrl = getShareUrl()
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      trackEvent('share_click', { share_type: 'copy_link', method: 'copy_link', lang })
      setSaveToast('copied')
      setTimeout(() => setSaveToast(null), 3000)
    } catch (err) {
      console.error('링크 복사 실패:', err)
    }
  }, [getShareUrl, lang])

  // 네이티브 공유 핸들러
  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const shareUrl = getShareUrl()
        const shareTitle = lang === 'jp' ? 'ペット性格診断テスト' : 'Pet Personality Test'
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        })
        trackEvent('share_click', { share_type: 'native_share', method: 'native_share', lang })
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('공유 실패:', err)
        }
      }
    } else {
      handleCopyLink()
    }
  }, [lang, getShareUrl, handleCopyLink])

  // 전체 결과 이미지 저장 함수
  const handleSaveFullPage = useCallback(async () => {
    trackEvent('save_image', {
      save_type: 'full',
      mode: 'full_page',
      lang,
      cta_variant: saveCtaVariant
    })
    const success = await saveAsFullPage()
    if (success) {
      setSaveToast('saved')
      setTimeout(() => setSaveToast(null), 3000)
    }
  }, [saveAsFullPage, lang, saveCtaVariant])

  // 둘째 강아지 테스트 핸들러
  const handleSecondPetTest = useCallback(() => {
    trackEvent('second_pet_click', {
      lang,
      source_screen: 'result_page'
    })
    navigate(localePath('/'))
  }, [lang, localePath, navigate])

  // UI 텍스트 선택
  const uiText = UI_TEXT[lang] || UI_TEXT.en

  // 데이터 추출
  const petName = resultData?.pet_name || resultData?.petName || ''
  const displayPetName = petName ? (petName.charAt(0).toUpperCase() + petName.slice(1)) : 'Pet'
  const archetype = resultData?.archetype || {}
  const alias = getLocalizedText(archetype.alias)
  const summary = getLocalizedText(archetype.summary)
  const mbti_code = resultData?.mbti_code || resultData?.mbtiCode || ''
  const stats = resultData?.stats || {}
  const statsLabels = archetype.statsLabels || {}
  const coreTraits = archetype.coreTraits || []
  const dailyLife = archetype.dailyLife || []

  // 스탯 값 추출 헬퍼 함수
  const getStatValue = (key) => {
    if (stats[key] !== undefined && stats[key] !== null) {
      return stats[key]
    }
    return 50
  }

  // 로딩 상태
  if (loading) {
    return <LoadingScreen lang={lang} />
  }

  // 에러 상태
  if (error) {
    return (
      <ErrorScreen
        message={error}
        onRetry={() => fetchResult(resultId, true)}
        lang={lang}
      />
    )
  }

  // 언어 불일치 에러 화면
  if (languageMismatch && resultData) {
    const originalLang = resultData.locale || resultData.lang
    return (
      <LanguageMismatchScreen
        originalLang={originalLang}
        currentLang={lang}
        onViewOriginal={() => {
          window.location.href = `/${originalLang}/result/${resultId}`
        }}
      />
    )
  }

  // 데이터 없음 상태
  if (!resultData) {
    return (
      <ErrorScreen
        message={uiText.error.noData}
        onRetry={() => fetchResult(resultId, true)}
        lang={lang}
      />
    )
  }

  return (
    <>
      <main className="min-h-screen text-[#2D3436] bg-[#F9FBF9]">
        <div className="max-w-5xl mx-auto px-4 py-2 md:px-6 md:py-12">
          {/* Main Result Card */}
          <div className="bg-white shadow-sm border border-primary/5 overflow-hidden rounded-xl mb-4 md:mb-12 md:rounded-[2rem]">
            {/* Header: Name & Share (데스크탑) */}
            <div className="hidden md:flex md:flex-row md:items-center justify-between border-b border-gray-50 p-4 gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="material-symbols-outlined text-primary text-xl md:text-2xl">pets</span>
                <div>
                  <h1 className="text-xl md:text-2xl font-display font-bold text-primary tracking-tight leading-none">
                    {displayPetName}
                  </h1>
                  <p className="text-xs text-primary/60 font-medium mt-0.5">{uiText.petName.subtitle}</p>
                </div>
              </div>

              {/* Share Buttons */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <div className="flex gap-2 justify-center md:justify-end share-btn-group">
                  <button 
                    onClick={handleNativeShare}
                    className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary hover:bg-gray-50 transition-all"
                    title={lang === 'jp' ? '共有' : 'Share'}
                  >
                    <span className="material-symbols-outlined text-lg">share</span>
                  </button>
                </div>
              )}
            </div>

            {/* 메인 이미지 & 유형 뱃지 */}
            <div className="p-6 md:p-10 relative flex flex-col items-center">
              {/* 모바일 뷰 */}
              <div className="w-full md:hidden flex flex-col items-center">
                <div className="flex flex-col w-full mb-6">
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <div className="flex justify-end gap-2 w-full mb-1 px-1 share-btn-group">
                      <button 
                        onClick={handleNativeShare}
                        className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary hover:bg-gray-50 transition-all shadow-md"
                        title={lang === 'jp' ? '共有' : 'Share'}
                      >
                        <span className="material-symbols-outlined text-lg">share</span>
                      </button>
                    </div>
                  )}
                  
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

                {/* Hero Image Area */}
                <div className="relative w-80 h-80 mb-6">
                  <div className="absolute inset-8 bg-secondary/5 rounded-full blur-2xl"></div>
                  {imageSrc && !imageError ? (
                    <img 
                      src={imageSrc}
                      alt={alias || mbti_code || 'Pet Archetype'}
                      className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                      onError={() => {
                        const imageId = archetype?.image_id
                        if (imageId) {
                          const extensions = ['.png', '.jpg', '.jpeg', '.webp']
                          const currentExt = extensions.find(ext => imageSrc.endsWith(ext))
                          if (currentExt) {
                            const currentIndex = extensions.indexOf(currentExt)
                            if (currentIndex < extensions.length - 1) {
                              setImageSrc(`/images/archetypes/${imageId}${extensions[currentIndex + 1]}`)
                              return
                            }
                          }
                        }
                        setImageError(true)
                      }}
                      onLoad={() => setImageError(false)}
                    />
                  ) : null}
                  
                  {(!imageSrc || imageError) && (
                    <div className="relative z-10 w-full h-full bg-secondary/30 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-9xl">pets</span>
                    </div>
                  )}
                </div>

                {/* Title Area */}
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

                {/* Stats Area */}
                <div className="w-full bg-gray-50 rounded-2xl p-5 space-y-3">
                  {STATS_ORDER.map(({ key, color }) => {
                    const value = getStatValue(key)
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

              {/* 데스크탑 뷰 */}
              <div className="hidden md:block w-full">
                <div className="flex flex-row items-center justify-center gap-8 mb-2">
                  <div className="relative w-[28rem] h-[28rem] flex-shrink-0">
                    <div className="absolute inset-8 bg-secondary/5 rounded-full blur-2xl"></div>
                    {imageSrc && !imageError ? (
                      <img 
                        src={imageSrc}
                        alt={alias || mbti_code || 'Pet Archetype'}
                        className="relative z-10 w-full h-full object-contain drop-shadow-2xl transform scale-110 origin-center"
                        onError={() => {
                          const imageId = archetype?.image_id
                          if (imageId) {
                            const extensions = ['.png', '.jpg', '.jpeg', '.webp']
                            const currentExt = extensions.find(ext => imageSrc.endsWith(ext))
                            if (currentExt) {
                              const currentIndex = extensions.indexOf(currentExt)
                              if (currentIndex < extensions.length - 1) {
                                setImageSrc(`/images/archetypes/${imageId}${extensions[currentIndex + 1]}`)
                                return
                              }
                            }
                          }
                          setImageError(true)
                        }}
                        onLoad={() => setImageError(false)}
                      />
                    ) : null}
                    
                    {(!imageSrc || imageError) && (
                      <div className="relative z-10 w-full h-full bg-secondary/30 rounded-full flex items-center justify-center transform scale-110 origin-center">
                        <span className="material-symbols-outlined text-primary text-[14rem]">pets</span>
                      </div>
                    )}
                  </div>

                  <div className="w-1/2 space-y-3 z-20">
                    {STATS_ORDER.map(({ key, color }) => {
                      const value = getStatValue(key)
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
          </div>

          {/* 전체 결과 캡처 영역 */}
          <div ref={fullPageRef} style={{ background: '#F9FBF9' }}>
            {/* Core Traits */}
            {coreTraits.length > 0 && (
              <div className="space-y-4 md:space-y-12 mb-6 md:mb-16">
                <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-8">
                  <h2 className="text-xl md:text-3xl font-display font-bold text-primary">{uiText.sections.coreTraits}</h2>
                  <div className="flex-grow h-[1px] bg-primary/10"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  {coreTraits.map((trait, index) => (
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
                  {dailyLife.map((item, index) => (
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
          </div>

          {/* 하단 액션 버튼 그룹 (이미지 저장, 공유하기 & 둘째 강아지 테스트) */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-8 md:mb-12">
            {/* 결과 이미지 저장 (보조 버튼 - 아웃라인 스타일, A/B 테스트 적용) */}
            <button
              onClick={handleSaveFullPage}
              disabled={isSaving}
              className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full border-2 text-base font-bold transition-all active:scale-95 cursor-pointer
                ${isSaving && saveMode === 'full'
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-wait'
                  : 'bg-white border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 shadow-sm hover:shadow-md'
                }`}
            >
              <span className="material-symbols-outlined text-xl">
                {isSaving && saveMode === 'full' ? 'hourglass_empty' : 'download'}
              </span>
              {isSaving && saveMode === 'full'
                ? (lang === 'jp' ? '保存中...' : (lang === 'ko' ? '저장 중...' : 'Saving...'))
                : (saveCtaVariant === 'B'
                  ? (lang === 'jp' ? 'インスタカードを入手' : (lang === 'ko' ? '인스타 카드 받기' : 'Get Instagram Card'))
                  : (lang === 'jp' ? '結果を画像で保存' : (lang === 'ko' ? '결과 이미지 저장' : 'Save Result Card'))
                )
              }
            </button>

            {/* 테스트 공유하기 (보조 버튼 - 아웃라인 스타일) */}
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border-2 bg-white border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 text-base font-bold shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">share</span>
              {lang === 'jp' ? 'テストを共有' : (lang === 'ko' ? '테스트 공유하기' : 'Share Test')}
            </button>

            {/* 둘째 강아지 테스트하기 (메인 강조 CTA - 솔리드 에메랄드 스타일) */}
            <button
              onClick={handleSecondPetTest}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-base font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">pets</span>
              {lang === 'jp' ? '2匹目の愛犬をテスト' : (lang === 'ko' ? '둘째 강아지 테스트하기' : 'Test for Another Pet')}
            </button>
          </div>
        </div>
      </main>

      {/* 토스트 메시지 */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 
          bg-primary text-white px-6 py-3 rounded-full shadow-lg
          flex items-center gap-2 animate-fade-in text-sm font-medium">
          <span className="material-symbols-outlined text-lg">
            {saveToast === 'shared' ? 'share' : (saveToast === 'copied' ? 'content_copy' : 'check_circle')}
          </span>
          {saveToast === 'shared'
            ? (lang === 'jp' ? '共有しました！' : 'Shared!')
            : (saveToast === 'copied'
              ? (lang === 'jp' ? 'リンクをコピーしました！' : (lang === 'ko' ? '링크가 복사되었습니다!' : 'Link copied!'))
              : (lang === 'jp' ? '画像を保存しました！' : (lang === 'ko' ? '이미지가 저장되었습니다!' : 'Image saved!')))}
        </div>
      )}
    </>
  )
}

export default PersonalityTestResult
