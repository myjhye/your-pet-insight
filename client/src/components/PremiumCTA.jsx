import { useState, useEffect } from 'react'

// Archetype 이미지 순환용 (16개 MBTI 유형)
const ARCHETYPE_IMAGES = [
  'dog_enfp_main',
  'dog_enfj_main',
  'dog_entp_main',
  'dog_entj_main',
  'dog_esfp_main',
  'dog_esfj_main',
  'dog_estp_main',
  'dog_estj_main',
  'dog_infp_main',
  'dog_infj_main',
  'dog_intp_main',
  'dog_intj_main',
  'dog_isfp_main',
  'dog_isfj_main',
  'dog_istp_main',
  'dog_istj_main',
]

// 다국어 텍스트
const CTA_TEXT = {
  en: {
    badge: "LIMITED TIME OFFER",
    title: "Unlock the Full Story",
    subtitle: "Discover everything about {name}'s unique personality",
    originalPrice: "$12.99",
    salePrice: "$5.99",
    discount: "54% OFF",
    bulletPoints: [
      { icon: "psychology", text: "Deep personality analysis & cognitive strengths" },
      { icon: "favorite", text: "Owner-pet chemistry & compatibility insights" },
      { icon: "school", text: "2-week personalized training roadmap" },
      { icon: "routine", text: "Custom daily routine & lifestyle guide" },
    ],
    cta: "Get Premium Report",
    viewReport: "View Premium Report",
    retry: "Try Again",
    ready: "Your report is ready!",
    guarantee: "Instant delivery • AI-powered analysis",
    generating: "Generating your report...",
    generatingSub: "This may take up to 30 seconds",
    failed: "Generation failed. Please try again.",
  },
  jp: {
    badge: "期間限定オファー",
    title: "完全なストーリーを解放",
    subtitle: "{name}のユニークな性格について全てを発見",
    originalPrice: "$12.99",
    salePrice: "$5.99",
    discount: "54% OFF",
    bulletPoints: [
      { icon: "psychology", text: "詳細な性格分析と認知的強み" },
      { icon: "favorite", text: "飼い主とペットの相性分析" },
      { icon: "school", text: "2週間のパーソナライズドトレーニング" },
      { icon: "routine", text: "カスタム日課とライフスタイルガイド" },
    ],
    cta: "プレミアムレポートを取得",
    viewReport: "プレミアムレポートを表示",
    retry: "再試行",
    ready: "レポートの準備ができました！",
    guarantee: "即時配信 • AI分析",
    generating: "レポートを生成中...",
    generatingSub: "最大30秒かかる場合があります",
    failed: "生成に失敗しました。もう一度お試しください。",
  }
}

