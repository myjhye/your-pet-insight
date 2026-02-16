// ★ 마크다운 raw import
// 강아지
import separationAnxiety from './dog/separation-anxiety-tips.md?raw'
import leashTraining from './dog/leash-training-basics.md?raw'
import crateTraining from './dog/crate-training-benefits.md?raw'
import dentalHealth from './dog/dental-health-tips.md?raw'
import dogBodyLanguage from './dog/dog-body-language.md?raw'
import exerciseByBreed from './dog/exercise-needs-by-breed.md?raw'
import puppySocialization from './dog/puppy-socialization-guide.md?raw'
import rawDietVsKibble from './dog/raw-diet-vs-kibble.md?raw'
import seniorDogCare from './dog/senior-dog-care.md?raw'
import travelingWithDog from './dog/traveling-with-your-dog.md?raw'

export const BLOG_POSTS = [
  // ===== 강아지 (10개) =====
  {
    slug: 'separation-anxiety-tips',
    category: 'dog',
    title: '강아지 분리불안, 이렇게 하면 극복할 수 있어요 (7가지 방법)',
    date: '2026-01-15',
    readTime: 8,
    tags: ['행동', '불안', '훈련'],
    content: separationAnxiety,
  },
  {
    slug: 'leash-training-basics',
    category: 'dog',
    title: '산책 훈련 기초: 강아지가 줄을 당기지 않게 하는 법',
    excerpt: '산책은 보호자와 반려견 모두에게 즐거워야 합니다. 단계별 리쉬 트레이닝 방법을 소개합니다.',
    date: '2026-01-18',
    readTime: 7,
    tags: ['훈련', '산책', '기초'],
    content: leashTraining,
  },
  {
    slug: 'puppy-socialization-guide',
    category: 'dog',
    title: '강아지 사회화 완벽 가이드: 시기, 방법, 흔한 실수',
    excerpt: '생후 16주까지의 경험이 강아지의 일생을 결정합니다. 올바른 사회화 방법을 알아보세요.',
    date: '2026-01-22',
    readTime: 9,
    tags: ['퍼피', '사회화', '행동'],
    content: puppySocialization,
  },
  {
    slug: 'raw-diet-vs-kibble',
    category: 'dog',
    title: '생식 vs 사료, 과학은 뭐라고 할까? 강아지 영양의 진실',
    excerpt: '생식과 사료 논쟁은 뜨겁습니다. 연구 근거를 바탕으로 객관적으로 비교해봅니다.',
    date: '2026-01-25',
    readTime: 10,
    tags: ['영양', '건강', '식단'],
    content: rawDietVsKibble,
  },
  {
    slug: 'senior-dog-care',
    category: 'dog',
    title: '노견 돌봄 가이드: 우리 아이의 황금기를 편안하게',
    excerpt: '강아지는 우리가 바라는 것보다 빨리 늙어갑니다. 시니어 반려견을 위한 케어법을 알아보세요.',
    date: '2026-01-28',
    readTime: 8,
    tags: ['시니어', '건강', '케어'],
    content: seniorDogCare,
  },
  {
    slug: 'dog-body-language',
    category: 'dog',
    title: '강아지 보디랭귀지: 보호자라면 꼭 알아야 할 15가지 신호',
    excerpt: '강아지는 늘 우리에게 말하고 있습니다. 몸짓 언어를 이해하면 관계가 달라집니다.',
    date: '2026-02-01',
    readTime: 7,
    tags: ['행동', '소통', '기초'],
    content: dogBodyLanguage,
  },
  {
    slug: 'crate-training-benefits',
    category: 'dog',
    title: '켄넬 훈련, 제대로 하면 이렇게 좋습니다',
    excerpt: '켄넬은 감옥이 아닌 안전한 공간입니다. 인도적인 켄넬 훈련법을 소개합니다.',
    date: '2026-02-03',
    readTime: 7,
    tags: ['훈련', '켄넬', '기초'],
    content: crateTraining,
  },
  {
    slug: 'exercise-needs-by-breed',
    category: 'dog',
    title: '우리 강아지 운동량, 얼마나 필요할까? 견종별 가이드',
    excerpt: '모든 강아지가 같은 운동량이 필요하지 않습니다. 견종에 맞는 활동량을 찾아보세요.',
    date: '2026-02-05',
    readTime: 9,
    tags: ['운동', '견종', '건강'],
    content: exerciseByBreed,
  },
  {
    slug: 'dental-health-tips',
    category: 'dog',
    title: '강아지 치아 관리: 3살 이전 80%가 잇몸 질환을 겪는 이유',
    excerpt: '대부분의 보호자가 간과하는 치아 건강. 우리 아이의 이빨을 지키는 방법을 알아보세요.',
    date: '2026-02-07',
    readTime: 6,
    tags: ['건강', '치아', '예방'],
    content: dentalHealth,
  },
  {
    slug: 'traveling-with-your-dog',
    category: 'dog',
    title: '반려견과 여행하기: 자동차, 비행기, 숙소 완벽 가이드',
    excerpt: '반려견과의 여행, 준비만 잘 하면 스트레스 없이 즐길 수 있습니다.',
    date: '2026-02-10',
    readTime: 10,
    tags: ['여행', '팁', '안전'],
    content: travelingWithDog,
  },
]

// ===== 헬퍼 함수 =====

export const getPostsByCategory = (category) =>
  BLOG_POSTS.filter(p => p.category === category)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

export const getPostBySlug = (category, slug) =>
  BLOG_POSTS.find(p => p.category === category && p.slug === slug)

export const getAllCategories = () => ['dog']

export const CATEGORY_META = {
  dog: {
    title: '강아지 케어 & 훈련',
    description: '강아지 행동, 훈련, 영양, 건강에 관한 전문 가이드.',
    emoji: '🐕',
  },
}

