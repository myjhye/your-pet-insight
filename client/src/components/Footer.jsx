import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'

function Footer() {
  const { lang } = useLang()

  const policyLinks = [
    {
      path: '/terms',
      en: 'Terms of Service',
      jp: '利用規約'
    },
    {
      path: '/privacy',
      en: 'Privacy Policy',
      jp: 'プライバシーポリシー'
    },
    {
      path: '/refund',
      en: 'Refund Policy',
      jp: '返金ポリシー'
    }
  ]

  return (
    <footer className="w-full text-center py-6 md:py-8 text-secondary/40 text-sm mt-auto border-t border-white/5 bg-primary relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col items-center space-y-3 md:space-y-6">
        <div className="flex flex-row flex-wrap justify-center items-center gap-4 text-xs font-medium uppercase tracking-widest">
          {policyLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="hover:text-secondary transition-colors"
            >
              {lang === 'jp' ? link.jp : link.en}
            </Link>
          ))}
        </div>
        <p className="max-w-md mx-auto px-4 text-xs font-light leading-tight md:leading-relaxed">
          PetInsight is dedicated to strengthening the bond between humans and animals through behavioral science and empathy.
        </p>
        <p className="text-xs font-light">© 2026 YourPetInsight. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer

