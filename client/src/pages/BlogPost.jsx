import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BlogSEO } from '../components/BlogSEO'
import { getPostBySlug, getPostsByCategory } from '../data/blog'

function BlogPost() {
  const { category, slug } = useParams()
  const post = getPostBySlug(category, slug)

  if (!post) {
    return (
      <main className="min-h-screen bg-[#F9FBF9] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">글을 찾을 수 없습니다</h1>
          <Link to="/ko/blog" className="text-primary underline">← 블로그로 돌아가기</Link>
        </div>
      </main>
    )
  }

  const relatedPosts = getPostsByCategory(category).filter(p => p.slug !== slug).slice(0, 3)

  return (
    <>
      <BlogSEO
        title={post.title}
        description={post.excerpt}
        url={`/ko/blog/${category}/${slug}`}
        publishedDate={post.date}
        category={category}
      />

      <main className="min-h-screen bg-[#F9FBF9]">
        {/* Breadcrumb — 한국어 */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2 text-sm">
            <Link to="/ko/blog" className="text-primary/60 hover:text-primary">블로그</Link>
            <span className="text-gray-300">/</span>
            <Link to={`/ko/blog/${category}`} className="text-primary/60 hover:text-primary">
              {category === 'dog' ? '강아지' : '고양이'}
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-primary/40 truncate">{post.title}</span>
          </div>
        </div>

        {/* 포스트 헤더 */}
        <header className="max-w-3xl mx-auto px-4 pt-8 md:pt-12 pb-6">
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
            <span className="px-3 py-1 bg-primary/5 text-primary text-xs font-semibold rounded-full">
              {category === 'dog' ? '강아지' : '고양이'}
            </span>
            <time>{post.date}</time>
            <span>·</span>
            <span>{post.readTime}분 읽기</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">{post.excerpt}</p>
        </header>

        {/* 본문 */}
        <article className="max-w-3xl mx-auto px-4 pb-12">
          <div className="bg-white rounded-2xl p-6 md:p-10 border border-gray-100 shadow-sm">
            <div className="prose prose-lg prose-green max-w-none
              prose-headings:text-primary prose-headings:font-display
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-3
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-[#2D3436] prose-p:leading-relaxed
              prose-strong:text-primary
              prose-a:text-primary prose-a:underline
              prose-ul:space-y-2 prose-li:text-[#2D3436]
              prose-blockquote:border-primary/30 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {post.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* 서비스 연결 CTA */}
          <div className="mt-8 p-6 md:p-8 bg-primary/5 rounded-2xl border border-primary/10 text-center">
            <p className="text-primary font-display font-bold text-xl mb-2">
              🐾 우리 아이 성격이 궁금하다면?
            </p>
            <p className="text-primary/60 mb-4">
              무료 성격 테스트로 우리 {category === 'dog' ? '강아지' : '고양이'}의 숨겨진 성격을 알아보세요.
            </p>
            <Link to={`/en/${category}-test/personality`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors">
              무료 테스트 시작하기 →
            </Link>
          </div>

          {/* 관련 글 */}
          {relatedPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-display font-bold text-primary mb-6">
                {category === 'dog' ? '🐕 다른 강아지 글' : '🐈 다른 고양이 글'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedPosts.map(rp => (
                  <Link key={rp.slug} to={`/ko/blog/${rp.category}/${rp.slug}`}
                    className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all group">
                    <h3 className="font-bold text-primary group-hover:text-primary/80 text-sm leading-snug mb-2">
                      {rp.title}
                    </h3>
                    <p className="text-xs text-gray-400">{rp.readTime}분 읽기</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </>
  )
}

export default BlogPost

