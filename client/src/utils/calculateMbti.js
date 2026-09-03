import { ARCHETYPES_DATA } from '../data/archetypesData'

// 질문 메타데이터
export const DOG_QUESTIONS_META = [
  // Stage 1 (id 1-20)
  { id: 1, axis: 'E', is_reverse: false },
  { id: 2, axis: 'E', is_reverse: true },
  { id: 3, axis: 'E', is_reverse: false },
  { id: 4, axis: 'E', is_reverse: false },
  { id: 5, axis: 'E', is_reverse: false },
  { id: 6, axis: 'S', is_reverse: false },
  { id: 7, axis: 'S', is_reverse: true },
  { id: 8, axis: 'S', is_reverse: false },
  { id: 9, axis: 'S', is_reverse: false },
  { id: 10, axis: 'S', is_reverse: false },
  { id: 11, axis: 'F', is_reverse: false },
  { id: 12, axis: 'F', is_reverse: true },
  { id: 13, axis: 'F', is_reverse: true },
  { id: 14, axis: 'F', is_reverse: false },
  { id: 15, axis: 'F', is_reverse: true },
  { id: 16, axis: 'J', is_reverse: false },
  { id: 17, axis: 'J', is_reverse: true },
  { id: 18, axis: 'J', is_reverse: false },
  { id: 19, axis: 'J', is_reverse: true },
  { id: 20, axis: 'J', is_reverse: false },
  // Stage 2 (id 21-25)
  { id: 21, axis: 'Style', is_reverse: false },
  { id: 22, axis: 'Bond', is_reverse: false },
  { id: 23, axis: 'Logic', is_reverse: false },
  { id: 24, axis: 'Routine', is_reverse: false },
  { id: 25, axis: 'Goal', is_reverse: false },
]

function capitalizeFirstLetter(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function replacePlaceholders(obj, petName, locale) {
  const displayPetName = capitalizeFirstLetter(petName)

  if (typeof obj === 'string') {
    return obj.replace(/\{\{pet_name\}\}/g, displayPetName)
  }
  if (Array.isArray(obj)) {
    return obj.map(item => replacePlaceholders(item, petName, locale))
  }
  if (obj && typeof obj === 'object') {
    if (locale && typeof obj[locale] === 'string') {
      return obj[locale].replace(/\{\{pet_name\}\}/g, displayPetName)
    }
    const result = {}
    for (const key of Object.keys(obj)) {
      result[key] = replacePlaceholders(obj[key], petName, locale)
    }
    return result
  }
  return obj
}

function convertScore(likertScore) {
  // Likert (-3 ~ 3) -> 5점 척도 (1 ~ 5) 선형 매핑
  return ((likertScore + 3) / 6 * 4) + 1
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function calculateMbti({ petName, mainAnswers, bonusAnswers = {}, locale = 'ko' }) {
  const questionMetaMap = {}
  DOG_QUESTIONS_META.forEach(q => {
    questionMetaMap[q.id.toString()] = q
  })

  const axisScores = { E: 0, S: 0, F: 0, J: 0 }
  const axisCounts = { E: 0, S: 0, F: 0, J: 0 }
  const allAnswers = []

  // Main Answers (1~20)
  Object.entries(mainAnswers).forEach(([idxStr, likertVal]) => {
    const actualId = (parseInt(idxStr, 10) + 1).toString()
    const meta = questionMetaMap[actualId]
    if (!meta) return

    const rawScore = convertScore(likertVal)
    const isReverse = meta.is_reverse
    const finalScore = isReverse ? (6 - rawScore) : rawScore

    if (meta.axis && axisScores[meta.axis] !== undefined) {
      axisScores[meta.axis] += finalScore
      axisCounts[meta.axis] += 1
    }

    allAnswers.push({
      question_id: parseInt(actualId, 10),
      likert_value: likertVal,
      raw_score: Math.round(rawScore * 100) / 100,
      final_score: Math.round(finalScore * 100) / 100,
      axis: meta.axis,
      is_reverse: isReverse
    })
  })

  // Bonus Answers (21~25)
  Object.entries(bonusAnswers).forEach(([idxStr, likertVal]) => {
    const actualId = (20 + parseInt(idxStr, 10) + 1).toString()
    const meta = questionMetaMap[actualId]
    const rawScore = convertScore(likertVal)

    allAnswers.push({
      question_id: parseInt(actualId, 10),
      likert_value: likertVal,
      raw_score: Math.round(rawScore * 100) / 100,
      final_score: Math.round(rawScore * 100) / 100,
      axis: meta ? meta.axis : 'bonus',
      is_reverse: false
    })
  })

  // Stats 계산 (0~100%)
  const getStat = (axisName) => {
    const score = axisScores[axisName] || 0
    const count = axisCounts[axisName] || 0
    if (count === 0) return 0
    const minScore = count * 1
    const maxScore = count * 5
    if (maxScore === minScore) return 0
    const pct = ((score - minScore) / (maxScore - minScore)) * 100
    return Math.round(Math.max(0, Math.min(100, pct)))
  }

  const stats = {
    sociability: getStat('E'),
    sagacity: getStat('S'),
    emotionality: getStat('F'),
    obedience: getStat('J'),
  }
  stats.temperament = Math.round((stats.sociability + stats.obedience) / 2)

  // MBTI 4축 판정 (50% 기준)
  const e_i = stats.sociability >= 50 ? 'E' : 'I'
  const s_n = stats.sagacity >= 50 ? 'S' : 'N'
  const f_t = stats.emotionality >= 50 ? 'F' : 'T'
  const j_p = stats.obedience >= 50 ? 'J' : 'P'
  const mbtiCode = e_i + s_n + f_t + j_p

  // Archetype 데이터 가져오기 및 플레이스홀더 치환
  const rawArchetype = ARCHETYPES_DATA[mbtiCode] || null
  const archetypeData = rawArchetype ? replacePlaceholders(rawArchetype, petName, locale) : null

  const resultId = generateUUID()

  return {
    result_id: resultId,
    resultId: resultId,
    pet_name: petName,
    petName: petName,
    locale: locale,
    mbti_code: mbtiCode,
    mbtiCode: mbtiCode,
    axis_scores: axisScores,
    stats: stats,
    answers: allAnswers,
    archetype: archetypeData,
    report_status: 'not_generated',
    report_pages: {},
  }
}
