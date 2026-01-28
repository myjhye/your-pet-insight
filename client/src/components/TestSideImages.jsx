import { useEffect, useRef, useState } from 'react'

// 개별 사이드 이미지 컴포넌트
function SideImage({ src, isLeft }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3, rootMargin: '-30px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  // 왼쪽은 오른쪽으로 기울이고, 오른쪽은 왼쪽으로 기울임
  const tiltClass = isLeft ? 'rotate-[12deg]' : '-rotate-[12deg]'

  return (
    <div
      ref={ref}
      className={`
        absolute top-1/2 -translate-y-1/2 pointer-events-none
        transition-all duration-700 ease-out
        ${isLeft ? '-left-32 lg:-left-52 xl:-left-64' : '-right-32 lg:-right-52 xl:-right-64'}
        ${isVisible 
          ? `opacity-30 translate-x-0 scale-100 ${tiltClass}` 
          : `opacity-0 ${isLeft ? '-translate-x-8' : 'translate-x-8'} scale-90 rotate-0`
        }
        hidden lg:block
      `}
    >
      <img
        src={src}
        alt=""
        className="w-48 lg:w-64 xl:w-80 h-auto object-contain drop-shadow-xl"
      />
    </div>
  )
}

// 메인 컴포넌트 - 질문과 함께 사용
function QuestionWithSideImage({ 
  children, 
  questionIndex, 
  imageConfig = {},
  basePath = '/images/dog' 
}) {
  // imageConfig: { [questionIndex]: { image: 'filename.png', isLeft: boolean } }
  const config = imageConfig[questionIndex]

  if (!config) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      <SideImage
        src={`${basePath}/${config.image}`}
        isLeft={config.isLeft}
      />
      {children}
    </div>
  )
}

export { SideImage, QuestionWithSideImage }
export default QuestionWithSideImage
