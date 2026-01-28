import { useLocation, Link } from 'react-router-dom'

function PersonalityTestResult() {
  const location = useLocation()
  const { petName, mainAnswers, bonusAnswers } = location.state || { petName: 'Your Pet' }

  return (
    <main className="min-h-screen bg-[#F9FBF9] text-[#2D3436]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Main Result Card */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-primary/5 overflow-hidden mb-12">
          <div className="p-4 text-center border-b border-dashed border-gray-100">
            <span className="inline-block px-6 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-[0.2em] uppercase">
              The Gentle Dreamer
            </span>
          </div>
          <div className="p-10 flex flex-col items-center">
            <div className="relative w-64 h-64 md:w-72 md:h-72 bg-secondary/20 rounded-full flex items-center justify-center mb-10">
              <div className="w-48 h-48 md:w-56 md:h-56 bg-secondary/30 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-8xl">pets</span>
              </div>
              <div className="absolute inset-0 border border-primary/10 rounded-full scale-110"></div>
              <div className="absolute inset-0 border border-dashed border-primary/20 rounded-full scale-125"></div>
            </div>
            <div className="text-center">
              <h2 className="text-5xl md:text-6xl font-display font-bold text-primary tracking-tight mb-3 uppercase">
                {petName}
              </h2>
              <p className="text-sm font-display text-primary/40 tracking-[0.4em] uppercase font-semibold">
                Profile ID: IPQD - SM
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="px-10 pb-12 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-primary/60 uppercase tracking-wider">Sociability</span>
                <span className="text-sm font-bold text-primary">Introverted</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-primary/60 uppercase tracking-wider">Obedience</span>
                <span className="text-sm font-bold text-primary">Compliant</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-primary/60 uppercase tracking-wider">Temperament</span>
                <span className="text-sm font-bold text-primary">Quiet</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-primary/60 uppercase tracking-wider">Emotionality</span>
                <span className="text-sm font-bold text-primary">Dependent</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-primary/60 uppercase tracking-wider">Sagacity</span>
                <span className="text-sm font-bold text-primary">Smart</span>
              </div>
              <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Traits */}
        <div className="space-y-12 mb-16">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-display font-bold text-primary">Core Traits</h2>
            <div className="flex-grow h-[1px] bg-primary/10"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border-l-4 border-[#2D5A47] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-display font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2D5A47]">auto_awesome</span>
                A Wandering Soul
              </h3>
              <p className="text-[#2D3436] leading-relaxed text-[1.05rem] font-medium opacity-90">
                {petName} drifts through life like a leisurely stroll through a spring meadow, unhurried, peaceful, pausing often to sniff a blooming flower or watch a leaf dance in the breeze. A true canine poem, {petName.toLowerCase()} is the companion for those who savor quiet, shared moments.
              </p>
            </div>
            <div className="bg-secondary/10 p-8 rounded-2xl border border-secondary/30 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-display font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2D5A47]">balance</span>
                Gentle Obedience
              </h3>
              <p className="text-[#2D3436] leading-relaxed text-[1.05rem] font-medium opacity-90">
                Soft, receptive, and ever willing to follow, provided you don't rush. {petName} shuns conflict and challenge, preferring clear, kind guidance. The obedience is not rigid; it's a harmonious dance where your wishes become quiet intentions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 my-8">
            <h2 className="text-3xl font-display font-bold text-primary">Daily Life with You</h2>
            <div className="flex-grow h-[1px] bg-primary/10"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-secondary/10 p-8 rounded-2xl border border-secondary/30 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-display font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2D5A47]">air</span>
                Rhythm of the Wind
              </h3>
              <p className="text-[#2D3436] leading-relaxed text-[1.05rem] font-medium opacity-90">
                {petName} isn't lazy by any means. Delights in exploring, trotting, and even leaping playfully through wild fields, yet always at a personal pace, graceful as a dreamer. Give the freedom to wander without haste.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border-l-4 border-[#2D5A47] shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-display font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2D5A47]">favorite</span>
                The Invisible Bond
              </h3>
              <p className="text-[#2D3436] leading-relaxed text-[1.05rem] font-medium opacity-90">
                {petName} forms bonds quietly and gently. Attaches to you much like one becomes enchanted with a beloved place, slowly, yet enduringly. Treasures tranquil moments, stress-free routines, and discreet cuddles. Ever faithful and serene.
              </p>
            </div>
          </div>
        </div>

        {/* Premium CTA */}
        <div className="relative bg-primary rounded-[2.5rem] p-10 md:p-16 text-center overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-[#2D5A47]/30 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <span className="material-symbols-outlined text-white text-6xl mb-6">workspace_premium</span>
            <h4 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">Go Beyond the Surface</h4>
            <p className="text-white/70 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
              Unlock the 25-page Premium Report to discover detailed training roadmaps, breed-specific insights, and scientific cognitive benchmarks.
            </p>
            <button className="bg-white hover:bg-gray-100 text-primary font-display font-bold text-xl py-5 px-14 rounded-full shadow-xl transition-all transform hover:-translate-y-1 active:scale-95">
              Get Premium Full Report
            </button>
            <div className="mt-8 flex items-center justify-center gap-2 text-white/40 text-sm">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              <span>Join 50,000+ happy pet parents worldwide.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PersonalityTestResult

