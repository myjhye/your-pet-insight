import { forwardRef } from 'react'

const STATS_ORDER = [
  { key: 'sociability', color: '#EF4444' },
  { key: 'sagacity', color: '#8B5CF6' },
  { key: 'emotionality', color: '#EC4899' },
  { key: 'obedience', color: '#06B6D4' },
  { key: 'temperament', color: '#FACC15' },
]

const ResultShareCard = forwardRef(({ 
  petName, alias, summary, mbtiCode,
  stats, statsLabels, imageSrc, lang, getLocalizedText 
}, ref) => {
  
  const strengthPercent = (v) => v >= 50 ? v : 100 - v

  return (
    <div
      ref={ref}
      style={{
        width: '1080px',
        height: 'auto',
        position: 'fixed',
        left: '-9999px',
        top: '0',
        background: 'linear-gradient(180deg, #F9FBF9 0%, #EDF2EE 100%)',
        fontFamily: "'Poppins', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '50px 72px 44px',
        boxSizing: 'border-box',
      }}
    >
      {/* 상단 로고 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <span style={{ fontSize: '28px' }}>🐾</span>
        <span style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#2D5A47',
          letterSpacing: '-0.5px',
        }}>
          Your <span style={{ fontWeight: '800' }}>Pet Insight</span>
        </span>
      </div>

      {/* ★ 캐릭터 이미지 — 크게 + scale로 꽉 채움 */}
      <div style={{
        width: '400px',
        height: '400px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={petName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transform: 'scale(1.15)',
            }}
            crossOrigin="anonymous"
          />
        ) : (
          <div style={{
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: '#E8F0EA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '80px',
          }}>
            🐕
          </div>
        )}
      </div>

      {/* 펫 이름 */}
      <div style={{
        fontSize: '34px',
        fontWeight: '800',
        color: '#2D5A47',
        marginBottom: '2px',
        textAlign: 'center',
      }}>
        {petName}
      </div>

      {/* Archetype 이름 */}
      <div style={{
        fontSize: '46px',
        fontWeight: '900',
        color: '#2D5A47',
        textTransform: 'uppercase',
        letterSpacing: '-2px',
        marginBottom: '10px',
        textAlign: 'center',
        lineHeight: '1.1',
      }}>
        {alias || mbtiCode}
      </div>

      {/* Summary */}
      {summary && (
        <div style={{
          fontSize: '17px',
          color: '#2D5A47',
          opacity: 0.65,
          textAlign: 'center',
          maxWidth: '850px',
          lineHeight: '1.5',
          marginBottom: '32px',
        }}>
          {summary}
        </div>
      )}

      {/* Stats — 전체 너비 */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        marginBottom: '32px',
      }}>
        {STATS_ORDER.map(({ key, color }) => {
          const rawValue = stats?.[key] ?? 50
          const value = typeof rawValue === 'number' ? rawValue : Number(rawValue) || 50
          const strength = strengthPercent(value)
          const label = getLocalizedText(statsLabels?.[key]) || key

          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#2D5A47',
                  opacity: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#2D5A47',
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: color,
                  }}>
                    {strength}%
                  </span>
                </div>
              </div>
              <div style={{
                width: '100%',
                height: '14px',
                background: '#E8E8E8',
                borderRadius: '7px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${strength}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '7px',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* 워터마크 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(45, 90, 71, 0.1)',
        width: '50%',
      }}>
        <div style={{
          fontSize: '16px',
          color: '#2D5A47',
          opacity: 0.4,
          fontWeight: '500',
        }}>
          yourpetinsight.com
        </div>
        <div style={{
          fontSize: '14px',
          color: '#2D5A47',
          opacity: 0.3,
        }}>
          {lang === 'jp' 
            ? 'あなたのペットも診断してみよう！' 
            : 'Discover your pet\'s personality too!'}
        </div>
      </div>
    </div>
  )
})

ResultShareCard.displayName = 'ResultShareCard'

export default ResultShareCard
