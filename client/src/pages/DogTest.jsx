import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../contexts/LanguageContext'
import { useQuestions } from '../contexts/QuestionsContext'
import Breadcrumb from '../components/Breadcrumb'
import TestCategoryCard from '../components/TestCategoryCard'

const testCategories = [
  {
    id: 'personality',
    title: 'Personality Assessment',
    description: 'Analyze temperament, social style, and energy levels.',
    subDescription: "Discover your dog's unique traits and behaviors.",
    // [수정] testCount 대신 duration 추가
    duration: '5 min',
    // [추가] 추천 배지 (옵션)
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'intelligence',
    title: 'Intelligence Check',
    description: 'Features IQ and Problem Solving tests.',
    subDescription: 'Assess cognitive abilities and learning potential.',
    duration: '8 min',
    image: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&auto=format&fit=crop',
    bgColor: 'bg-green-50',
  },
  {
    id: 'relationship',
    title: 'Relationship Index',
    description: 'Shows the Attachment Index test.',
    subDescription: 'Understand the bond between you and your pet.',
    duration: '3 min',
    image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&auto=format&fit=crop',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'health',
    title: 'Health & Wellness',
    description: 'Contains Obesity and Stress checks.',
    subDescription: 'Quick wellness checks for peace of mind.',
    duration: '4 min',
    badge: 'New', // 'New' 배지 추가
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop',
    bgColor: 'bg-yellow-50',
  },
]

function DogTest() {
  const navigate = useNavigate()
  const { lang, localePath } = useLang()
  const { prefetchQuestions } = useQuestions()

  useEffect(() => {
    prefetchQuestions('dog_v1', lang)
  }, [prefetchQuestions, lang])

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Dog Tests' },
  ]

  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'personality') {
      navigate(localePath('/dog-test/personality'))
    } else {
      console.log(`Category clicked: ${categoryId}`)
    }
  }

  return (
    <main className="flex-grow bg-[#F9FBF9] min-h-screen pb-20">
      <div className="px-4 md:px-10 lg:px-20 py-6 md:py-12">
        <div className="max-w-[1024px] mx-auto">
          <Breadcrumb items={breadcrumbItems} />
          
          <div className="flex flex-col gap-3 mb-8 md:mb-12">
            <h1 className="text-primary text-2xl md:text-4xl font-display font-extrabold leading-tight tracking-tight">
              Choose a Test Category
            </h1>
            <p className="text-primary/60 text-sm md:text-base font-normal leading-relaxed">
              Select a category below to view available assessments for your dog.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-8">
            {testCategories.map((category) => (
              <TestCategoryCard
                key={category.id}
                {...category}
                onClick={() => handleCategoryClick(category.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

export default DogTest