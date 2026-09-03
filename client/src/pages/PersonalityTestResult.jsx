import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useResults } from '../contexts/ResultsContext'
import axios from 'axios'
import PremiumReportViewer from '../components/PremiumReportViewer'
import PremiumCTA from '../components/PremiumCTA'
import { useSaveAsImage } from '../hooks/useSaveAsImage'
import { trackEvent } from '../utils/gtm'

// API Base URL (환경 변수 또는 기본값)
// 개발 환경에서는 Vite 프록시 사용 (상대 경로), 배포 환경에서는 절대 URL
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Stats 고정 순서 및 설정
const STATS_ORDER = [
  { key: 'sociability', color: 'bg-red-500' },
  { key: 'sagacity', color: 'bg-violet-500' },
  { key: 'emotionality', color: 'bg-pink-500' },
  { key: 'obedience', color: 'bg-cyan-500' },
  { key: 'temperament', color: 'bg-yellow-400' },
]

// ============================================================
// 잠긴 카드 개인화 preview 생성
// ============================================================

function getPersonalizedPreviews(stats, petName, lang) {
  if (!stats || !petName) return null

  const soc = stats.sociability ?? 50
  const sag = stats.sagacity ?? 50
  const emo = stats.emotionality ?? 50
  const obe = stats.obedience ?? 50

  // 강도 퍼센트 (StatBar와 동일 계산)
  const strength = (v) => v >= 50 ? v : 100 - v

  const socStr = strength(soc)
  const sagStr = strength(sag)
  const emoStr = strength(emo)
  const obeStr = strength(obe)

  // 스탯 레벨 판정
  const level = (v) => {
    if (v >= 75) return 'extreme'
    if (v >= 60) return 'high'
    if (v >= 40) return 'moderate'
    if (v >= 25) return 'low'
    return 'very_low'
  }

  const socLevel = level(soc)
  const sagLevel = level(sag)
  const emoLevel = level(emo)
  const obeLevel = level(obe)

  // 히든 패턴 감지 (report.py의 get_hidden_patterns와 동일 로직)
  let patternName = null
  let patternHint = null

  if (lang === 'jp') {
    if (soc >= 65 && emo >= 65) {
      patternName = '感情的な絆の達人'
      patternHint = `${petName}の高い社交性と感情感度が独特なパターンを作り出しています`
    } else if (soc >= 65 && emo <= 35) {
      patternName = 'ソーシャル・バタフライ'
      patternHint = `${petName}はみんなを愛しますが、クールな距離感を保ちます`
    } else if (soc <= 35 && emo >= 65) {
      patternName = '一途な忠犬'
      patternHint = `${petName}の世界はあなたを中心に回っています`
    } else if (sag >= 65 && obe <= 35) {
      patternName = '賢い反逆者'
      patternHint = `${petName}はすべてを理解していますが、従うかどうかは自分で決めます`
    } else if (sag >= 65 && obe >= 65) {
      patternName = '優等生'
      patternHint = `${petName}は賢くて従順 — 理想的な訓練生です`
    } else if (sag <= 35 && obe >= 65) {
      patternName = '忠実な兵士'
      patternHint = `${petName}の献身は比類がありません`
    } else if (soc <= 35 && sag >= 65) {
      patternName = '静かな観察者'
      patternHint = `${petName}は行動する前にすべてを観察します`
    } else if (emo >= 65 && obe <= 35) {
      patternName = 'ドラマの王様'
      patternHint = `${petName}はすべてを深く感じ、自分のやり方を貫きます`
    }
  } else {
    if (soc >= 65 && emo >= 65) {
      patternName = 'The Emotional Connector'
      patternHint = `${petName}'s high sociability and emotional sensitivity create a unique pattern`
    } else if (soc >= 65 && emo <= 35) {
      patternName = 'The Social Butterfly'
      patternHint = `${petName} loves everyone but keeps a cool emotional distance`
    } else if (soc <= 35 && emo >= 65) {
      patternName = 'The One-Person Dog'
      patternHint = `${petName}'s world revolves entirely around you`
    } else if (sag >= 65 && obe <= 35) {
      patternName = 'The Clever Rebel'
      patternHint = `${petName} understands everything but chooses when to listen`
    } else if (sag >= 65 && obe >= 65) {
      patternName = 'The Star Student'
      patternHint = `${petName} is smart AND eager to please — the dream trainee`
    } else if (sag <= 35 && obe >= 65) {
      patternName = 'The Loyal Soldier'
      patternHint = `${petName}'s dedication is unmatched`
    } else if (soc <= 35 && sag >= 65) {
      patternName = 'The Silent Observer'
      patternHint = `${petName} watches everything before deciding to act`
    } else if (emo >= 65 && obe <= 35) {
      patternName = 'The Drama Queen/King'
      patternHint = `${petName} feels everything deeply and insists on doing things their way`
    }
  }

  // 가장 높은/낮은 스탯 찾기
  const statEntries = [
    { key: 'sociability', raw: soc, str: socStr },
    { key: 'sagacity', raw: sag, str: sagStr },
    { key: 'emotionality', raw: emo, str: emoStr },
    { key: 'obedience', raw: obe, str: obeStr },
  ]
  const sorted = [...statEntries].sort((a, b) => b.str - a.str)
  const highest = sorted[0]
  const lowest = sorted[sorted.length - 1]

  // 스탯 이름 다국어
  const statNames = lang === 'jp' 
    ? { sociability: '社交性', sagacity: '知性', emotionality: '感情性', obedience: '従順性' }
    : { sociability: 'Sociability', sagacity: 'Sagacity', emotionality: 'Emotionality', obedience: 'Obedience' }

  // ============================================================
  // 각 카드별 개인화 preview 생성
  // ============================================================

  if (lang === 'jp') {
    return {
      deep_dive_traits: patternName
        ? `${petName}のスコア組み合わせが「${patternName}」という珍しいパターンを示しています。${patternHint}...`
        : `${petName}の最も強い特性は${statNames[highest.key]} ${highest.str}%。この強みが日常行動にどう現れるか...`,

      cognitive_strengths: sag >= 65
        ? `知性 ${sagStr}%の${petName}は${sag >= 75 ? '1-2回でトリックを覚える天才タイプ' : 'パターンを素早く把握する頭脳派'}。最適な頭脳ゲームとは...`
        : `${petName}は${sag <= 35 ? '直感と本能で生きるタイプ' : '実践を通じて学ぶ体験型学習者'}。${petName}に合った学び方を発見...`,

      owner_chemistry: patternName
        ? `「${patternName}」タイプの${petName}とあなたの間には独特な相乗効果があります。最高のチームになる理由...`
        : `${petName}の${statNames[highest.key]}(${highest.str}%)があなたとの関係にどう影響するか。相性のポイント...`,

      training_roadmap: sag >= 65 && obe <= 35
        ? `${petName}は知性 ${sagStr}%だが従順性 ${obeStr}% — コマンドは理解するが従うかは自分で決める。この子に効くのは...`
        : obe >= 65
        ? `従順性 ${obeStr}%の${petName}はルールベースのトレーニングが最適。2週間で変わる具体的なプラン...`
        : `${petName}の性格に合わせた「${sag >= 50 ? 'チャレンジ型' : '遊び型'}」トレーニング法。退屈させない秘訣...`,

      social_adaptation: soc >= 65
        ? `社交性 ${socStr}%の${petName}は${soc >= 75 ? '全員に挨拶したがるパーティー好き' : '社交的だが空気を読める'}。ドッグパークでの注意点...`
        : `${petName}は${soc <= 35 ? '信頼できる少数の仲間を選ぶタイプ' : '状況を見てから行動する慎重派'}。新しい出会いをスムーズにする方法...`,

      lifestyle_guide: `${petName}の${statNames[highest.key]}(${highest.str}%)に最適化された朝・昼・夜のルーティン。一人の時間の過ごし方から就寝まで...`
    }
  }

  // English
  return {
    deep_dive_traits: patternName
      ? `${petName}'s score combination reveals a rare "${patternName}" pattern. ${patternHint}...`
      : `${petName}'s strongest trait is ${statNames[highest.key]} at ${highest.str}%. Discover how this shapes their daily behavior...`,

    cognitive_strengths: sag >= 65
      ? `With ${sagStr}% sagacity, ${petName} is a ${sag >= 75 ? 'genius who learns tricks in 1-2 tries' : 'quick pattern-spotter who loves mental challenges'}. The best brain games for this mind...`
      : `${petName} is ${sag <= 35 ? 'an instinct-first reactor who lives in the moment' : 'a hands-on learner who learns best by doing'}. Discover the right approach...`,

    owner_chemistry: patternName
      ? `As "${patternName}", ${petName} creates a unique dynamic with you. Find out why you make a great team...`
      : `${petName}'s ${statNames[highest.key]} (${highest.str}%) shapes how they bond with you. Your compatibility secrets...`,

    training_roadmap: sag >= 65 && obe <= 35
      ? `${petName} scored ${sagStr}% sagacity but ${obeStr}% obedience — understands every command but chooses when to follow. What actually works...`
      : obe >= 65
      ? `With ${obeStr}% obedience, ${petName} thrives on structure. A 2-week plan designed for eager learners...`
      : `${petName}'s personality calls for a "${sag >= 50 ? 'challenge-based' : 'play-disguised'}" approach. How to train without boring them...`,

    social_adaptation: soc >= 65
      ? `At ${socStr}% sociability, ${petName} is ${soc >= 75 ? 'the one greeting everyone at the dog park' : 'friendly but reads the room first'}. Tips for social success...`
      : `${petName} ${soc <= 35 ? 'bonds deeply with a chosen few rather than the crowd' : 'takes time to assess before engaging'}. Making introductions smooth...`,

    lifestyle_guide: `A morning-to-night routine optimized for ${petName}'s ${statNames[highest.key]} (${highest.str}%). From alone-time setup to the perfect bedtime ritual...`
  }
}

// PremiumCTA에 표시할 hook 문구 생성
function getCTAHook(stats, petName, lang) {
  if (!stats || !petName) return null

  const soc = stats.sociability ?? 50
  const sag = stats.sagacity ?? 50
  const emo = stats.emotionality ?? 50
  const obe = stats.obedience ?? 50

  const strength = (v) => v >= 50 ? v : 100 - v

  // 가장 인상적인 조합 찾기
  if (lang === 'jp') {
    if (soc >= 65 && emo >= 65)
      return `${petName}の社交性(${strength(soc)}%) × 感情性(${strength(emo)}%)が「感情的な絆の達人」パターンを示しています`
    if (sag >= 65 && obe <= 35)
      return `${petName}は知性${strength(sag)}%なのに従順性${strength(obe)}% — 典型的な「賢い反逆者」パターン`
    if (soc <= 35 && emo >= 65)
      return `${petName}は群衆より飼い主を選ぶ「一途な忠犬」タイプ — その理由を解明`
    if (sag >= 65 && obe >= 65)
      return `知性${strength(sag)}% × 従順性${strength(obe)}% — ${petName}は理想的な「優等生」タイプ`

    // fallback: 가장 높은 스탯 기반
    const entries = [
      { name: '社交性', val: soc, str: strength(soc) },
      { name: '知性', val: sag, str: strength(sag) },
      { name: '感情性', val: emo, str: strength(emo) },
      { name: '従順性', val: obe, str: strength(obe) },
    ].sort((a, b) => b.str - a.str)
    return `${petName}の${entries[0].name}${entries[0].str}%が日常にどう影響しているか — 詳細分析で解明`
  }

  // English
  if (soc >= 65 && emo >= 65)
    return `${petName}'s Sociability (${strength(soc)}%) × Emotionality (${strength(emo)}%) reveals an "Emotional Connector" pattern`
  if (sag >= 65 && obe <= 35)
    return `${petName} scored ${strength(sag)}% Sagacity but ${strength(obe)}% Obedience — a classic "Clever Rebel" pattern`
  if (soc <= 35 && emo >= 65)
    return `${petName} chooses you over the crowd — a "One-Person Dog" pattern. Find out why`
  if (sag >= 65 && obe >= 65)
    return `${strength(sag)}% Sagacity × ${strength(obe)}% Obedience — ${petName} is "The Star Student" type`

  // fallback
  const entries = [
    { name: 'Sociability', val: soc, str: strength(soc) },
    { name: 'Sagacity', val: sag, str: strength(sag) },
    { name: 'Emotionality', val: emo, str: strength(emo) },
    { name: 'Obedience', val: obe, str: strength(obe) },
  ].sort((a, b) => b.str - a.str)
  return `${petName}'s ${entries[0].name} at ${entries[0].str}% shapes their daily behavior — deep analysis inside`
}

