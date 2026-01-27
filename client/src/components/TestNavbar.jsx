function TestNavbar({ answered, total }) {
  const progress = (answered / total) * 100

  return (
    <div className="w-full bg-primary/90 backdrop-blur-md border-b border-white/10 px-6 py-3 fixed top-[64px] z-40">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-white/80 text-sm font-medium">Progress</span>
          <div className="text-secondary font-semibold text-sm bg-white/10 px-3 py-1 rounded-full border border-white/5">
            {answered} of {total} Answered
          </div>
        </div>
        <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden relative">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-orange-500 rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(52,211,153,0.8)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default TestNavbar
