import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../components/Breadcrumb'
import TestCategoryCard from '../components/TestCategoryCard'
import BackgroundEffects from '../components/BackgroundEffects'

const testCategories = [
  {
    id: 'personality',
    title: 'Personality Assessment',
    description: 'Includes MBTI and Temperament tests.',
    subDescription: "Discover your dog's unique traits and behaviors.",
    testCount: 2,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop',
    bgColor: 'bg-orange-100',
  },
  {
    id: 'intelligence',
    title: 'Intelligence Check',
    description: 'Features IQ and Problem Solving tests.',
    subDescription: 'Assess cognitive abilities and learning potential.',
    testCount: 3,
    image: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&auto=format&fit=crop',
    bgColor: 'bg-green-100',
  },
  {
    id: 'relationship',
    title: 'Relationship Index',
    description: 'Shows the Attachment Index test.',
    subDescription: 'Understand the bond between you and your pet.',
    testCount: 1,
    image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&auto=format&fit=crop',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'health',
    title: 'Health & Wellness',
    description: 'Contains Obesity and Stress checks.',
    subDescription: 'Quick wellness checks for peace of mind.',
    testCount: 4,
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop',
    bgColor: 'bg-yellow-100',
  },
]

function DogTest() {
  const navigate = useNavigate()

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Dog Tests' },
  ]

  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'personality') {
      navigate('/dog-test/personality')
    } else {
      console.log(`Category clicked: ${categoryId}`)
      // TODO: Navigate to other test categories
    }
  }

  return (
    <main className="flex-grow relative overflow-hidden">
      <BackgroundEffects />
      
      <div className="relative z-10 px-6 md:px-20 lg:px-40 py-8">
        <div className="max-w-[1024px] mx-auto">
          <Breadcrumb items={breadcrumbItems} />
          
          <div className="flex flex-wrap justify-between gap-3 px-4 mb-8">
            <div className="flex min-w-72 flex-col gap-2">
              <h1 className="text-white text-3xl md:text-4xl font-display font-extrabold leading-tight tracking-tight">
                Choose a Test Category
              </h1>
              <p className="text-secondary/80 text-base font-normal leading-normal">
                Select a category below to view available assessments for your dog.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
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

