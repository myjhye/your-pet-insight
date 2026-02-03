function TrustSection() {
  return (
    <div className="py-6 md:py-8 flex flex-col items-center px-4">
      <p className="text-primary/40 text-[10px] md:text-xs font-light mb-2 md:mb-4 text-center">
        Trusted by over 50,000 pet owners worldwide
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 opacity-50 md:opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
        <span className="font-display font-bold text-xs md:text-lg text-primary h-4 md:h-5 flex items-center">PetLife</span>
        <span className="font-display font-bold text-xs md:text-lg text-primary h-4 md:h-5 flex items-center">
          VET<span className="font-light">CARE</span>
        </span>
        <span className="font-display font-bold text-xs md:text-lg text-primary h-4 md:h-5 flex items-center">
          Animal<span className="text-accent">Weekly</span>
        </span>
      </div>
    </div>
  )
}

export default TrustSection
