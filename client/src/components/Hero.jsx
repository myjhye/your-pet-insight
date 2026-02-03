function Hero() {
  return (
    <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16 relative z-10 px-2">
      <span className="inline-block py-1 px-2 sm:px-3 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold tracking-wider uppercase mb-3 sm:mb-4 border border-primary/20">
        Scientifically backed pet psychology
      </span>
      <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary mb-4 sm:mb-6 leading-tight tracking-tight px-2">
        Understand Your <br className="hidden sm:block" /> <span className="text-accent">Pet Better</span>
      </h1>
      <p className="text-primary/60 text-base sm:text-lg md:text-xl font-light max-w-2xl mx-auto leading-relaxed font-sans px-4">
        Discover the unique personality traits of your companion through our comprehensive behavioral assessment.
      </p>
    </div>
  )
}

export default Hero
