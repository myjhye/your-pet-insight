// src/data/dogQuestions.js
// 강아지 성격 테스트 질문 데이터 (하드코딩)

export const DOG_QUESTIONS = {
    en: {
      stage1: [
        // E (Sociability) - 5 questions
        { id: 1, axis: "E", is_reverse: false, text: "My dog immediately rushes to the door to greet guests with a wagging tail." },
        { id: 2, axis: "E", is_reverse: true, text: "My dog prefers a quiet corner at the park rather than joining a group of playing dogs." },
        { id: 3, axis: "E", is_reverse: false, text: "My dog is consistently the one to initiate play with other dogs or humans." },
        { id: 4, axis: "E", is_reverse: false, text: "My dog remains lively and curious even in busy or loud environments." },
        { id: 5, axis: "E", is_reverse: false, text: "My dog actively seeks out and enjoys attention from people they've never met before." },
        
        // S (Sagacity) - 5 questions
        { id: 6, axis: "S", is_reverse: false, text: "My dog reacts instantly to physical rewards like the sound of a treat bag." },
        { id: 7, axis: "S", is_reverse: true, text: "My dog seems to sense a walk is coming long before I touch the leash or keys." },
        { id: 8, axis: "S", is_reverse: false, text: "My dog is highly observant and notices even small changes in the room's arrangement." },
        { id: 9, axis: "S", is_reverse: false, text: "My dog relies heavily on their instincts and nose to solve puzzles or find hidden toys." },
        { id: 10, axis: "S", is_reverse: false, text: "My dog is easily distracted by new smells or sights during focused training sessions." },
        
        // F (Emotionality) - 5 questions
        { id: 11, axis: "F", is_reverse: false, text: "My dog is highly sensitive to my emotional shifts and offers comfort when I feel down." },
        { id: 12, axis: "F", is_reverse: true, text: "My dog is generally independent and doesn't constantly seek physical reassurance." },
        { id: 13, axis: "F", is_reverse: true, text: "My dog remains calm and 'thinks it over' rather than reacting with anxiety when corrected." },
        { id: 14, axis: "F", is_reverse: false, text: "My dog forms deep, almost 'needy' emotional attachments to specific family members." },
        { id: 15, axis: "F", is_reverse: true, text: "My dog remains steady and unbothered during stressful events like thunderstorms or vet visits." },
        
        // J (Obedience) - 5 questions
        { id: 16, axis: "J", is_reverse: false, text: "My dog demands food or walks at the exact same time every single day." },
        { id: 17, axis: "J", is_reverse: true, text: "My dog adapts quickly and happily to new environments or sudden changes in routine." },
        { id: 18, axis: "J", is_reverse: false, text: "My dog seems to prefer a structured environment where everything is predictable." },
        { id: 19, axis: "J", is_reverse: true, text: "My dog is a spontaneous explorer who loves wandering off-path to follow new scents." },
        { id: 20, axis: "J", is_reverse: false, text: "My dog follows established rules and commands consistently without needing reminders." },
      ],
      stage2: [
        // Owner Questions
        { id: 21, axis: "Style", text: "I prefer active outdoor adventures with my pet over quiet, indoor cuddling sessions." },
        { id: 22, axis: "Bond", text: "I value my pet's practical obedience more than our unspoken emotional connection." },
        { id: 23, axis: "Logic", text: "If my pet makes a mistake, my first instinct is to analyze the logical cause." },
        { id: 24, axis: "Routine", text: "I believe keeping a disciplined, fixed daily schedule is essential for a happy pet." },
        { id: 25, axis: "Goal", text: "My primary goal for this relationship is achieving deep emotional support and harmony." },
      ]
    },
    
    jp: {
      stage1: [
        // E (Sociability) - 5 questions
        { id: 1, axis: "E", is_reverse: false, text: "うちの犬は来客があると、しっぽを振りながらすぐに玄関へ駆け寄る。" },
        { id: 2, axis: "E", is_reverse: true, text: "うちの犬は公園で他の犬と遊ぶより、静かな隅で過ごすことを好む。" },
        { id: 3, axis: "E", is_reverse: false, text: "うちの犬は他の犬や人に自分から遊びを仕掛けることが多い。" },
        { id: 4, axis: "E", is_reverse: false, text: "うちの犬は騒がしく人の多い場所でも元気で好奇心旺盛だ。" },
        { id: 5, axis: "E", is_reverse: false, text: "うちの犬は初対面の人から注目されることも積極的に楽しむ。" },
        
        // S (Sagacity) - 5 questions
        { id: 6, axis: "S", is_reverse: false, text: "うちの犬はおやつ袋の音などの物理的な刺激にすぐ反応する。" },
        { id: 7, axis: "S", is_reverse: true, text: "うちの犬はリードや鍵に触る前から散歩の気配を察している。" },
        { id: 8, axis: "S", is_reverse: false, text: "うちの犬は部屋の配置の小さな変化にもすぐ気づく。" },
        { id: 9, axis: "S", is_reverse: false, text: "うちの犬はパズルや隠れたおもちゃを探すとき、嗅覚と本能に頼る。" },
        { id: 10, axis: "S", is_reverse: false, text: "うちの犬は訓練中でも新しい匂いや景色に気を取られやすい。" },
        
        // F (Emotionality) - 5 questions
        { id: 11, axis: "F", is_reverse: false, text: "うちの犬は私の感情の変化に敏感で、落ち込んでいると寄り添ってくる。" },
        { id: 12, axis: "F", is_reverse: true, text: "うちの犬は比較的自立していて、常にスキンシップを求めるわけではない。" },
        { id: 13, axis: "F", is_reverse: true, text: "うちの犬は叱られても不安になるより、落ち着いて状況を理解しようとする。" },
        { id: 14, axis: "F", is_reverse: false, text: "うちの犬は特定の家族に強く依存するほど深い愛着を示す。" },
        { id: 15, axis: "F", is_reverse: true, text: "うちの犬は雷や動物病院などのストレス状況でも比較的落ち着いている。" },
        
        // J (Obedience) - 5 questions
        { id: 16, axis: "J", is_reverse: false, text: "うちの犬は毎日まったく同じ時間にごはんや散歩を要求する。" },
        { id: 17, axis: "J", is_reverse: true, text: "うちの犬は新しい環境や急な予定変更にもすぐ順応して楽しむ。" },
        { id: 18, axis: "J", is_reverse: false, text: "うちの犬はすべてが予測できる規則的な環境を好むようだ。" },
        { id: 19, axis: "J", is_reverse: true, text: "うちの犬は新しい匂いを追って道を外れるのが好きな自由奔放な探検家だ。" },
        { id: 20, axis: "J", is_reverse: false, text: "うちの犬は注意されなくても決められたルールや指示を守る。" },
      ],
      stage2: [
        // Owner Questions
        { id: 21, axis: "Style", text: "私はペットと家で静かに過ごすより、屋外でアクティブに過ごす方が好きだ。" },
        { id: 22, axis: "Bond", text: "私は感情的な絆より、実用的な服従やしつけを重視する。" },
        { id: 23, axis: "Logic", text: "ペットが失敗したとき、まず原因を論理的に考える。" },
        { id: 24, axis: "Routine", text: "ペットの幸せには、規則正しい生活リズムが不可欠だと思う。" },
        { id: 25, axis: "Goal", text: "この関係での一番の目標は、深い心の支えと調和を得ることだ。" },
      ]
    }
  }