import { useLang } from '../contexts/LanguageContext'

function TrustSection() {
  const { lang } = useLang()

  const content = {
    en: [
      { icon: "psychology", title: "Psychology Based", desc: "Built on established behavioral theories" },
      { icon: "timer", title: "Instant Results", desc: "Get insights in less than 5 minutes" },
      { icon: "verified_user", title: "No Sign-up Required", desc: "We respect your privacy" }
    ],
    jp: [
      { icon: "psychology", title: "心理学に基づく分析", desc: "確立された行動理論に基づいています" },
      { icon: "timer", title: "すぐに結果を確認", desc: "5分以内で分析完了" },
      { icon: "verified_user", title: "登録不要", desc: "個人情報を尊重します" }
    ]
  }

  const features = content[lang] || content.en

  return (
    <section className="w-full bg-white py-10 md:py-16 relative z-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-5 text-primary flex items-center justify-center mb-3 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                <span className="material-symbols-outlined text-2xl md:text-3xl text-primary/80">
                  {feature.icon}
                </span>
              </div>
              <h3 className="text-sm md:text-base font-bold text-gray-800 mb-1">
                {feature.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-400 font-light">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrustSection