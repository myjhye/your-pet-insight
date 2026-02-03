function TrustSection() {
  const features = [
    {
      icon: "psychology",
      title: "Psychology Based",
      desc: "Built on established behavioral theories"
    },
    {
      icon: "timer",
      title: "Instant Results",
      desc: "Get insights in less than 5 minutes"
    },
    {
      icon: "verified_user",
      title: "No Sign-up Required",
      desc: "We respect your privacy"
    }
  ]

  return (
    // [수정 포인트]
    // 1. mt-12 md:mt-24 제거 -> mt-0 : 위쪽 카드 영역과 딱 붙임
    // 2. border-t 제거 : 경계선 대신 배경색 차이로 자연스럽게 연결 (원한다면 border-t border-gray-50 정도만)
    // 3. bg-white : 배경을 흰색으로 유지하여 깔끔하게 마무
    <section className="w-full bg-white py-10 md:py-16 relative z-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center group">
              {/* 아이콘 배경을 조금 더 연하게 수정해서 부드럽게 */}
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gray-50 text-primary flex items-center justify-center mb-3 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
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