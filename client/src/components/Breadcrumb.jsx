import { Link } from 'react-router-dom'

function Breadcrumb({ items }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 mb-4">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-primary/40 text-sm font-medium">/</span>}
          {item.href ? (
            <Link
              to={item.href}
              className="text-accent hover:text-accent/80 text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-primary text-sm font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}

export default Breadcrumb
