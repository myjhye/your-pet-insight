function TrustSection() {
  return (
    <div className="mt-16 flex flex-col items-center">
      <p className="text-primary/40 text-sm font-light mb-4">
        Trusted by over 50,000 pet owners worldwide
      </p>
      <div className="flex items-center space-x-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
        <span className="font-display font-bold text-lg text-primary">PetLife</span>
        <span className="font-display font-bold text-lg text-primary">
          VET<span className="font-light">CARE</span>
        </span>
        <span className="font-display font-bold text-lg text-primary">
          Animal<span className="text-accent">Weekly</span>
        </span>
      </div>
    </div>
  )
}

export default TrustSection
