function Hero() {
  return (
    <div className="text-center max-w-4xl mx-auto mb-8 md:mb-10 relative z-10 px-2">
      <span className="inline-block py-0.5 px-2 md:px-3 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-semibold tracking-wider uppercase mb-2 border border-primary/20">
        Scientifically backed pet psychology
      </span>
      <h1 className="text-[2rem] md:text-5xl lg:text-6xl font-display font-bold text-primary mb-3 leading-tight tracking-tight px-2">
        Understand Your <br className="hidden md:block" /> <span className="text-accent">Pet Better</span>
      </h1>
      <p className="text-primary/60 text-sm md:text-xl font-light max-w-xl md:max-w-2xl mx-auto leading-tight md:leading-relaxed font-sans px-4">
        Discover the unique personality traits of your companion through our comprehensive behavioral assessment.
      </p>
    </div>
  )
}

export default Hero
