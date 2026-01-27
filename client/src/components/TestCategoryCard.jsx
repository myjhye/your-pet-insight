function TestCategoryCard({ title, description, subDescription, testCount, image, bgColor, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col rounded-2xl bg-card-bg shadow-soft border border-white/10 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className={`h-60 w-full ${bgColor} relative overflow-hidden`}>
        <img
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={image}
        />
        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-text-dark text-xs font-bold shadow-sm">
          {testCount} {testCount === 1 ? 'Test' : 'Tests'}
        </div>
      </div>
      <div className="flex flex-col flex-grow p-6 md:p-8 gap-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-text-dark text-2xl font-bold leading-tight">{title}</h3>
          <p className="text-gray-500 text-sm font-medium leading-relaxed">{description}</p>
          <p className="text-gray-400 text-xs">{subDescription}</p>
        </div>
        <div className="mt-auto pt-4">
          <div className="flex w-full items-center justify-center rounded-xl h-12 bg-accent text-primary hover:bg-accent/90 transition-colors gap-2 text-base font-bold shadow-sm group-hover:shadow-md">
            Start Test
            <span className="material-symbols-outlined text-[20px] transform group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestCategoryCard

