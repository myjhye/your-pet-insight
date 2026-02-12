import { useEffect } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { BlogSEO } from '../components/BlogSEO'
import { BLOG_POSTS, getPostsByCategory, CATEGORY_META, getAllCategories } from '../data/blog'

function BlogLanding() {
  const { category } = useParams()
  const location = useLocation()
  const categories = getAllCategories()

  // 라우트 변경 시 최상단으로 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])
  
  const posts = category 
    ? getPostsByCategory(category) 
    : [...BLOG_POSTS].sort((a, b) => new Date(b.date) - new Date(a.date))

  const pageTitle = category ? CATEGORY_META[category]?.title : '반려동물 블로그'
  const pageDesc = category
    ? CATEGORY_META[category]?.description
    : '강아지, 고양이 케어·훈련·행동·건강에 관한 전문 가이드.'

  return (
    <>
      <BlogSEO
        title={pageTitle}
        description={pageDesc}
        url={category ? `/ko/blog/${category}` : '/ko/blog'}
        type="website"
      />

      <main className="min-h-screen bg-[#F9FBF9]">
        {/* 블로그 헤더 섹션 */}
        <div className="bg-primary text-white py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
              {category ? `${CATEGORY_META[category]?.emoji} ${pageTitle}` : '🐾 반려동물 블로그'}
            </h1>
            <p className="text-white/70 text-lg">{pageDesc}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          {/* 카테고리 필터 */}
          <div className="flex gap-3 mb-8 flex-wrap">
            <Link to="/ko/blog"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !category ? 'bg-primary text-white' : 'bg-white text-primary border border-gray-200 hover:bg-gray-50'
              }`}>
              전체 글
            </Link>
            {categories.map(cat => (
              <Link key={cat} to={`/ko/blog/${cat}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  category === cat ? 'bg-primary text-white' : 'bg-white text-primary border border-gray-200 hover:bg-gray-50'
                }`}>
                {CATEGORY_META[cat]?.emoji} {CATEGORY_META[cat]?.title}
              </Link>
            ))}
          </div>

          {/* 포스트 목록 */}
          <div className="space-y-6">
            {posts.map(post => (
              <article key={`${post.category}-${post.slug}`}>
                <Link to={`/ko/blog/${post.category}/${post.slug}`}
                  className="block bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3 mb-3 text-sm text-gray-400">
                    <span className="px-2.5 py-1 bg-primary/5 text-primary text-xs font-semibold rounded-full uppercase">
                      {post.category === 'dog' ? '강아지' : '고양이'}
                    </span>
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime}분 읽기</span>
                  </div>
                  <h2 className="text-xl font-display font-bold text-primary group-hover:text-primary/80 transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">{post.excerpt}</p>
                  <div className="flex gap-2 mt-3">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-xs text-gray-400">#{tag}</span>
                    ))}
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}

export default BlogLanding

