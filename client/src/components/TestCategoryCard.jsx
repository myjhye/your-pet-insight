function TestCategoryCard({ title, description, subDescription, duration, badge, image, bgColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col rounded-3xl bg-white shadow-sm cursor-pointer transform-gpu transition-transform duration-300 ease-out md:hover:-translate-y-1 md:hover:shadow-xl"
    >
      {/* Border Overlay */}
      <div className="absolute inset-0 rounded-3xl border border-gray-100 pointer-events-none z-20 transition-colors duration-300 group-hover:border-primary/20"></div>

      {/* 이미지 영역 */}
      <div className={`h-40 md:h-56 w-full ${bgColor} relative overflow-hidden rounded-t-3xl`}>
        <img
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 will-change-transform"
          src={image}
          loading="lazy"
        />
        
        {/* [수정] 상단 배지 영역 */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 flex flex-col gap-2 items-end z-10">
          
          {/* 1. 소요 시간 배지 (항상 표시) */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-primary text-[10px] md:text-xs font-bold shadow-sm border border-white/50">
            <span className="material-symbols-outlined text-[14px] md:text-[16px]">schedule</span>
            {duration}
          </div>

          {/* 2. 추가 배지 (Popular, New 등 - 있을 때만 표시) */}
          {badge && (
            <div className={`
              px-3 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm border border-white/20
              ${badge === 'Popular' ? 'bg-accent text-white' : 'bg-primary text-white'}
            `}>
              {badge}
            </div>
          )}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex flex-col flex-grow p-5 md:p-8 gap-3 md:gap-4 rounded-b-3xl bg-white relative z-10">
        <div>
          <h3 className="text-gray-900 text-xl md:text-2xl font-bold leading-tight mb-1 md:mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm font-medium leading-relaxed line-clamp-2">
            {description}
          </p>
          <p className="text-gray-400 text-xs mt-1 hidden md:block">
            {subDescription}
          </p>
        </div>

        <div className="mt-auto pt-2 md:pt-4">
          <div className="flex w-full items-center justify-center rounded-xl py-3 md:py-3.5 bg-primary text-white transition-all duration-300 gap-2 text-sm md:text-base font-bold shadow-md group-hover:shadow-lg">
            Start Test
            <span className="material-symbols-outlined text-[18px] md:text-[20px] transition-transform duration-300 group-hover:translate-x-1">
              arrow_forward
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestCategoryCard