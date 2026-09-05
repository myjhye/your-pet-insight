// src/data/dogQuestions.js
// 강아지 성격 테스트 질문 데이터 (12문항)

export const DOG_QUESTIONS = {
  en: {
    stage1: [
      // E (Sociability) - 3 questions
      { id: 1, axis: "E", is_reverse: false, text: "My dog immediately rushes to the door to greet guests with a wagging tail." },
      { id: 2, axis: "E", is_reverse: true, text: "My dog prefers a quiet corner at the park rather than joining a group of playing dogs." },
      { id: 3, axis: "E", is_reverse: false, text: "My dog actively seeks out and enjoys attention from people they've never met before." },
      
      // S (Sagacity) - 3 questions
      { id: 4, axis: "S", is_reverse: false, text: "My dog reacts instantly to physical rewards like the sound of a treat bag." },
      { id: 5, axis: "S", is_reverse: true, text: "My dog seems to sense a walk is coming long before I touch the leash or keys." },
      { id: 6, axis: "S", is_reverse: false, text: "My dog relies heavily on their instincts and nose to solve puzzles or find hidden toys." },
      
      // F (Emotionality) - 3 questions
      { id: 7, axis: "F", is_reverse: false, text: "My dog is highly sensitive to my emotional shifts and offers comfort when I feel down." },
      { id: 8, axis: "F", is_reverse: false, text: "My dog forms deep, almost 'needy' emotional attachments to specific family members." },
      { id: 9, axis: "F", is_reverse: true, text: "My dog remains steady and unbothered during stressful events like thunderstorms or vet visits." },
      
      // J (Obedience) - 3 questions
      { id: 10, axis: "J", is_reverse: false, text: "My dog demands food or walks at the exact same time every single day." },
      { id: 11, axis: "J", is_reverse: true, text: "My dog adapts quickly and happily to new environments or sudden changes in routine." },
      { id: 12, axis: "J", is_reverse: false, text: "My dog follows established rules and commands consistently without needing reminders." }
    ],
    stage2: []
  },
  
  jp: {
    stage1: [
      // E (Sociability) - 3 questions
      { id: 1, axis: "E", is_reverse: false, text: "うちの犬は来客があると、しっぽを振りながらすぐに玄関へ駆け寄る。" },
      { id: 2, axis: "E", is_reverse: true, text: "うちの犬は公園で他の犬と遊ぶより、静かな隅で過ごすことを好む。" },
      { id: 3, axis: "E", is_reverse: false, text: "うちの犬は初対面の人から注目されることも積極的に楽しむ。" },
      
      // S (Sagacity) - 3 questions
      { id: 4, axis: "S", is_reverse: false, text: "うちの犬はおやつ袋の音などの物理的な刺激にすぐ反応する。" },
      { id: 5, axis: "S", is_reverse: true, text: "うちの犬はリードや鍵に触る前から散歩の気配を察している。" },
      { id: 6, axis: "S", is_reverse: false, text: "うちの犬はパズルや隠れたおもちゃを探すとき、嗅覚と本能に頼る。" },
      
      // F (Emotionality) - 3 questions
      { id: 7, axis: "F", is_reverse: false, text: "うちの犬は私の感情の変化に敏感で、落ち込んでいると寄り添ってくる。" },
      { id: 8, axis: "F", is_reverse: false, text: "うちの犬は特定の家族に強く依存するほど深い愛着を示す。" },
      { id: 9, axis: "F", is_reverse: true, text: "うちの犬は雷や動物病院などのストレス状況でも比較的落ち着いている。" },
      
      // J (Obedience) - 3 questions
      { id: 10, axis: "J", is_reverse: false, text: "うちの犬は毎日まったく同じ時間にごはんや散歩を要求する。" },
      { id: 11, axis: "J", is_reverse: true, text: "うちの犬は新しい環境や急な予定変更にもすぐ順応して楽しむ。" },
      { id: 12, axis: "J", is_reverse: false, text: "うちの犬は注意されなくても決められたルールや指示を守る。" }
    ],
    stage2: []
  }
}