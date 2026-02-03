import { Link } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'

function Breadcrumb({ items }) {
  const { localePath } = useLang()

  return (
    // overflow-x-auto: 경로가 길어질 경우 가로 스크롤 허용 (레이아웃 깨짐 방지)
    <nav className="flex flex-wrap items-center gap-2 mb-6 overflow-x-auto whitespace-nowrap py-1">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && (
            <span className="text-gray-300 text-xs font-medium">/</span>
          )}
          {item.href ? (
            <Link
              to={localePath(item.href)}
              // 터치 영역(padding)을 주어 모바일에서 누르기 쉽게 만듦
              className="text-gray-500 hover:text-primary text-xs md:text-sm font-medium transition-colors py-1"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-primary text-xs md:text-sm font-bold bg-primary/5 px-2 py-0.5 rounded-md">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

export default Breadcrumb