// UI 텍스트 다국어 정의
const UI_TEXT = {
  en: {
    loading: {
      title: 'Analyzing Results...',
      subtitle: "Creating your pet's personality profile"
    },
    error: {
      title: "Oops! Something went wrong",
      tryAgain: "Try Again",
      noData: "Result data not found.",
      languageMismatch: "This result was created in a different language.",
      viewInOriginal: "View in Original Language"
    },
    tabs: {
      basic: "Basic Results",
      premium: "Premium Report"
    },
    petName: {
      subtitle: "Your Beloved Companion"
    },
    sections: {
      coreTraits: "Core Traits",
      dailyLife: "Daily Life with You"
    },
    premium: {
      title: "Premium Deep Report",
      subtitle: "AI's complete personality profile of {name}",
      pageTitles: {
        table_of_contents: "Table of Contents",
        deep_dive_traits: "Personality Analysis",
        cognitive_strengths: "Cognitive Strengths",
        owner_chemistry: "Chemistry Analysis",
        training_roadmap: "Training Guide",
        social_adaptation: "Social Adaptation",
        lifestyle_guide: "Lifestyle Guide",
        heartfelt_message: "Special Message"
      },
      cta: {
        title: "Unlock Your Premium Report",
        description: "Get {name}'s complete personality analysis with personalized training strategies, daily routines, and compatibility insights.",
        getReport: "Get Premium Report",
        price: "$5.99",
        generating: "Generating your report...",
        generatingSub: "This may take up to 30 seconds",
        viewReport: "View Premium Report",
        ready: "Your report is ready!",
        failed: "Generation failed. Please try again.",
        failedWithRefund: "Generation failed. An automatic refund has been initiated.",
        failedContactSupport: "Generation failed. Please contact support for a refund.",
        refundNotice: "Your payment will be refunded within 3-5 business days.",
        retry: "Try Again"
      },
      premiumPreview: {
        sectionTitle: "View Complete Results",
        unlockButton: "Unlock",
        lockedDescription: "This section contains personalized insights for {name}",
        sections: [
          {
            key: "deep_dive_traits",
            title: "Personality Analysis",
            icon: "psychology",
            preview: "Detailed breakdown of your pet's unique personality traits and behavioral patterns..."
          },
          {
            key: "cognitive_strengths",
            title: "Cognitive Strengths",
            icon: "neurology",
            preview: "Understanding how your pet learns, solves problems, and processes information..."
          },
          {
            key: "owner_chemistry",
            title: "Chemistry Analysis",
            icon: "favorite",
            preview: "Discover why you and your pet make a great team and how to strengthen your bond..."
          },
          {
            key: "training_roadmap",
            title: "Training Guide",
            icon: "school",
            preview: "Step-by-step training strategies tailored to your pet's personality type..."
          },
          {
            key: "social_adaptation",
            title: "Social Adaptation",
            icon: "groups",
            preview: "Tips for helping your pet interact with other dogs, people, and new environments..."
          },
          {
            key: "lifestyle_guide",
            title: "Lifestyle Guide",
            icon: "routine",
            preview: "The perfect daily routine designed specifically for your pet's needs..."
          }
        ]
      }
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
    tabs: {
      basic: "基本結果",
      premium: "プレミアムレポート"
    },
    petName: {
      subtitle: "あなたの愛するパートナー"
    },
    sections: {
      coreTraits: "コア特性",
      dailyLife: "あなたとの日常生活"
    },
    premium: {
      title: "プレミアム詳細レポート",
      subtitle: "AIが分析した{name}の完全な性格プロファイル",
      pageTitles: {
        table_of_contents: "目次",
        deep_dive_traits: "性格分析",
        cognitive_strengths: "認知的強み",
        owner_chemistry: "相性分析",
        training_roadmap: "トレーニングガイド",
        social_adaptation: "社会適応",
        lifestyle_guide: "ライフスタイルガイド",
        heartfelt_message: "特別なメッセージ"
      },
      cta: {
        title: "プレミアムレポートをアンロック",
        description: "{name}の完全な性格分析、パーソナライズされたトレーニング戦略、毎日のルーティン、相性の洞察を入手してください。",
        getReport: "プレミアムレポートを取得",
        price: "$5.99",
        generating: "レポートを生成中...",
        generatingSub: "最大30秒かかる場合があります",
        viewReport: "プレミアムレポートを表示",
        ready: "レポートの準備ができました！",
        failed: "生成に失敗しました。もう一度お試しください。",
        retry: "再試行"
      },
      premiumPreview: {
        sectionTitle: "完全な結果を確認",
        unlockButton: "アンロック",
        lockedDescription: "このセクションには{name}のためのパーソナライズされた洞察が含まれています",
        sections: [
          {
            key: "deep_dive_traits",
            title: "性格分析",
            icon: "psychology",
            preview: "ペットの独特な性格特性と行動パターンの詳細な分析..."
          },
          {
            key: "cognitive_strengths",
            title: "認知的強み",
            icon: "neurology",
            preview: "ペットがどのように学び、問題を解決し、情報を処理するかを理解..."
          },
          {
            key: "owner_chemistry",
            title: "相性分析",
            icon: "favorite",
            preview: "あなたとペットが最高のチームである理由と絆を深める方法..."
          },
          {
            key: "training_roadmap",
            title: "トレーニングガイド",
            icon: "school",
            preview: "ペットの性格タイプに合わせたステップバイステップのトレーニング戦略..."
          },
          {
            key: "social_adaptation",
            title: "社会適応",
            icon: "groups",
            preview: "他の犬、人、新しい環境との交流を助けるヒント..."
          },
          {
            key: "lifestyle_guide",
            title: "ライフスタイルガイド",
            icon: "routine",
            preview: "ペットのニーズに合わせて設計された完璧な毎日のルーティン..."
          }
        ]
      }
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
  
  // 언어 이름 매핑
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
  // 성향 강도 계산: 항상 50~100% 사이로 표시 (주도 성향의 강도)
  // 예: 43% → 57% (반대 성향이 57% 강함), 65% → 65% (해당 성향이 65% 강함)
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

function LockedPreviewCard({ icon, title, preview, petName, onUnlockClick, unlockButtonText }) {
  return (
    <div className="relative p-5 md:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all min-h-[120px]">
      {/* Header: Icon Badge & Title */}
      <div className="flex items-start gap-4 mb-3">
        {/* Icon Badge */}
        <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
        </div>
        {/* Title */}
        <div className="flex-1 pt-1">
          <h3 className="text-lg md:text-xl font-display font-bold text-primary leading-tight mb-1">
            {title}
          </h3>
          <div className="flex items-center gap-1 text-xs text-primary/40 font-medium">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span>Premium Content</span>
          </div>
        </div>
      </div>
      
      {/* Blurred Preview Content */}
      <div className="relative mt-2">
        <p className="text-[#2D3436]/70 text-sm leading-relaxed blur-[3px] select-none pointer-events-none line-clamp-2">
          {preview}
        </p>
        
        {/* Unlock Overlay & Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
          <button
            onClick={onUnlockClick}
            className="px-5 py-2.5 bg-white border border-primary/20 shadow-md rounded-full text-primary text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">lock_open</span>
            {unlockButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}

function PersonalityTestResult() {
  const { resultId } = useParams()
  const { lang } = useLang()
  const { fetchResult, getResult, isLoading, getError } = useResults()
  
  // 이미지 로드 상태 관리
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(null)
  
  // 리포트 생성 상태 관리
  const [reportStatus, setReportStatus] = useState(null) // not_generated, generating, ready, failed
  const [reportPages, setReportPages] = useState(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isStartingPayment, setIsStartingPayment] = useState(false) // 결제 시작 로딩 상태
  const [paymentProcessed, setPaymentProcessed] = useState(false) // 결제 성공 여부를 추적하는 상태 (중복 실행 방지)
  const [reportGenerationStarted, setReportGenerationStarted] = useState(false) // 리포트 생성 시작 여부 (중복 실행 방지)
  
  // Share 기능 상태
  const [copied, setCopied] = useState(false)
  
  // 이미지 저장 기능
  const { fullPageRef, isSaving, saveMode, saveAsFullPage } = useSaveAsImage()
  const [saveToast, setSaveToast] = useState(null) // 'saved' | 'shared' | null
  
  // 언어 불일치 상태
  const [languageMismatch, setLanguageMismatch] = useState(false)
  
  // 메인 탭 상태 관리 (기본 결과 / 프리미엄 리포트)
  const [currentTab, setCurrentTab] = useState('basic')
  
  // 리포트 내부 탭 상태 관리
  const [activeTab, setActiveTab] = useState('table_of_contents')

  // 환불 상태
  const [refundInitiated, setRefundInitiated] = useState(false)

  // Context에서 결과 가져오기 - 캐시에 report_status가 없으면 강제 갱신
  useEffect(() => {
    if (resultId) {
      // 캐시에 report_status가 없으면 강제 갱신 (구매 여부 확인)
      const cached = getResult(resultId)
      const needsRefresh = !cached || cached.report_status === undefined
      fetchResult(resultId, needsRefresh)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultId]) // fetchResult, getResult는 안정적인 함수이므로 의존성에서 제외

  // Context에서 데이터 읽기
  const resultData = getResult(resultId)
  const loading = isLoading(resultId)
  const error = getError(resultId)
  
  // 언어 불일치 체크 (locale 또는 lang 필드 사용)
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
  
  // 이미지 경로 설정 및 확장자 시도
  useEffect(() => {
    if (resultData?.archetype?.image_id) {
      const imageId = resultData.archetype.image_id
      const extensions = ['.png', '.jpg', '.jpeg', '.webp']
      let currentIndex = 0
      
      // 첫 번째 확장자로 시작
      setImageSrc(`/images/archetypes/${imageId}${extensions[currentIndex]}`)
      setImageError(false)
    } else {
      setImageSrc(null)
      setImageError(true)
    }
  }, [resultData])
  
  // 리포트 상태 확인 및 activeTab 초기값 설정
  useEffect(() => {
    if (resultData) {
      // 결제 후 생성 과정 전체에서 덮어쓰기 방지
      if (paymentProcessed && (reportStatus === 'generating' || reportGenerationStarted)) {
        if (resultData.report_status === 'ready') {
          setReportStatus('ready')
          setReportPages(resultData.report_pages || null)
          setIsGeneratingReport(false)
          setCurrentTab('premium')
          window.scrollTo({ top: 0, behavior: 'auto' })
        }
        // generating 중이거나 이미 ready로 전환된 경우 덮어쓰지 않음
        return
      }
      
      setReportStatus(resultData.report_status || 'not_generated')
      setReportPages(resultData.report_pages || null)
      
      if (resultData.report_status === 'ready' && resultData.report_pages) {
        const pageOrder = [
          'table_of_contents',
          'deep_dive_traits',
          'cognitive_strengths',
          'owner_chemistry',
          'training_roadmap',
          'social_adaptation',
          'lifestyle_guide',
          'heartfelt_message'
        ]
        const firstAvailablePage = pageOrder.find(pageKey => resultData.report_pages[pageKey])
        if (firstAvailablePage) setActiveTab(firstAvailablePage)
        }
      }
  }, [resultData, paymentProcessed, reportStatus, reportGenerationStarted])
  
  // 숫자와 % 강조 처리 (렌더링 후)
  useEffect(() => {
    if (currentTab === 'premium' && reportStatus === 'ready' && reportPages) {
      const highlightNumbers = () => {
        const proseElement = document.querySelector('.prose')
        if (!proseElement) return
        
        // 이미 처리된 요소는 건너뛰기
        const processedElements = proseElement.querySelectorAll('.highlight-processed')
        processedElements.forEach(el => {
          el.classList.remove('highlight-processed')
          const original = el.getAttribute('data-original')
          if (original) {
            el.innerHTML = original
          }
        })
        
        // 모든 텍스트 노드 찾기
        const walker = document.createTreeWalker(
          proseElement,
          NodeFilter.SHOW_TEXT,
          null
        )
        
        const textNodes = []
        let node
        while (node = walker.nextNode()) {
          if (node.textContent.match(/\d+%/)) {
            textNodes.push(node)
          }
        }
        
        textNodes.forEach(textNode => {
          const parent = textNode.parentElement
          if (parent && !parent.classList.contains('highlight-processed')) {
            parent.classList.add('highlight-processed')
            const original = textNode.textContent
            parent.setAttribute('data-original', original)
            const highlighted = original.replace(/(\d+%)/g, '<span class="text-primary font-bold text-lg">$1</span>')
            if (highlighted !== original) {
              const wrapper = document.createElement('span')
              wrapper.innerHTML = highlighted
              textNode.replaceWith(...Array.from(wrapper.childNodes))
            }
          }
        })
      }
      
      // 약간의 지연 후 실행 (렌더링 완료 후)
      const timer = setTimeout(highlightNumbers, 200)
      return () => clearTimeout(timer)
    }
  }, [activeTab, currentTab, reportStatus, reportPages])
  
  // Polar 결제 시작 함수
  // 최하단 결제 버튼으로 스크롤하는 함수
  const scrollToPremiumCTA = () => {
    const ctaElement = document.getElementById('premium-cta')
    
    if (ctaElement) {
      // 컴포넌트의 중심 위치 계산
      const rect = ctaElement.getBoundingClientRect()
      const elementTop = rect.top + window.scrollY
      const elementHeight = rect.height
      const elementCenter = elementTop + (elementHeight / 2)
      
      // 화면 중심에 맞추기 위해 뷰포트 높이의 절반을 빼기
      const viewportHeight = window.innerHeight
      const targetScrollPosition = elementCenter - (viewportHeight / 2)

      window.scrollTo({
        top: Math.max(0, targetScrollPosition), // 음수 방지
        behavior: 'smooth'
      })
    }
  }

  // 준비 중 알림 표시 함수
  const showComingSoonAlert = (location = 'cta_button') => {
    trackEvent('premium_cta_click', { location, lang })

    const messages = {
      ko: '프리미엄 리포트는 현재 준비 중입니다.',
      jp: 'プレミアムレポート機能は現在準備中です。',
      en: 'Premium Report feature is currently coming soon.'
    }
    const msg = messages[lang] || messages[lang === 'kr' ? 'ko' : 'en'] || messages.en

    setSaveToast(msg)
    setTimeout(() => {
      setSaveToast((prev) => (prev === msg ? null : prev))
    }, 3000)

    alert(msg)
  }

  const handleStartPayment = async () => {
    showComingSoonAlert()
  }
  
  // 리포트 생성 함수
  const handleGenerateReport = async () => {
    if (!resultId) return
    
    setIsGeneratingReport(true)
    setReportStatus('generating')
    
    try {
      // URL이나 Context에서 가져온 lang을 쿼리 파라미터로 전달
      const response = await axios.post(`${API_BASE_URL}/api/test/generate-report/${resultId}?lang=${lang}`)
      
      if (response.data.status === 'success') {
        // 리포트 생성 완료, 상태 확인을 위해 결과 다시 불러오기
        await fetchResult(resultId)
        
        // 폴링으로 리포트 상태 확인 (최대 30초)
        let attempts = 0
        const maxAttempts = 30
        
        const checkStatus = setInterval(async () => {
          attempts++
          try {
            const resultResponse = await axios.get(`${API_BASE_URL}/api/results/${resultId}`)
            const updatedData = resultResponse.data
            
            if (updatedData.report_status === 'ready') {
              setReportStatus('ready')
              setReportPages(updatedData.report_pages)
              setIsGeneratingReport(false)
              clearInterval(checkStatus)
            } else if (updatedData.report_status === 'failed') {
              setReportStatus('failed')
              setIsGeneratingReport(false)
              clearInterval(checkStatus)
            } else if (attempts >= maxAttempts) {
              setIsGeneratingReport(false)
              clearInterval(checkStatus)
            }
          } catch (err) {
            console.error('리포트 상태 확인 실패:', err)
            if (attempts >= maxAttempts) {
              setIsGeneratingReport(false)
              clearInterval(checkStatus)
            }
          }
        }, 1000)
      }
    } catch (error) {
      console.error('리포트 생성 실패:', error)
      setReportStatus('failed')
      setIsGeneratingReport(false)
    }
  }

  // 폴링 함수 (별도 함수로 분리)
  const startPolling = useCallback(() => {
    if (!resultId) return
    
    let attempts = 0
    const maxAttempts = 180  // 3분 타임아웃

    const checkStatus = setInterval(async () => {
      attempts++
      try {
        const resultResponse = await axios.get(
          `${API_BASE_URL}/api/results/${resultId}`
        )
        const updatedData = resultResponse.data

        if (updatedData.report_status === 'ready') {
          clearInterval(checkStatus)
          await fetchResult(resultId, true)

          setReportStatus('ready')
          setReportPages(updatedData.report_pages || null)
          setIsGeneratingReport(false)
          setCurrentTab('premium')

          const pageOrder = [
            'table_of_contents', 'deep_dive_traits', 'cognitive_strengths',
            'owner_chemistry', 'training_roadmap', 'social_adaptation',
            'lifestyle_guide', 'heartfelt_message'
          ]
          const firstPage = pageOrder.find(k => updatedData.report_pages?.[k])
          if (firstPage) setActiveTab(firstPage)

          window.scrollTo({ top: 0, behavior: 'auto' })
        } else if (updatedData.report_status === 'failed') {
          clearInterval(checkStatus)
          setReportStatus('failed')
          setIsGeneratingReport(false)
          setCurrentTab('basic')
          
          // 환불 정보 확인
          if (updatedData.refund_initiated) {
            setRefundInitiated(true)
          }
        } else if (attempts >= maxAttempts) {
          // 타임아웃 → 재시도 버튼 표시
          clearInterval(checkStatus)
          setReportStatus('timeout')
          setIsGeneratingReport(false)
        }
      } catch (err) {
        console.error('리포트 상태 확인 실패:', err)
        if (attempts >= maxAttempts) {
          clearInterval(checkStatus)
          setReportStatus('timeout')
          setIsGeneratingReport(false)
        }
      }
    }, 3000)  // 3초 간격으로 polling
  }, [resultId, fetchResult]) // eslint-disable-line react-hooks/exhaustive-deps

  // 결제 완료 후 처리 (URL 파라미터 확인) - 최초 1회만 실행 + verify 직접 호출
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    
    // 결제 성공 + 아직 처리 안 됨 + resultId 있음
    if (paymentStatus === 'success' && !paymentProcessed && resultId) {
      // 즉시 처리 완료 표시 (중복 실행 방지)
      setPaymentProcessed(true)
      
      // URL에서 payment 파라미터 즉시 제거
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      
      // 즉시 로딩 상태로 전환 (화면에 바로 표시)
      setReportStatus('generating')
      setIsGeneratingReport(true)
      
      // 최상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'auto' })
      
      // ★ 여기서 바로 verify 호출 (다른 useEffect에 의존하지 않음)
      const runVerify = async () => {
        const verifyUrl = `${API_BASE_URL}/api/verify-payment/${resultId}?lang=${lang}`
        
        try {
          const verifyResponse = await axios.get(verifyUrl)
          
          if (!verifyResponse.data.is_verified) {
            // 결제 검증 실패
            console.error('Payment verification failed:', verifyResponse.data.message)
            setReportStatus('failed')
            setIsGeneratingReport(false)
            setCurrentTab('basic')
            
            // ★ 자동 환불 여부 확인
            if (verifyResponse.data.refund_initiated) {
              setRefundInitiated(true)
            }
            
            alert(verifyResponse.data.refund_initiated
              ? (lang === 'jp'
                ? '決済の確認に失敗しました。自動返金処理を開始しました。3〜5営業日以内に返金されます。'
                : 'Payment verification failed. An automatic refund has been initiated. Please allow 3-5 business days.')
              : (lang === 'jp'
                ? '決済の確認に失敗しました。サポートにお問い合わせください。'
                : 'Payment verification failed. Please contact support.'))
            return
          }

          // ★ verify 응답의 report_status 확인
          const verifyReportStatus = verifyResponse.data.report_status
          
          if (verifyReportStatus === 'ready') {
            // 이미 완료됨 (재방문 케이스)
            await fetchResult(resultId, true)
            setReportStatus('ready')
            setIsGeneratingReport(false)
            setCurrentTab('premium')
            window.scrollTo({ top: 0, behavior: 'auto' })
            return
          }

          // generating 중 — 백엔드가 자동 생성 시작함 → polling 시작
          startPolling()
        } catch (error) {
          console.error('Payment verification failed:', error)

          // ★ 403 에러 = 결제 미검증
          if (error.response?.status === 403) {
            alert(lang === 'jp'
              ? '決済が確認できませんでした。サポートにお問い合わせください。'
              : 'Payment could not be verified. Please contact support.')
          }

          setReportStatus('failed')
          setIsGeneratingReport(false)
          setCurrentTab('basic')
        }
      }
      
      runVerify()
    }
  }, [resultId, paymentProcessed, lang, startPolling]) // eslint-disable-line react-hooks/exhaustive-deps

  // 이 useEffect는 제거됨 - verify는 첫 번째 useEffect에서 직접 호출하므로 중복 제거

  // 타임아웃 시 재시도 함수 (폴백용 - generate-report 직접 호출)
  const handleRetryGenerate = async () => {
    if (!resultId) return
    
    setReportStatus('generating')
    setIsGeneratingReport(true)
    setReportGenerationStarted(false)  // 재시도 플래그 리셋
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/test/generate-report/${resultId}?lang=${lang}`
      )
      
      if (response.data.status === 'success') {
        if (response.data.report_status === 'ready') {
          await fetchResult(resultId, true)
          setReportStatus('ready')
          setIsGeneratingReport(false)
          setCurrentTab('premium')
          window.scrollTo({ top: 0, behavior: 'auto' })
        } else {
          // generating 상태 → polling 재시작
          setPaymentProcessed(true)
        }
      } else {
        setReportStatus('failed')
        setIsGeneratingReport(false)
      }
    } catch (error) {
      console.error('리포트 재생성 실패:', error)
      setReportStatus('failed')
      setIsGeneratingReport(false)
    }
  }

  // 링크 복사 함수
  const handleCopyLink = async () => {
    trackEvent('share_click', { share_type: 'copy_link', lang })
    const shareUrl = `https://www.yourpetinsight.com/${lang}/dog-test/personality`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // UI 텍스트 가져오기 (언어별)
  const uiText = UI_TEXT[lang] || UI_TEXT.en
  
  // 로딩 중
  if (loading) {
    return <LoadingScreen lang={lang} />
  }

  // 에러 발생 - 한국어 메시지가 오면 UI_TEXT 메시지 사용
  if (error) {
    const errorMessage = (typeof error === 'string' && (error.includes('찾을 수 없습니다') || error.includes('결과'))) 
      ? uiText.error.noData 
      : error
    return <ErrorScreen message={errorMessage} onRetry={() => window.location.reload()} lang={lang} />
  }

  // 데이터 없음
  if (!resultData) {
    return <ErrorScreen message={uiText.error.noData} onRetry={() => window.location.reload()} lang={lang} />
  }

  // 언어 불일치 - 에러 화면 표시
  if (languageMismatch && resultData) {
    const originalLang = resultData.locale || resultData.lang
    return (
      <LanguageMismatchScreen 
        originalLang={originalLang}
        currentLang={lang}
        onViewOriginal={() => {
          const newPath = window.location.pathname.replace(`/${lang}/`, `/${originalLang}/`)
          window.location.href = newPath
        }}
      />
    )
  }

  // 데이터 추출
  const { pet_name, stats, archetype, mbti_code } = resultData
  
  // 펫 이름 첫 글자 대문자 변환 함수
  const capitalizeFirstLetter = (str) => {
    if (!str) return str
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
  
  const displayPetName = capitalizeFirstLetter(pet_name)
  
  // 네이티브 공유 함수 (모바일) - displayPetName 사용하므로 여기서 정의
  const handleNativeShare = async () => {
    trackEvent('share_click', { share_type: 'native_share', lang })
    const shareUrl = `https://www.yourpetinsight.com/${lang}/dog-test/personality`
    const shareData = {
      title: lang === 'jp' 
        ? `${displayPetName}の性格テスト` 
        : `${displayPetName}'s Personality Test`,
      text: lang === 'jp'
        ? `${displayPetName}の性格タイプを発見しました！あなたのペットもテストしてみてください。`
        : `I just discovered ${displayPetName}'s personality type! Take the test for your pet too.`,
      url: shareUrl
    }
    
    try {
      await navigator.share(shareData)
    } catch (err) {
      // 사용자가 취소하거나 지원 안 되는 경우
      console.log('Share cancelled or not supported')
    }
  }
  
  // ★ 개인화 preview 생성
  const personalizedPreviews = getPersonalizedPreviews(stats, displayPetName, lang)
  const ctaHook = getCTAHook(stats, displayPetName, lang)
  
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
  
  // ★ 전체 결과 저장
  const handleSaveFullPage = async () => {
    trackEvent('save_image', { save_type: 'full', lang })
    const sanitizedName = (displayPetName || 'pet')
      .replace(/[^a-zA-Z0-9가-힣ぁ-んァ-ヶ亜-熙]/g, '_')
      .substring(0, 30)
    
    const result = await saveAsFullPage(`${sanitizedName}-full-result`)
    
    if (result?.downloaded) {
      setSaveToast('saved')
      setTimeout(() => setSaveToast(null), 2000)
    } else if (result?.shared) {
      setSaveToast('shared')
      setTimeout(() => setSaveToast(null), 2000)
    } else if (result?.error) {
      alert(lang === 'jp'
        ? '画像の保存に失敗しました。もう一度お試しください。'
        : 'Failed to save image. Please try again.')
    }
  }
  
  // Stats 값 안전하게 추출 및 숫자 변환
  const getStatValue = (key) => {
    if (!stats || typeof stats !== 'object') {
      console.warn(`⚠️ Stats 객체가 없거나 유효하지 않습니다:`, stats)
      return 0
    }
    
    const value = stats[key]
    if (value === undefined || value === null) {
      console.warn(`⚠️ Stats[${key}] 값이 없습니다. 전체 stats:`, stats)
      return 0
    }
    
    // 숫자로 변환 (문자열일 경우 대비)
    const numValue = typeof value === 'number' ? value : Number(value)
    
    if (isNaN(numValue)) {
      console.warn(`⚠️ Stats[${key}] 값이 숫자가 아닙니다:`, value)
      return 0
    }
    
    // 0-100 범위로 제한
    return Math.max(0, Math.min(100, numValue))
  }

  return (
    <>

      {/* 전체 화면 리포트 생성 로딩 오버레이 */}
      {reportStatus === 'generating' && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-primary text-xl md:text-2xl font-bold mb-2">
                {uiText.premium.cta.generating}
              </p>
              <p className="text-primary/60 text-sm md:text-base">
                {uiText.premium.cta.generatingSub}
              </p>
            </div>
          </div>
        </div>
      )}
      
    <main className={`min-h-screen text-[#2D3436] ${currentTab === 'premium' ? 'bg-[#F8F7F4]' : 'bg-[#F9FBF9]'}`}>
      <div className="max-w-5xl mx-auto px-4 py-2 md:px-6 md:py-12">
        {/* Main Result Card */}
        <div className={`bg-white shadow-sm border border-primary/5 overflow-hidden
          ${currentTab === 'premium' && reportStatus === 'ready' 
            ? 'rounded-t-xl md:rounded-t-[2rem] rounded-b-none border-b-0 mb-0' 
            : 'rounded-xl mb-4 md:mb-12 md:rounded-[2rem]'}`}>
          {/* 1. Tabs (최상단) */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex gap-1">
              <button
                onClick={() => {
                  trackEvent('tab_switch', { tab_name: 'basic', lang })
                  setCurrentTab('basic')
                }}
                className={`px-3 md:px-6 py-2 rounded-lg font-medium transition-all text-xs md:text-sm ${
                  currentTab === 'basic'
                    ? 'bg-white text-primary shadow-sm'
                    : 'bg-transparent text-primary/70 hover:text-primary'
                }`}
              >
                {uiText.tabs.basic}
              </button>
              <button
                onClick={() => {
                  trackEvent('tab_switch', { tab_name: 'premium', lang })
                  showComingSoonAlert('tab')
                }}
                className={`px-3 md:px-6 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1 text-xs md:text-sm ${
                  currentTab === 'premium' && reportStatus === 'ready'
                    ? 'bg-white text-primary shadow-sm'
                    : 'bg-transparent text-primary/70 hover:text-primary'
                }`}
              >
                {reportStatus !== 'ready' && (
                  <span className="material-symbols-outlined text-sm">lock</span>
                )}
                {uiText.tabs.premium}
              </button>
            </div>
          </div>

          {/* 2. Header: Name & Share (데스크탑만 표시, Basic 탭에서만) */}
          {currentTab === 'basic' && (
          <div className="hidden md:flex md:flex-row md:items-center justify-between border-b border-gray-50 p-4 gap-4">
            {/* Left: Pet Name */}
            <div className="flex items-center gap-2 md:gap-3">
              <span className="material-symbols-outlined text-primary text-xl md:text-2xl">pets</span>
              <div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-primary tracking-tight leading-none">
                  {displayPetName}
                </h1>
                <p className="text-xs text-primary/60 font-medium mt-0.5">{uiText.petName.subtitle}</p>
              </div>
            </div>

            {/* Right: Share Buttons (Icon Only) */}
            <div className="flex gap-2 justify-center md:justify-end share-btn-group">
              <button 
                onClick={handleCopyLink}
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                  copied 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'bg-white border-gray-200 text-primary hover:bg-gray-50'
                }`}
                title={copied ? uiText.share.copied : uiText.share.copyLink}
              >
                <span className="material-symbols-outlined text-lg">
                  {copied ? 'check' : 'link'}
                </span>
              </button>
              
              {/* 네이티브 공유 버튼 (모바일에서 유용) */}
              {typeof navigator !== 'undefined' && navigator.share && (
                <button 
                  onClick={handleNativeShare}
                  className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary hover:bg-gray-50 transition-all"
                  title={lang === 'jp' ? '共有' : 'Share'}
                >
                  <span className="material-symbols-outlined text-lg">share</span>
                </button>
              )}
            </div>
          </div>
          )}

          {/* 메인 이미지 & 유형 뱃지 (기본 탭일 때만 표시) */}
          {currentTab === 'basic' && (
            <>
          <div className="p-6 md:p-10 relative flex flex-col items-center">
            {/* 모바일: 결론 우선 구조 */}
            <div className="w-full md:hidden flex flex-col items-center">
              {/* 1. Header Area (Pet Name + Share Buttons) - Basic 탭에서만 표시 */}
              {currentTab === 'basic' && (
              <div className="flex flex-col w-full mb-6">
                {/* Row 1: Share Buttons (Right Aligned) */}
                <div className="flex justify-end gap-2 w-full mb-1 px-1 share-btn-group">
                  <button 
                    onClick={handleCopyLink}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shadow-md ${
                      copied 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'bg-white border-gray-200 text-primary hover:bg-gray-50'
                    }`}
                    title={copied ? uiText.share.copied : uiText.share.copyLink}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {copied ? 'check' : 'link'}
                    </span>
                  </button>
                  
                  {/* 네이티브 공유 버튼 (모바일에서 유용) */}
                  {typeof navigator !== 'undefined' && navigator.share && (
                    <button 
                      onClick={handleNativeShare}
                      className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary hover:bg-gray-50 transition-all shadow-md"
                      title={lang === 'jp' ? '共有' : 'Share'}
                    >
                      <span className="material-symbols-outlined text-lg">share</span>
                    </button>
                  )}
                </div>
                
                {/* Row 2: Pet Name (Centered & Safe) */}
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
              )}

              {/* 2. Hero Image Area */}
              <div className="relative w-80 h-80 mb-6">
                <div className="absolute inset-8 bg-secondary/5 rounded-full blur-2xl"></div>
                {imageSrc && !imageError ? (
                  <img 
                    src={imageSrc}
                    alt={alias || mbti_code || 'Pet Archetype'}
                    className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                    onError={() => {
                      // 다음 확장자 시도
                      const imageId = archetype?.image_id
                      if (imageId) {
                        const extensions = ['.png', '.jpg', '.jpeg', '.webp']
                        const currentPath = imageSrc
                        const currentExt = extensions.find(ext => currentPath.endsWith(ext))
                        
                        if (currentExt) {
                          const currentIndex = extensions.indexOf(currentExt)
                          if (currentIndex < extensions.length - 1) {
                            // 다음 확장자 시도
                            setImageSrc(`/images/archetypes/${imageId}${extensions[currentIndex + 1]}`)
                            return
                          }
                        }
                      }
                      // 모든 확장자 시도 실패 시 fallback 표시
                      setImageError(true)
                    }}
                    onLoad={() => {
                      // 이미지 로드 성공 시 에러 상태 초기화
                      setImageError(false)
                    }}
                  />
                ) : null}
                
                {/* Fallback: 이미지가 없거나 로드 실패 시 */}
                {(!imageSrc || imageError) && (
                  <div className="relative z-10 w-full h-full bg-secondary/30 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-9xl">pets</span>
                  </div>
                )}
              </div>

              {/* 3. Title Area (이미지 바로 아래) */}
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

              {/* 4. Stats Area (Title 아래) */}
              <div className="w-full bg-gray-50 rounded-2xl p-5 space-y-3">
                {STATS_ORDER.map(({ key, color }) => {
                  const value = getStatValue(key)  // 안전한 값 추출
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

            {/* 데스크탑: 기존 레이아웃 유지 */}
            <div className="hidden md:block w-full">
              {/* TOP SECTION: Image & Stats */}
              <div className="flex flex-row items-center justify-center gap-8 mb-2">
                
                {/* 1. Hero Image Area */}
                <div className="relative w-[28rem] h-[28rem] flex-shrink-0">
                  <div className="absolute inset-8 bg-secondary/5 rounded-full blur-2xl"></div>
                  {imageSrc && !imageError ? (
                    <img 
                      src={imageSrc}
                      alt={alias || mbti_code || 'Pet Archetype'}
                      className="relative z-10 w-full h-full object-contain drop-shadow-2xl transform scale-110 origin-center"
                      onError={() => {
                        // 다음 확장자 시도
                        const imageId = archetype?.image_id
                        if (imageId) {
                          const extensions = ['.png', '.jpg', '.jpeg', '.webp']
                          const currentPath = imageSrc
                          const currentExt = extensions.find(ext => currentPath.endsWith(ext))
                          
                          if (currentExt) {
                            const currentIndex = extensions.indexOf(currentExt)
                            if (currentIndex < extensions.length - 1) {
                              // 다음 확장자 시도
                              setImageSrc(`/images/archetypes/${imageId}${extensions[currentIndex + 1]}`)
                              return
                            }
                          }
                        }
                        // 모든 확장자 시도 실패 시 fallback 표시
                        setImageError(true)
                      }}
                      onLoad={() => {
                        // 이미지 로드 성공 시 에러 상태 초기화
                        setImageError(false)
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback: 이미지가 없거나 로드 실패 시 */}
                  {(!imageSrc || imageError) && (
                    <div className="relative z-10 w-full h-full bg-secondary/30 rounded-full flex items-center justify-center transform scale-110 origin-center">
                      <span className="material-symbols-outlined text-primary text-[14rem]">pets</span>
                    </div>
                  )}
                </div>

                {/* 2. Stats (데스크탑: 우측) */}
                <div className="w-1/2 space-y-3 z-20">
                  {STATS_ORDER.map(({ key, color }) => {
                    const value = getStatValue(key)  // 안전한 값 추출
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

              {/* BOTTOM SECTION: Text (데스크탑) */}
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
            </>
          )}
        </div>

        {/* 기본 결과 섹션 (기본 탭일 때만 표시) */}
        {currentTab === 'basic' && (
          <>
            {/* ★ 전체 결과 캡처 영역 시작 */}
            <div ref={fullPageRef} style={{ background: '#F9FBF9' }}>
            {/* Core Traits */}
            {coreTraits.length > 0 && (
              <div className="space-y-4 md:space-y-12 mb-6 md:mb-16">
                <div className="flex items-center gap-2 md:gap-4 mb-2 md:mb-8">
                  <h2 className="text-xl md:text-3xl font-display font-bold text-primary">{uiText.sections.coreTraits}</h2>
                  <div className="flex-grow h-[1px] bg-primary/10"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
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
              <div className="space-y-4 md:space-y-12 mb-6 md:mb-16">
                <div className="flex items-center gap-2 md:gap-4 my-2 md:my-8">
                  <h2 className="text-xl md:text-3xl font-display font-bold text-primary">{uiText.sections.dailyLife}</h2>
                  <div className="flex-grow h-[1px] bg-primary/10"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
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
            </div>
            {/* ★ 전체 결과 캡처 영역 끝 */}

            {/* ★ 전체 결과 저장 버튼 (캡처 영역 바깥) */}
            <div className="flex justify-center mb-8 md:mb-12">
              <button
                onClick={handleSaveFullPage}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all
                  ${isSaving && saveMode === 'full'
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-wait'
                    : 'bg-white border-gray-200 text-primary hover:bg-gray-50 hover:shadow-sm'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isSaving && saveMode === 'full' ? 'hourglass_empty' : 'download'}
                </span>
                {isSaving && saveMode === 'full'
                  ? (lang === 'jp' ? '保存中...' : 'Saving...')
                  : (lang === 'jp' ? '全結果を画像で保存' : 'Save Full Results as Image')
                }
              </button>
            </div>

            {/* Premium Content Preview (잠긴 카드들) — 캡처 영역 밖 */}
            <div className="space-y-4 md:space-y-8 mb-8 md:mb-16">
              {/* 섹션 헤더 */}
              <div className="flex items-center gap-2 md:gap-4 mb-6 md:mb-8">
                <h2 className="text-xl md:text-3xl font-display font-bold text-primary">
                  {uiText.premium.premiumPreview.sectionTitle}
                </h2>
                <div className="flex-grow h-[1px] bg-primary/10"></div>
                <span className="material-symbols-outlined text-primary/40 text-lg md:text-2xl">workspace_premium</span>
              </div>
              
              {/* 잠긴 카드 그리드 (2열) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {uiText.premium.premiumPreview.sections.map((section) => (
                  <LockedPreviewCard
                    key={section.key}
                    icon={section.icon}
                    title={section.title}
                    preview={personalizedPreviews?.[section.key] || section.preview}
                    petName={displayPetName}
                    unlockButtonText={uiText.premium.premiumPreview.unlockButton}
                    onUnlockClick={() => showComingSoonAlert('locked_card')}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Premium CTA (기본 탭에서만 표시) */}
        {currentTab === 'basic' && (
          <PremiumCTA
            lang={lang}
            petName={displayPetName}
            reportStatus={reportStatus}
            reportPages={reportPages}
            isGeneratingReport={isGeneratingReport}
            isStartingPayment={isStartingPayment}
            onGetReport={showComingSoonAlert}
            onViewReport={showComingSoonAlert}
            onRetry={handleRetryGenerate}
            hookText={ctaHook}
            refundInitiated={refundInitiated}
          />
        )}
        
        {/* 프리미엄 리포트 전용 뷰어 (프리미엄 탭일 때만 표시) - 여백 없이 바로 연결 */}
        {currentTab === 'premium' && reportStatus === 'ready' && reportPages && (
          <PremiumReportViewer
            petName={displayPetName}
            reportPages={reportPages}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            uiText={uiText}
            onCopyLink={handleCopyLink}
            onNativeShare={handleNativeShare}
            isCopied={copied}
            expireAt={resultData?.expire_at}
            lang={lang}
          />
        )}
        
                  </div>
      </main>

      {/* 토스트 메시지 */}
      {saveToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 
          bg-primary text-white px-6 py-3 rounded-full shadow-lg
          flex items-center gap-2 animate-fade-in text-sm font-medium">
          <span className="material-symbols-outlined text-lg">
            {saveToast === 'shared' ? 'share' : 'check_circle'}
          </span>
          {saveToast === 'shared'
            ? (lang === 'jp' ? '共有しました！' : 'Shared!')
            : (lang === 'jp' ? '画像を保存しました！' : 'Image saved!')}
                            </div>
      )}
    </>
  )
}

export default PersonalityTestResult
