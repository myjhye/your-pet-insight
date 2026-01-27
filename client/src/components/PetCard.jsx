const petConfig = {
  cat: {
    label: 'Feline',
    labelBg: 'bg-teal-50',
    labelText: 'text-teal-700',
    duration: '5 min',
    iconBg: 'bg-teal-50',
    iconColor: 'text-primary',
    gradientFrom: 'from-teal-400',
    gradientTo: 'to-secondary',
    buttonBg: 'bg-primary',
    buttonHover: 'hover:bg-teal-800',
    buttonText: 'text-white',
    buttonShadow: 'shadow-teal-900/10',
    title: 'Start Cat Test',
    description: "Analyze your cat's behavior patterns to understand their independence and affection style.",
    icon: (
      <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M8.5,10.5A1.5,1.5 0 1,0 10,12A1.5,1.5 0 0,0 8.5,10.5M15.5,10.5A1.5,1.5 0 1,0 17,12A1.5,1.5 0 0,0 15.5,10.5M12,16C13.5,16 14.8,15.2 15.5,14H8.5C9.2,15.2 10.5,16 12,16Z" />
    ),
  },
  dog: {
    label: 'Canine',
    labelBg: 'bg-orange-50',
    labelText: 'text-orange-700',
    duration: '6 min',
    iconBg: 'bg-orange-50',
    iconColor: 'text-accent',
    gradientFrom: 'from-accent',
    gradientTo: 'to-orange-400',
    buttonBg: 'bg-accent',
    buttonHover: 'hover:bg-[#ffbd99]',
    buttonText: 'text-primary',
    buttonShadow: 'shadow-orange-900/10',
    title: 'Start Dog Test',
    description: "Uncover your dog's social drives, energy levels, and unique motivational factors.",
    icon: (
      <path d="M19,5.5C19,5.5 16,7.5 16,10C16,12.5 19,14.5 19,14.5V5.5M5,5.5C5,5.5 8,7.5 8,10C8,12.5 5,14.5 5,14.5V5.5M12,2C10.5,2 5,2 5,5.5V14.5C5,17 7,19 9,19H15C17,19 19,17 19,14.5V5.5C19,2 13.5,2 12,2M12,16A2,2 0 1,1 14,14A2,2 0 0,1 12,16M10,9A1,1 0 1,1 11,8A1,1 0 0,1 10,9M14,9A1,1 0 1,1 15,8A1,1 0 0,1 14,9Z" />
    ),
  },
}

function PetCard({ type, onClick }) {
  const config = petConfig[type]

  return (
    <div
      onClick={onClick}
      className="bg-card-bg rounded-2xl p-8 shadow-soft transform transition hover:-translate-y-2 hover:shadow-lg duration-300 flex flex-col items-center relative group overflow-hidden border border-white/10 cursor-pointer"
    >
      <div className={`absolute top-0 w-full h-1 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo}`}></div>
      
      <div className="w-full flex justify-between items-start mb-6">
        <div className={`${config.labelBg} ${config.labelText} px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide`}>
          {config.label}
        </div>
        <div className="flex items-center text-gray-400 text-sm">
          <span className="material-symbols-outlined text-base mr-1">schedule</span>
          {config.duration}
        </div>
      </div>

      <div className="relative w-48 h-48 mb-6 flex items-center justify-center">
        <div className={`absolute inset-0 ${config.iconBg} rounded-full scale-90 group-hover:scale-100 transition-transform duration-500 ease-out`}></div>
        <svg
          className={`w-32 h-32 ${config.iconColor} z-10 relative transform group-hover:scale-110 transition-transform duration-300`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          {config.icon}
        </svg>
      </div>

      <h2 className="text-2xl font-display font-bold text-text-dark mb-2">{config.title}</h2>
      <p className="text-gray-500 text-sm mb-8 text-center px-4 font-light">
        {config.description}
      </p>

      <div className={`w-full ${config.buttonBg} ${config.buttonText} font-semibold py-4 px-6 rounded-xl ${config.buttonHover} transition-all duration-300 flex items-center justify-center group/btn shadow-lg ${config.buttonShadow}`}>
        <span>Begin Assessment</span>
        <span className="material-symbols-outlined ml-2 text-lg transform group-hover:translate-x-1 transition-transform">
          arrow_forward
        </span>
      </div>
    </div>
  )
}

export default PetCard

