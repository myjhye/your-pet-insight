function TrustSection() {
  return (
    <div className="mt-8 sm:mt-12 md:mt-16 flex flex-col items-center px-4">
      <p className="text-primary/40 text-xs sm:text-sm font-light mb-3 sm:mb-4 text-center">
        Trusted by over 50,000 pet owners worldwide
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
        <span className="font-display font-bold text-sm sm:text-lg text-primary">PetLife</span>
        <span className="font-display font-bold text-sm sm:text-lg text-primary">
          VET<span className="font-light">CARE</span>
        </span>
        <span className="font-display font-bold text-sm sm:text-lg text-primary">
          Animal<span className="text-accent">Weekly</span>
        </span>
      </div>
    </div>
  )
}

export default TrustSection
