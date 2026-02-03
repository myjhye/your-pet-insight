import { useLang } from '../contexts/LanguageContext'

function Hero() {
  const { lang } = useLang()

  const content = {
    en: {
      badge: "Scientifically backed pet psychology",
      titlePre: "Understand Your",
      titleHighlight: "Pet Better",
      desc: "Discover the unique personality traits of your companion through our comprehensive behavioral assessment."
    },
    jp: {
      badge: "科学的根拠に基づいたペット心理学",
      titlePre: "ペットを",
      titleHighlight: "より深く理解する",
      desc: "包括的な行動分析を通じて、あなたのパートナーのユニークな性格特性を発見しましょう。"
    }
  }

  const t = content[lang] || content.en

  return (
    <div className="text-center max-w-4xl mx-auto mb-6 md:mb-10 relative z-10 px-2">
      <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold tracking-wider uppercase mb-2 border border-primary/20">
        {t.badge}
      </span>
      
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary mb-3 leading-tight tracking-tight px-2">
        {t.titlePre} <br className="hidden sm:block" /> <span className="text-accent">{t.titleHighlight}</span>
      </h1>
      
      <p className="text-primary/60 text-sm sm:text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed font-sans px-4">
        {t.desc}
      </p>
    </div>
  )
}

export default Hero