function PremiumCTA({
  lang = 'en',
  petName = 'Pet',
  reportStatus,
  reportPages,
  isGeneratingReport,
  isStartingPayment,
  onGetReport,
  onViewReport,
  hookText,
  refundInitiated = false,
}) {
  const text = CTA_TEXT[lang] || CTA_TEXT.en
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // Archetype 이미지 슬라이드 (5초 간격)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsImageLoaded(false)
      setCurrentImageIndex(prev => (prev + 1) % ARCHETYPE_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const isReady = reportStatus === 'ready' && reportPages
  const isFailed = reportStatus === 'failed'

  const handleClick = () => {
    if (isReady) {
      onViewReport?.()
    } else {
      onGetReport?.()
    }
  }

  return (
    <div id="premium-cta" className="relative mt-8 mb-12">
      <div className="relative overflow-hidden rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-white/10">

        {/* ── Background ── */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a2a] via-[#2D5A47] to-[#1B4D3E]" />
        {/* Glow orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-300/8 rounded-full blur-3xl pointer-events-none" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* ── Content ── */}
        <div className="relative z-10 p-5 md:p-10 lg:p-12">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-center">

            {/* LEFT: Dog image carousel - 모바일 136px, 데스크탑 224px */}
            <div className="relative w-[136px] h-[136px] md:w-56 md:h-56 flex-shrink-0">
              {/* Glow behind image */}
              <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl scale-110" />
              {/* Rotating ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/15 animate-[spin_20s_linear_infinite]" />
              {/* Image container */}
              <div className="relative w-full h-full rounded-full overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 p-2 md:p-3">
                <img
                  src={`/images/archetypes/${ARCHETYPE_IMAGES[currentImageIndex]}.png`}
                  alt="Dog personality"
                  className={`w-full h-full object-contain drop-shadow-lg transition-all duration-700 scale-150 ${
                    isImageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setIsImageLoaded(true)}
                  onError={(e) => {
                    const currentSrc = e.target.src
                    if (currentSrc.endsWith('.png')) {
                      e.target.src = currentSrc.replace('.png', '.jpg')
                    } else if (currentSrc.endsWith('.jpg')) {
                      e.target.src = currentSrc.replace('.jpg', '.webp')
                    }
                  }}
                />
              </div>
              {/* Discount badge */}
              {!isReady && (
                <div className="absolute -top-1 -right-1">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white text-[11px] md:text-sm font-black px-2.5 py-1 md:px-3 md:py-1.5 rounded-full shadow-lg border border-red-400/30">
                      {text.discount}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Text & CTA */}
            <div className="flex-1 text-center md:text-left w-full">

              {/* Badge */}
              {!isReady && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/20 mb-3 md:mb-4">
                  <span className="material-symbols-outlined text-amber-400 text-sm">timer</span>
                  <span className="text-amber-300 text-[11px] md:text-xs font-bold tracking-wider uppercase">{text.badge}</span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-1.5 md:mb-2 leading-tight tracking-tight">
                {text.title}
              </h3>
              {hookText ? (
                <p className="text-emerald-300/90 text-xs md:text-sm leading-relaxed font-medium italic mb-4 md:mb-6 max-w-md mx-auto md:mx-0">
                  🔍 {hookText}
                </p>
              ) : (
                <p className="text-white/60 text-xs md:text-base mb-4 md:mb-6 max-w-md mx-auto md:mx-0">
                  {text.subtitle.replace('{name}', petName)}
                </p>
              )}

              {/* Feature list - 모바일 1열, 데스크탑 2열 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5 mb-6 md:mb-8">
                {text.bulletPoints.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-left">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-emerald-300 text-base md:text-lg">{item.icon}</span>
                    </div>
                    <span className="text-white/80 text-xs md:text-sm font-medium leading-snug">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Price - 모바일: 중앙, 데스크탑: 좌측 */}
              {!isReady && reportStatus !== 'generating' && (
                <div className="flex items-baseline gap-2 justify-center md:justify-start mb-3 md:mb-4">
                  <span className="text-white/40 line-through text-base md:text-lg font-medium">{text.originalPrice}</span>
                  <span className="text-white text-2xl md:text-4xl font-black">{text.salePrice}</span>
                  <span className="text-white/50 text-xs md:text-sm">USD</span>
                </div>
              )}

              {/* Button - 항상 풀 너비(모바일), 데스크탑은 auto, 최소 높이 52px */}
              {reportStatus !== 'generating' && (
                <button
                  id="premium-cta-button"
                  onClick={handleClick}
                  disabled={isGeneratingReport || isStartingPayment}
                  className={`group relative w-full md:w-auto font-bold text-base md:text-lg min-h-[52px] py-3.5 md:py-4 px-8 md:px-10 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.97] disabled:cursor-not-allowed overflow-hidden ${
                    isStartingPayment
                      ? 'bg-white/60 text-primary/60'
                      : isReady
                      ? 'bg-emerald-400 text-[#1a3a2a] hover:bg-emerald-300'
                      : 'bg-white text-[#1a3a2a] hover:bg-gray-50'
                  }`}
                >
                  {/* Shine effect */}
                  {!isStartingPayment && (
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  )}

                  {isStartingPayment ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary/60 border-t-transparent rounded-full animate-spin" />
                      <span>{text.cta}</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">
                        {isReady
                          ? text.viewReport
                          : isFailed
                          ? text.retry
                          : text.cta}
                      </span>
                      <span className="material-symbols-outlined text-xl relative z-10 transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              )}

              {/* Status messages */}
              {isReady && (
                <div className="flex items-center gap-2 text-emerald-300 mt-3 md:mt-4 justify-center md:justify-start">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  <span className="text-sm font-medium">{text.ready}</span>
                </div>
              )}
              {isFailed && (
                <div className="text-center space-y-3 mt-3">
                  {refundInitiated ? (
                    <>
                      <div className="flex items-center justify-center gap-2 text-emerald-300">
                        <span className="material-symbols-outlined">check_circle</span>
                        <p className="font-bold text-sm md:text-base">
                          {lang === 'jp' ? '自動返金処理を開始しました' : 'Automatic refund initiated'}
                        </p>
                      </div>
                      <p className="text-white/60 text-xs md:text-sm">
                        {lang === 'jp' 
                          ? 'お支払いは3〜5営業日以内に返金されます。' 
                          : 'Your payment will be refunded within 3-5 business days.'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-300 font-bold text-sm md:text-base">
                        {lang === 'jp' ? '生成に失敗しました。' : 'Generation failed.'}
                      </p>
                      <button
                        onClick={onGetReport}
                        className="px-6 py-3 bg-white text-primary rounded-full font-bold text-sm hover:bg-gray-100 transition-all"
                      >
                        {lang === 'jp' ? '再試行' : 'Try Again'}
                      </button>
                      <p className="text-white/40 text-xs">
                        {lang === 'jp' 
                          ? '再試行しても失敗する場合、自動的に返金されます。' 
                          : 'If retry fails, an automatic refund will be processed.'}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Guarantee line */}
              {!isReady && !isFailed && reportStatus !== 'generating' && (
                <div className="flex items-center gap-1.5 text-white/35 text-[11px] md:text-xs mt-3 md:mt-4 justify-center md:justify-start">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>{text.guarantee}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PremiumCTA
