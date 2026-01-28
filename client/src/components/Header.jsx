import { Link } from 'react-router-dom'

function Header({ fixed = false }) {
  return (
    <div className={`w-full bg-primary ${fixed ? 'fixed top-0 left-0 z-50' : ''}`}>
      <header className="w-full px-8 py-6 flex justify-between items-center max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full border-2 border-secondary flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
              <span className="material-symbols-outlined text-secondary text-sm">pets</span>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-white">
              <span className="text-secondary font-light">Your</span> Pet Insight
            </span>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <nav className="flex space-x-6 text-sm font-medium text-secondary/80">
            <a className="hover:text-accent transition-colors" href="#">Methodology</a>
            <a className="hover:text-accent transition-colors" href="#">About Us</a>
            <a className="hover:text-accent transition-colors" href="#">Blog</a>
          </nav>
          <div className="relative group">
            <button className="flex items-center space-x-2 text-white hover:text-accent transition-colors text-sm font-medium">
              <span className="material-symbols-outlined text-xl">language</span>
              <span>English</span>
            </button>
          </div>
        </div>
        <div className="md:hidden">
          <button className="text-white hover:text-accent focus:outline-none p-1">
            <span className="material-symbols-outlined text-3xl">menu</span>
          </button>
        </div>
      </header>
    </div>
  )
}

export default Header
