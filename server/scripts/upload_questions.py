# upload_questions.py
from firebase_admin import firestore

def upload_questions():
    db = firestore.client()  # 이미 main.py에서 초기화된 클라이언트를 가져옴

    # --- [A] 반려견 성격 진단 (20문항) ---
    questions = [
        # 1. Social Energy (E vs I)
        {
            "id": 1, "axis": "E", "is_reverse": False,
            "text": {
                "en": "My dog immediately rushes to the door to greet guests with a wagging tail.",
                "ko": "우리 강아지는 손님이 오면 즉시 꼬리를 흔들며 문 앞으로 달려나간다.",
                "jp": "うちの犬は来客があると、しっぽを振りながらすぐに玄関へ駆け寄る。"
            }
        },
        {
            "id": 2, "axis": "E", "is_reverse": True,
            "text": {
                "en": "My dog prefers a quiet corner at the park rather than joining a group of playing dogs.",
                "ko": "우리 강아지는 공원에서 다른 강아지들과 노는 것보다 조용한 구석에 있는 것을 선호한다.",
                "jp": "うちの犬は公園で他の犬と遊ぶより、静かな隅で過ごすことを好む。"
            }
        },
        {
            "id": 3, "axis": "E", "is_reverse": False,
            "text": {
                "en": "My dog is consistently the one to initiate play with other dogs or humans.",
                "ko": "우리 강아지는 다른 개나 사람에게 먼저 다가가 놀자고 제안하는 편이다.",
                "jp": "うちの犬は他の犬や人に自分から遊びを仕掛けることが多い。"
            }
        },
        {
            "id": 4, "axis": "E", "is_reverse": False,
            "text": {
                "en": "My dog remains lively and curious even in busy or loud environments.",
                "ko": "우리 강아지는 시끄럽고 복잡한 장소에서도 기가 죽지 않고 호기심을 유지한다.",
                "jp": "うちの犬は騒がしく人の多い場所でも元気で好奇心旺盛だ。"
            }
        },
        {
            "id": 5, "axis": "E", "is_reverse": False,
            "text": {
                "en": "My dog actively seeks out and enjoys attention from people they've never met before.",
                "ko": "우리 강아지는 처음 보는 사람에게도 적극적으로 다가가 관심을 받는 것을 즐긴다.",
                "jp": "うちの犬は初対面の人から注目されることも積極的に楽しむ。"
            }
        },

        # 2. Focus & Perception (S vs N)
        {
            "id": 6, "axis": "S", "is_reverse": False,
            "text": {
                "en": "My dog reacts instantly to physical rewards like the sound of a treat bag.",
                "ko": "우리 강아지는 간식 봉투 소리 같은 물리적인 자극에 즉각적으로 반응한다.",
                "jp": "うちの犬はおやつ袋の音などの物理的な刺激にすぐ反応する。"
            }
        },
        {
            "id": 7, "axis": "S", "is_reverse": True,
            "text": {
                "en": "My dog seems to sense a walk is coming long before I touch the leash or keys.",
                "ko": "우리 강아지는 내가 리드줄을 잡기도 전에 산책 갈 시간임을 미리 알아채는 것 같다.",
                "jp": "うちの犬はリードや鍵に触る前から散歩の気配を察している。"
            }
        },
        {
            "id": 8, "axis": "S", "is_reverse": False,
            "text": {
                "en": "My dog is highly observant and notices even small changes in the room's arrangement.",
                "ko": "우리 강아지는 방 안의 가구 배치 등 아주 작은 변화도 금방 알아차린다.",
                "jp": "うちの犬は部屋の配置の小さな変化にもすぐ気づく。"
            }
        },
        {
            "id": 9, "axis": "S", "is_reverse": False,
            "text": {
                "en": "My dog relies heavily on their instincts and nose to solve puzzles or find hidden toys.",
                "ko": "우리 강아지는 퍼즐을 풀거나 숨겨진 장난감을 찾을 때 코와 본능에 집중한다.",
                "jp": "うちの犬はパズルや隠れたおもちゃを探すとき、嗅覚と本能に頼る。"
            }
        },
        {
            "id": 10, "axis": "S", "is_reverse": False,
            "text": {
                "en": "My dog is easily distracted by new smells or sights during focused training sessions.",
                "ko": "우리 강아지는 훈련 중에 새로운 냄새나 시각적 자극이 나타나면 쉽게 집중력이 흐트러진다.",
                "jp": "うちの犬は訓練中でも新しい匂いや景色に気を取られやすい。"
            }
        },

        # 3. Emotional Reactivity (T vs F)
        {
            "id": 11, "axis": "F", "is_reverse": False,
            "text": {
                "en": "My dog is highly sensitive to my emotional shifts and offers comfort when I feel down.",
                "ko": "우리 강아지는 나의 감정 변화에 민감하며, 내가 슬플 때 다가와 위로해준다.",
                "jp": "うちの犬は私の感情の変化に敏感で、落ち込んでいると寄り添ってくる。"
            }
        },
        {
            "id": 12, "axis": "F", "is_reverse": True,
            "text": {
                "en": "My dog is generally independent and doesn't constantly seek physical reassurance.",
                "ko": "우리 강아지는 대체로 독립적이며, 계속해서 스킨십이나 안심을 요구하지 않는다.",
                "jp": "うちの犬は比較的自立していて、常にスキンシップを求めるわけではない。"
            }
        },
        {
            "id": 13, "axis": "F", "is_reverse": True,
            "text": {
                "en": "My dog remains calm and 'thinks it over' rather than reacting with anxiety when corrected.",
                "ko": "우리 강아지는 혼날 때 불안해하기보다 차분하게 상황을 파악하려는 듯한 태도를 보인다.",
                "jp": "うちの犬は叱られても不安になるより、落ち着いて状況を理解しようとする。"
            }
        },
        {
            "id": 14, "axis": "F", "is_reverse": False,
            "text": {
                "en": "My dog forms deep, almost 'needy' emotional attachments to specific family members.",
                "ko": "우리 강아지는 특정 가족 구성원에게 매우 깊고 의존적인 정서적 애착을 보인다.",
                "jp": "うちの犬は特定の家族に強く依存するほど深い愛着を示す。"
            }
        },
        {
            "id": 15, "axis": "F", "is_reverse": True,
            "text": {
                "en": "My dog remains steady and unbothered during stressful events like thunderstorms or vet visits.",
                "ko": "우리 강아지는 천둥번개나 동물병원 방문 같은 스트레스 상황에서도 비교적 침착하다.",
                "jp": "うちの犬は雷や動物病院などのストレス状況でも比較的落ち着いている。"
            }
        },

        # 4. Daily Lifestyle (J vs P)
        {
            "id": 16, "axis": "J", "is_reverse": False,
            "text": {
                "en": "My dog demands food or walks at the exact same time every single day.",
                "ko": "우리 강아지는 매일 정확히 같은 시간에 밥이나 산책을 요구한다.",
                "jp": "うちの犬は毎日まったく同じ時間にごはんや散歩を要求する。"
            }
        },
        {
            "id": 17, "axis": "J", "is_reverse": True,
            "text": {
                "en": "My dog adapts quickly and happily to new environments or sudden changes in routine.",
                "ko": "우리 강아지는 새로운 환경이나 갑작스러운 일과 변경에도 빠르게 적응하고 즐거워한다.",
                "jp": "うちの犬は新しい環境や急な予定変更にもすぐ順応して楽しむ。"
            }
        },
        {
            "id": 18, "axis": "J", "is_reverse": False,
            "text": {
                "en": "My dog seems to prefer a structured environment where everything is predictable.",
                "ko": "우리 강아지는 모든 것이 예측 가능한 규칙적인 환경을 선호하는 것 같다.",
                "jp": "うちの犬はすべてが予測できる規則的な環境を好むようだ。"
            }
        },
        {
            "id": 19, "axis": "J", "is_reverse": True,
            "text": {
                "en": "My dog is a spontaneous explorer who loves wandering off-path to follow new scents.",
                "ko": "우리 강아지는 새로운 냄새를 따라 정해진 길을 벗어나 탐험하는 것을 좋아하는 즉흥적인 타입이다.",
                "jp": "うちの犬は新しい匂いを追って道を外れるのが好きな自由奔放な探検家だ。"
            }
        },
        {
            "id": 20, "axis": "J", "is_reverse": False,
            "text": {
                "en": "My dog follows established rules and commands consistently without needing reminders.",
                "ko": "우리 강아지는 반복적인 지시 없이도 정해진 규칙과 명령을 일관되게 잘 따른다.",
                "jp": "うちの犬は注意されなくても決められたルールや指示を守る。"
            }
        },
    ]

    # --- [B] 보호자 성향 (5문항) ---
    owner_questions = [
        {
            "id": 21, "axis": "Style",
            "text": {
                "en": "I prefer active outdoor adventures with my pet over quiet, indoor cuddling sessions.",
                "ko": "나는 우리 강아지와 조용히 집에서 쉬는 것보다 야외에서 활동적인 모험을 즐기는 것을 선호한다.",
                "jp": "私はペットと家で静かに過ごすより、屋外でアクティブに過ごす方が好きだ。"
            }
        },
        {
            "id": 22, "axis": "Bond",
            "text": {
                "en": "I value my pet's practical obedience more than our unspoken emotional connection.",
                "ko": "나는 우리 강아지가 말 없는 정서적 교감보다 실질적인 복종과 훈련 상태를 더 중요하게 생각한다.",
                "jp": "私は感情的な絆より、実用的な服従やしつけを重視する。"
            }
        },
        {
            "id": 23, "axis": "Logic",
            "text": {
                "en": "If my pet makes a mistake, my first instinct is to analyze the logical cause.",
                "ko": "나는 우리 강아지가 실수했을 때, 감정적으로 반응하기보다 논리적인 원인을 분석하는 것이 먼저다.",
                "jp": "ペットが失敗したとき、まず原因を論理的に考える。"
            }
        },
        {
            "id": 24, "axis": "Routine",
            "text": {
                "en": "I believe keeping a disciplined, fixed daily schedule is essential for a happy pet.",
                "ko": "나는 우리 강아지의 행복을 위해 엄격하고 고정된 일과표를 지키는 것이 필수적이라고 믿는다.",
                "jp": "ペットの幸せには、規則正しい生活リズムが不可欠だと思う。"
            }
        },
        {
            "id": 25, "axis": "Goal",
            "text": {
                "en": "My primary goal for this relationship is achieving deep emotional support and harmony.",
                "ko": "나는 우리 강아지와의 관계에서 나의 가장 큰 목표는 깊은 정서적 지지와 조화를 이루는 것이다.",
                "jp": "この関係での一番の目標は、深い心の支えと調和を得ることだ。"
            }
        },
    ]

    doc_ref = db.collection("assessment_configs").document("dog_v1")
    doc_ref.set({
        "version": "1.0",
        "last_updated": firestore.SERVER_TIMESTAMP,
        "questions": questions,
        "owner_questions": owner_questions
    })
    print("✅ 질문 업로드 완료")
