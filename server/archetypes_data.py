"""
MBTI Archetype 데이터 정의 및 헬퍼 모듈 (Firestore DB 없이 인메모리 조회 가능)
"""

def capitalize_first_letter(s: str) -> str:
    if not s:
        return s
    return s[0].upper() + s[1:] if len(s) > 1 else s.upper()

def replace_placeholders(obj, pet_name: str, locale: str):
    display_pet_name = capitalize_first_letter(pet_name)
    
    if isinstance(obj, str):
        return obj.replace("{{pet_name}}", display_pet_name)
    elif isinstance(obj, dict):
        if locale in obj and isinstance(obj[locale], str):
            return obj[locale].replace("{{pet_name}}", display_pet_name)
        return {k: replace_placeholders(v, pet_name, locale) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [replace_placeholders(item, pet_name, locale) for item in obj]
    return obj

def get_full_archetypes():
    """16개 MBTI 유형 전체 데이터"""
    return [
        # ============================================================
        # ENFP - 자유로운 탐험가
        # ============================================================
        {
            "id": "ENFP",
            "alias": {
                "ko": "자유로운 탐험가",
                "en": "The Free-Spirited Explorer",
                "jp": "自由奔放な冒険者",
            },
            "summary": {
                "ko": "세상 모든 것이 신나는 모험의 시작점인 호기심 덩어리",
                "en": "A bundle of curiosity who sees every moment as the start of an exciting adventure",
                "jp": "すべてがワクワクする冒険の始まりに見える好奇心の塊",
            },
            "image_id": "dog_enfp_main",
            "keywords": {
                "ko": ["호기심", "에너지", "핵인싸"],
                "en": ["Curious", "Energetic", "Social"],
                "jp": ["好奇心", "エネルギッシュ", "社交的"],
            },
            "statsLabels": {
                "sociability": {"ko": "외향적", "en": "Extroverted", "jp": "外向的"},
                "obedience": {"ko": "독립적", "en": "Independent", "jp": "独立的"},
                "temperament": {"ko": "활발함", "en": "Energetic", "jp": "活発"},
                "emotionality": {"ko": "감성적", "en": "Sensitive", "jp": "感受性豊か"},
                "sagacity": {"ko": "본능적", "en": "Instinctive", "jp": "本能的"},
            },
            "coreTraits": [
                {
                    "icon": "explore",
                    "title": {
                        "ko": "끝없는 호기심",
                        "en": "Boundless Curiosity",
                        "jp": "尽きない好奇心",
                    },
                    "description": {
                        "ko": '{{pet_name}}에게 세상은 매일 새롭게 열리는 거대한 보물상자예요. 바스락거리는 낙엽 소리, 담장 너머로 살짝 보이는 고양이 그림자, 처음 맡아보는 신기한 냄새까지—모든 것이 "나를 찾아봐!"라고 외치는 신호로 느껴지죠. 이 친구는 산책로를 그냥 걷지 않아요. 마치 미지의 정글을 탐험하는 것처럼 온몸으로 세상과 부딪히며, 주인도 모르게 지나쳤을 작은 세계들을 하나하나 발견해냅니다.',
                        "en": "For {{pet_name}}, the world is a giant treasure chest that opens anew each day. The rustle of fallen leaves, a cat's shadow glimpsed beyond the fence, an intriguing scent never encountered before—everything feels like a signal crying out \"Find me!\" This explorer doesn't simply walk a path but charges through it like venturing into an uncharted jungle, discovering tiny worlds that even their owner would have passed by without noticing.",
                        "jp": "{{pet_name}}にとって世界は毎日新しく開く巨大な宝箱です。落ち葉のカサカサ音、塀の向こうにちらりと見える猫の影、初めて嗅ぐ不思議な匂い—すべてが「私を見つけて！」と叫ぶ信号に感じられます。この探検家は道をただ歩くのではなく、未知のジャングルを冒険するように全身で世界にぶつかり、飼い主さえ気づかず通り過ぎたであろう小さな世界を一つ一つ発見していきます。",
                    },
                },
                {
                    "icon": "groups",
                    "title": {
                        "ko": "파티의 주인공",
                        "en": "Life of the Party",
                        "jp": "パーティーの主役",
                    },
                    "description": {
                        "ko": "{{pet_name}}에게 낯선 존재란 없어요. 그저 아직 인사하지 못한 미래의 친구들이 있을 뿐이죠. 강아지 공원에 도착하는 순간, 꼬리는 이미 프로펠러처럼 돌아가고 있고, 누구에게든 먼저 다가가 코 인사를 건넵니다. 사람 손님이 오면? 마치 오랜 친구가 방문한 것처럼 온몸으로 환영의 춤을 춰요. 이 타고난 사교성 덕분에 {{pet_name}}가 가는 곳마다 자연스럽게 작은 팬클럽이 생겨납니다.",
                        "en": "For {{pet_name}}, there's no such thing as a stranger—only future friends who haven't been greeted yet. The moment they arrive at the dog park, their tail is already spinning like a propeller, approaching anyone and everyone to offer a friendly nose-touch. When human guests arrive? {{pet_name}} dances a full-body welcome as if greeting a long-lost friend. Thanks to this natural social gift, a small fan club seems to form wherever {{pet_name}} goes.",
                        "jp": "{{pet_name}}にとって見知らぬ存在などいません。まだ挨拶できていない未来の友達がいるだけです。ドッグパークに着いた瞬間、しっぽはすでにプロペラのように回り、誰にでも先に近づいて鼻で挨拶します。人間のお客さんが来たら？まるで古い友人が訪ねてきたかのように全身で歓迎のダンスを踊ります。この生まれ持った社交性のおかげで、{{pet_name}}が行くところには自然と小さなファンクラブができます。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "bolt",
                    "title": {
                        "ko": "예측 불가의 하루",
                        "en": "Unpredictable Days",
                        "jp": "予測不能な一日",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 하루는 계획표대로 흘러가지 않아요. 아침 산책 중 갑자기 발견한 흥미로운 냄새가 30분 탐험으로 이어지기도 하고, 장난감에 푹 빠져있다가 창밖을 지나는 비둘기 한 마리에 모든 관심이 순식간에 옮겨가기도 하죠. 이런 즉흥적인 성격은 함께 사는 일상을 절대 지루하지 않게 만들어주지만, 훈련할 때는 짧고 재미있는 세션이 훨씬 효과적이라는 걸 기억하세요.",
                        "en": "{{pet_name}}'s day never follows a set schedule. An intriguing scent discovered during a morning walk might turn into a 30-minute expedition, or complete absorption in a toy can instantly shift to a pigeon passing by the window. This spontaneous nature ensures life together is never boring, but remember that short, fun training sessions work far better than long, structured ones.",
                        "jp": "{{pet_name}}の一日は計画通りには進みません。朝の散歩中に突然見つけた興味深い匂いが30分の探検につながったり、おもちゃに夢中になっていたのに窓の外を通る鳩一羽にすべての関心が一瞬で移ったり。この即興的な性格は一緒に暮らす毎日を決して退屈にしませんが、トレーニングは短く楽しいセッションの方がずっと効果的だということを覚えておいてください。",
                    },
                },
                {
                    "icon": "favorite",
                    "title": {
                        "ko": "당신의 감정 안테나",
                        "en": "Your Emotional Antenna",
                        "jp": "あなたの感情アンテナ",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 보이지 않는 감정의 주파수를 정확히 수신하는 안테나를 가지고 있어요. 당신이 기쁠 때는 함께 흥분하며 빙글빙글 돌고, 지친 하루 끝에 소파에 축 늘어지면 어느새 옆에 와서 조용히 몸을 기대죠. 때로는 당신이 슬프다는 걸 스스로 깨닫기도 전에 {{pet_name}}가 먼저 다가와 위로의 핥기 세례를 보내기도 해요. 이 깊은 교감 때문에 오랜 시간 혼자 있는 것은 이 친구에게 꽤 힘든 일이에요.",
                        "en": "{{pet_name}} has an antenna that perfectly tunes into invisible emotional frequencies. When you're happy, they spin around excitedly together with you; when you collapse on the couch after an exhausting day, they quietly come and lean against you. Sometimes {{pet_name}} approaches with comforting licks before you even realize you're sad. Because of this deep connection, being alone for long periods is quite hard for this friend.",
                        "jp": "{{pet_name}}は見えない感情の周波数を正確に受信するアンテナを持っています。あなたが嬉しい時は一緒に興奮してくるくる回り、疲れた一日の終わりにソファにぐったりすると、いつの間にかそばに来て静かに体を寄せます。時にはあなたが悲しいと自分で気づく前に{{pet_name}}が先に近づいて慰めの舐め舐め攻撃を送ることも。この深い絆のため、長時間一人でいることはこの子にとってかなり辛いことです。",
                    },
                },
            ],
        },
        # ============================================================
        # ENFJ - 카리스마 리더
        # ============================================================
        {
            "id": "ENFJ",
            "alias": {
                "ko": "카리스마 리더",
                "en": "The Charismatic Leader",
                "jp": "カリスマリーダー",
            },
            "summary": {
                "ko": "가족 모두를 하나로 모으는 타고난 조율사이자 수호자",
                "en": "A natural harmonizer and guardian who brings the whole family together",
                "jp": "家族全員を一つにまとめる生まれながらの調整役であり守護者",
            },
            "image_id": "dog_enfj_main",
            "keywords": {
                "ko": ["리더십", "다정함", "보호본능"],
                "en": ["Leadership", "Warmth", "Protective"],
                "jp": ["リーダーシップ", "優しさ", "守護本能"],
            },
            "statsLabels": {
                "sociability": {"ko": "외향적", "en": "Extroverted", "jp": "外向的"},
                "obedience": {"ko": "협조적", "en": "Cooperative", "jp": "協調的"},
                "temperament": {"ko": "활발함", "en": "Energetic", "jp": "活発"},
                "emotionality": {"ko": "감성적", "en": "Sensitive", "jp": "感受性豊か"},
                "sagacity": {"ko": "직관적", "en": "Intuitive", "jp": "直感的"},
            },
            "coreTraits": [
                {
                    "icon": "shield",
                    "title": {
                        "ko": "가족의 수호자",
                        "en": "Guardian of the Family",
                        "jp": "家族の守護者",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 가족 전체를 자신의 보호 아래 두고 싶어하는 타고난 수호자예요. 아이가 넘어지면 가장 먼저 달려가 괜찮은지 확인하고, 가족 중 누군가가 아프면 곁을 떠나지 않고 지킵니다. 낯선 사람이 집에 오면 경계하되 공격적이지 않게, 마치 "일단 지켜보겠어"라고 말하듯 가족과 손님 사이에 자연스럽게 자리를 잡죠. 이 친구에게 가족의 안전과 행복은 무엇보다 중요한 사명이에요.',
                        "en": "{{pet_name}} is a born guardian who wants to keep the entire family under their protection. When a child falls, they're the first to rush over and check if everything's okay; when someone in the family is sick, they stay by their side without leaving. When strangers visit, {{pet_name}} stays alert but never aggressive—naturally positioning themselves between family and guests as if saying \"I'll keep watch for now.\" For this friend, the family's safety and happiness is the most important mission.",
                        "jp": "{{pet_name}}は家族全員を自分の保護下に置きたがる生まれながらの守護者です。子供が転んだら真っ先に駆け寄って大丈夫か確認し、家族の誰かが病気なら側を離れず見守ります。見知らぬ人が家に来ると警戒しつつも攻撃的にはならず、まるで「とりあえず見守るよ」と言うように家族とお客さんの間に自然と位置取りします。この子にとって家族の安全と幸せは何よりも大切な使命です。",
                    },
                },
                {
                    "icon": "handshake",
                    "title": {
                        "ko": "타고난 중재자",
                        "en": "Natural Mediator",
                        "jp": "生まれながらの仲裁者",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 가족 사이의 분위기를 귀신같이 읽어내요. 누군가 언쟁을 벌이면 슬쩍 끼어들어 관심을 돌리고, 혼자 떨어져 있는 가족이 있으면 다가가 함께 있어주죠. 여러 마리 반려동물이 있는 집에서는 자연스럽게 리더 역할을 맡아 다른 동물들 사이의 긴장을 완화시키기도 해요. 모두가 평화롭고 행복해야 {{pet_name}}도 마음이 편안해지는, 진정한 조화의 수호자입니다.",
                        "en": "{{pet_name}} reads the atmosphere between family members with uncanny accuracy. When someone argues, they subtly intervene to redirect attention; when a family member sits alone, they approach to offer company. In homes with multiple pets, {{pet_name}} naturally assumes the leader role, easing tensions between other animals. Only when everyone is peaceful and happy can {{pet_name}} truly relax—a genuine guardian of harmony.",
                        "jp": "{{pet_name}}は家族間の雰囲気を驚くほど正確に読み取ります。誰かが言い争っていればそっと間に入って注意を逸らし、一人離れている家族がいれば近づいて一緒にいてあげます。複数のペットがいる家では自然とリーダー役を務め、他の動物たちの間の緊張を和らげることも。みんなが平和で幸せであってこそ{{pet_name}}も心が落ち着く、真の調和の守護者です。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "visibility",
                    "title": {
                        "ko": "모두를 살피는 눈",
                        "en": "Eyes on Everyone",
                        "jp": "みんなを見守る目",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 하루는 가족 순찰로 시작돼요. 아침에 일어나면 각 가족 구성원이 어디 있는지 한 바퀴 확인하고, 모두가 제자리에 있어야 비로소 안심하죠. 누군가 외출 준비를 하면 현관까지 따라가 배웅하고, 귀가하면 가장 먼저 달려와 반겨요. 이 친구는 가족 전체의 동선을 머릿속에 그리며 하루를 보내는 진정한 가정의 매니저예요.",
                        "en": "{{pet_name}}'s day begins with a family patrol. Upon waking, they check where each family member is, only relaxing once everyone is accounted for. When someone prepares to leave, {{pet_name}} escorts them to the door; when they return, they're the first to greet them. This friend spends their day mentally mapping the entire family's movements—a true household manager.",
                        "jp": "{{pet_name}}の一日は家族パトロールから始まります。朝起きると各家族がどこにいるか一周確認し、全員が定位置にいてようやく安心します。誰かが外出準備をすれば玄関まで付いていって見送り、帰宅すれば真っ先に駆け寄って出迎えます。この子は家族全員の動線を頭の中で描きながら一日を過ごす、真の家庭のマネージャーです。",
                    },
                },
                {
                    "icon": "volunteer_activism",
                    "title": {
                        "ko": "헌신적인 동반자",
                        "en": "Devoted Companion",
                        "jp": "献身的なパートナー",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 사랑하는 사람을 위해서라면 무엇이든 할 준비가 되어 있어요. 당신이 운동을 하면 옆에서 함께 뛰고, 책을 읽으면 발치에서 조용히 기다려요. 당신이 필요로 하는 것이 무엇인지 본능적으로 파악하고 맞춰주려 하죠. 다만 이 깊은 헌신은 때때로 자신의 욕구를 뒤로 미루게 만들기도 해요. {{pet_name}}만의 휴식 시간과 즐거움도 꼭 챙겨주세요.",
                        "en": "{{pet_name}} is ready to do anything for their beloved person. When you exercise, they run alongside you; when you read, they wait quietly at your feet. They instinctively understand what you need and try to accommodate. However, this deep devotion sometimes means putting their own needs aside. Make sure to also provide {{pet_name}} with their own rest time and enjoyment.",
                        "jp": "{{pet_name}}は愛する人のためなら何でもする準備ができています。あなたが運動すれば横で一緒に走り、本を読めば足元で静かに待ちます。あなたが何を必要としているか本能的に把握し、合わせようとします。ただ、この深い献身は時に自分の欲求を後回しにさせることも。{{pet_name}}だけの休息時間と楽しみも必ず作ってあげてください。",
                    },
                },
            ],
        },
        # ============================================================
        # ENTP - 영리한 장난꾸러기
        # ============================================================
        {
            "id": "ENTP",
            "alias": {
                "ko": "장난기 많은 전략가",
                "en": "The Playful Visionary",
                "jp": "いたずら好きな戦略家",
            },
            "summary": {
                "ko": "규칙은 깨라고 있는 것, 천재적인 머리로 매일 새로운 장난을 설계하는 반란군",
                "en": "A brilliant rebel who uses their genius mind to design new mischief every day",
                "jp": "ルールは破るためにある、天才的な頭脳で毎日新しいいたずらを設計する反逆者",
            },
            "image_id": "dog_entp_main",
            "keywords": {
                "ko": ["영리함", "장난꾸러기", "도전적"],
                "en": ["Clever", "Mischievous", "Challenging"],
                "jp": ["賢い", "いたずらっ子", "挑戦的"],
            },
            "statsLabels": {
                "sociability": {"ko": "외향적", "en": "Extroverted", "jp": "外向的"},
                "obedience": {"ko": "독립적", "en": "Independent", "jp": "独立的"},
                "temperament": {"ko": "활발함", "en": "Energetic", "jp": "活発"},
                "emotionality": {"ko": "이성적", "en": "Rational", "jp": "理性的"},
                "sagacity": {"ko": "직관적", "en": "Intuitive", "jp": "直感的"},
            },
            "coreTraits": [
                {
                    "icon": "psychology",
                    "title": {
                        "ko": "타고난 문제 해결사",
                        "en": "Born Problem Solver",
                        "jp": "生まれながらの問題解決者",
                    },
                    "description": {
                        "ko": '{{pet_name}}의 머릿속에는 항상 톱니바퀴가 돌아가고 있어요. 간식이 높은 선반 위에 있다고요? 의자를 밀어 올라가는 방법을 스스로 알아내죠. 문이 닫혀 있다고요? 손잡이를 어떻게 돌려야 하는지 관찰하고 시도해요. 이 친구는 장애물을 마주하면 좌절하는 대신 "어떻게 하면 저걸 해결할 수 있을까?"라는 퍼즐로 받아들입니다. 지능형 장난감이나 노즈워크는 이 작은 천재의 두뇌를 만족시키는 필수품이에요.',
                        "en": "There are always gears turning inside {{pet_name}}'s head. Treats on a high shelf? They figure out how to push a chair and climb up on their own. Door closed? They observe and attempt to turn the handle. When facing obstacles, this friend doesn't get frustrated—instead, they see it as a puzzle: \"How can I solve this?\" Puzzle toys and nose work are essential items to satisfy this little genius's brain.",
                        "jp": "{{pet_name}}の頭の中ではいつも歯車が回っています。おやつが高い棚の上にある？椅子を押して登る方法を自分で見つけます。ドアが閉まっている？取っ手をどう回すか観察して試みます。この子は障害物に直面しても挫折せず、「どうやったらあれを解決できるかな？」というパズルとして受け止めます。知育おもちゃやノーズワークはこの小さな天才の頭脳を満足させる必需品です。",
                    },
                },
                {
                    "icon": "sentiment_very_satisfied",
                    "title": {
                        "ko": "공인된 말썽쟁이",
                        "en": "Certified Troublemaker",
                        "jp": "公認のいたずらっ子",
                    },
                    "description": {
                        "ko": '{{pet_name}}에게 규칙이란 "한번 시험해봐야 할 가설" 정도예요. 소파에 올라가지 말라고요? 주인이 안 볼 때 살짝 올라가본 뒤 눈치를 살피죠. 이 친구의 장난은 악의가 아니라 순수한 호기심과 지루함의 결과예요. "이러면 어떻게 될까?"라는 질문이 항상 머릿속에 맴돌거든요. 혼내도 금방 씩 웃는 표정으로 돌아오는 뻔뻔함은 덤이에요. 화를 내기보다 웃음이 터지게 만드는 타고난 개그맨이죠.',
                        "en": "For {{pet_name}}, rules are just \"hypotheses to be tested.\" Not allowed on the sofa? They'll sneak up when you're not looking, then gauge your reaction. This friend's mischief isn't malicious—it's the result of pure curiosity and boredom. The question \"What happens if I do this?\" is always spinning in their head. Their shameless ability to bounce back with a goofy grin right after being scolded is a bonus. A born comedian who makes you laugh instead of stay angry.",
                        "jp": "{{pet_name}}にとってルールは「一度試してみるべき仮説」程度です。ソファに上がっちゃダメ？飼い主が見ていない時にこっそり上がってみてから様子を伺います。この子のいたずらは悪意ではなく、純粋な好奇心と退屈の結果です。「こうしたらどうなるかな？」という質問がいつも頭の中をぐるぐる。叱られてもすぐにへらっと笑顔で戻ってくる図々しさはおまけです。怒るより笑いが出てしまう、生まれながらのコメディアンです。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "extension",
                    "title": {
                        "ko": "끝없는 자극이 필요해",
                        "en": "Needs Endless Stimulation",
                        "jp": "終わりなき刺激が必要",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 가장 큰 적은 지루함이에요. 충분한 정신적 자극이 없으면 스스로 재미를 찾아 나서는데, 그 결과는 대체로 주인의 슬리퍼나 쿠션이 희생되는 것으로 나타나죠. 매일 새로운 퍼즐, 다양한 산책 코스, 새로운 트릭 훈련이 이 친구의 뇌를 건강하게 유지하는 비결이에요. 지루할 틈을 주지 않으면 파괴적인 창의성을 건설적인 방향으로 돌릴 수 있어요.",
                        "en": "{{pet_name}}'s greatest enemy is boredom. Without enough mental stimulation, they'll seek their own entertainment—usually resulting in sacrificed slippers or cushions. New puzzles daily, varied walking routes, and learning new tricks are the secrets to keeping this friend's brain healthy. If you don't give them time to get bored, you can redirect their destructive creativity in constructive directions.",
                        "jp": "{{pet_name}}の最大の敵は退屈です。十分な精神的刺激がないと自分で楽しみを探し始め、その結果は大抵飼い主のスリッパやクッションが犠牲になることに。毎日新しいパズル、様々な散歩コース、新しいトリックの訓練がこの子の脳を健康に保つ秘訣です。退屈な時間を与えなければ、破壊的な創造性を建設的な方向に向けることができます。",
                    },
                },
                {
                    "icon": "forum",
                    "title": {
                        "ko": "토론을 즐기는 개",
                        "en": "A Dog Who Enjoys Debates",
                        "jp": "議論を楽しむ犬",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 명령을 들으면 일단 "왜?"라고 되묻는 타입이에요. 앉으라고 하면 앉긴 하는데, 그 전에 살짝 주인의 눈치를 보며 "꼭 해야 해?"라는 표정을 짓죠. 이건 반항이 아니라 소통이에요. 이 친구는 일방적인 명령보다 "대화"를 원해요. 훈련할 때 이유와 보상을 명확히 해주면 놀라울 정도로 빨리 배우지만, 강압적으로 하면 오히려 더 고집을 부려요. 존중받는다고 느끼면 최고의 파트너가 됩니다.',
                        "en": '{{pet_name}} is the type who first asks "Why?" when given a command. Tell them to sit and they will—but not before giving you a look that says "Do I have to?" This isn\'t defiance; it\'s communication. This friend wants "conversation" rather than one-sided commands. If you make the reason and reward clear during training, they learn surprisingly fast, but if you\'re forceful, they become more stubborn. When they feel respected, they become the best partner.',
                        "jp": "{{pet_name}}は命令を聞くとまず「なぜ？」と聞き返すタイプです。座れと言えば座りますが、その前にちらっと飼い主の顔色を伺い「やらなきゃダメ？」という表情をします。これは反抗ではなくコミュニケーションです。この子は一方的な命令より「会話」を望んでいます。トレーニングで理由と報酬を明確にすれば驚くほど早く覚えますが、強制的にすると逆にもっと頑固になります。尊重されていると感じれば最高のパートナーになります。",
                    },
                },
            ],
        },
        # ============================================================
        # ENTJ - 당당한 지휘관
        # ============================================================
        {
            "id": "ENTJ",
            "alias": {
                "ko": "용감한 사령관",
                "en": "The Bold Commander",
                "jp": "勇敢な司令官",
            },
            "summary": {
                "ko": "태어날 때부터 리더, 카리스마와 자신감으로 모든 상황을 장악하는 보스",
                "en": "Born to lead, a boss who takes charge of every situation with charisma and confidence",
                "jp": "生まれながらのリーダー、カリスマと自信ですべての状況を掌握するボス",
            },
            "image_id": "dog_entj_main",
            "keywords": {
                "ko": ["리더십", "자신감", "목표지향"],
                "en": ["Leadership", "Confidence", "Goal-driven"],
                "jp": ["リーダーシップ", "自信", "目標志向"],
            },
            "statsLabels": {
                "sociability": {"ko": "외향적", "en": "Extroverted", "jp": "外向的"},
                "obedience": {"ko": "독립적", "en": "Independent", "jp": "独立的"},
                "temperament": {"ko": "활발함", "en": "Energetic", "jp": "活発"},
                "emotionality": {"ko": "이성적", "en": "Rational", "jp": "理性的"},
                "sagacity": {"ko": "직관적", "en": "Intuitive", "jp": "直感的"},
            },
            "coreTraits": [
                {
                    "icon": "military_tech",
                    "title": {
                        "ko": "타고난 지휘관",
                        "en": "Natural-Born Commander",
                        "jp": "生まれながらの指揮官",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 어떤 상황에서든 자연스럽게 주도권을 잡아요. 강아지 무리 속에서는 누가 시키지 않아도 선두에 서고, 산책할 때는 자신이 방향을 정하려 하죠. 이 당당한 존재감은 타고난 것이에요. 소심하게 눈치 보는 법이 없고, 원하는 것이 있으면 분명하게 표현합니다. 이 친구에게는 단호하면서도 일관된 리더십이 필요해요. 그렇지 않으면 {{pet_name}}가 집안의 진짜 보스가 되어버릴 거예요.",
                        "en": "{{pet_name}} naturally takes charge in any situation. In a group of dogs, they lead the pack without being asked; during walks, they try to decide the direction. This commanding presence is innate. They never timidly read the room—when they want something, they make it crystal clear. This friend needs firm yet consistent leadership. Otherwise, {{pet_name}} will become the true boss of the household.",
                        "jp": "{{pet_name}}はどんな状況でも自然と主導権を握ります。犬の群れの中では誰に言われなくても先頭に立ち、散歩では自分が方向を決めようとします。この堂々とした存在感は生まれつきのもの。おどおど様子を伺うことなく、欲しいものがあればはっきりと表現します。この子には毅然としつつも一貫したリーダーシップが必要です。そうでないと{{pet_name}}が家の本当のボスになってしまいます。",
                    },
                },
                {
                    "icon": "emoji_events",
                    "title": {
                        "ko": "목표를 향한 집념",
                        "en": "Relentless Drive for Goals",
                        "jp": "目標への執念",
                    },
                    "description": {
                        "ko": '{{pet_name}}가 한번 목표를 정하면, 그건 반드시 이루어져야 해요. 공이 소파 밑에 들어갔다고요? 포기란 없어요. 가구를 밀어보고, 다른 각도로 시도하고, 결국엔 어떻게든 꺼내고야 말죠. 이 끈질긴 집중력은 훈련에서 엄청난 장점이 돼요. 목표와 보상이 명확하면 어떤 복잡한 명령도 완벽히 수행해냅니다. 대신 "왜 이걸 해야 하는지" 납득이 안 되면 꿈쩍도 안 해요.',
                        "en": "Once {{pet_name}} sets a goal, it must be achieved. Ball rolled under the sofa? There's no giving up. They'll push the furniture, try different angles, and eventually get it out no matter what. This tenacious focus becomes a tremendous advantage in training. When goals and rewards are clear, they execute even complex commands perfectly. However, if they don't understand \"why they should do this,\" they won't budge.",
                        "jp": "{{pet_name}}が一度目標を定めたら、それは必ず達成されなければなりません。ボールがソファの下に入った？諦めるなんてありません。家具を押してみたり、違う角度から試したり、最終的にはどうにかして取り出します。この粘り強い集中力はトレーニングで大きな強みになります。目標と報酬が明確なら、どんな複雑な命令も完璧にこなします。ただし「なぜこれをやるべきか」納得できないと微動だにしません。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "schedule",
                    "title": {
                        "ko": "효율적인 일과 관리자",
                        "en": "Efficient Schedule Manager",
                        "jp": "効率的なスケジュール管理者",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 하루 일과를 정확히 파악하고 있어요. 아침 7시는 산책 시간, 저녁 6시는 밥 시간—이건 협상의 여지가 없죠. 시간이 되면 주인을 똑바로 쳐다보며 "시간이야"라고 무언의 압박을 가해요. 일과가 지켜지지 않으면 불만을 분명히 표시하고, 지켜지면 만족스러운 표정으로 자기 자리로 돌아갑니다. 이 친구와의 생활은 서로 간의 명확한 약속과 일관성이 핵심이에요.',
                        "en": "{{pet_name}} knows the daily schedule precisely. 7 AM is walk time, 6 PM is dinner time—there's no room for negotiation. When the time comes, they stare directly at their owner, silently pressuring \"It's time.\" If the routine isn't followed, they clearly show displeasure; if it is, they return to their spot with a satisfied expression. Life with this friend revolves around clear agreements and consistency between both parties.",
                        "jp": "{{pet_name}}は一日のスケジュールを正確に把握しています。朝7時は散歩の時間、夕方6時はご飯の時間—これに交渉の余地はありません。時間になると飼い主をまっすぐ見つめ「時間だよ」と無言のプレッシャーをかけます。日課が守られないと明らかに不満を示し、守られれば満足げな表情で自分の場所に戻ります。この子との生活はお互いの明確な約束と一貫性が鍵です。",
                    },
                },
                {
                    "icon": "workspace_premium",
                    "title": {
                        "ko": "인정받고 싶은 성취자",
                        "en": "Achiever Who Craves Recognition",
                        "jp": "認められたい達成者",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 단순히 간식을 위해 훈련하지 않아요. 이 친구가 진짜 원하는 건 인정과 칭찬이에요. 새로운 트릭을 완벽히 해냈을 때 주인이 진심으로 감탄하면, 그 자랑스러운 표정이란! 고개를 빳빳이 들고 "나 잘했지?"라는 눈빛으로 바라보죠. 반대로 노력이 무시당하면 상당히 서운해해요. 이 야망 있는 친구에게는 성취를 인정해주는 피드백이 최고의 동기부여입니다.',
                        "en": '{{pet_name}} doesn\'t train just for treats. What this friend truly wants is recognition and praise. When they perfectly execute a new trick and their owner shows genuine admiration, that proud expression is priceless! They hold their head high with a look that says "I did great, right?" Conversely, if their efforts are ignored, they feel quite hurt. For this ambitious friend, feedback that acknowledges their achievements is the best motivation.',
                        "jp": "{{pet_name}}は単におやつのためにトレーニングするのではありません。この子が本当に欲しいのは認められること、褒められることです。新しいトリックを完璧にこなして飼い主が心から感心すると、あの誇らしげな表情といったら！頭をピンと上げて「上手にできたでしょ？」という目で見つめます。逆に努力が無視されるとかなり傷つきます。この野心的な子には、成果を認めてくれるフィードバックが最高のモチベーションです。",
                    },
                },
            ],
        },
        # ============================================================
        # ESFP - 파티의 주인공
        # ============================================================
        {
            "id": "ESFP",
            "alias": {
                "ko": "기쁨의 퍼포머",
                "en": "The Joyful Performer",
                "jp": "喜びのパフォーマー",
            },
            "summary": {
                "ko": "모든 시선을 사로잡는 타고난 연예인, 삶 자체가 하나의 신나는 무대",
                "en": "A natural entertainer who captivates all eyes, where life itself is one exciting stage",
                "jp": "すべての視線を釘付けにする生まれながらのエンターテイナー、人生そのものがワクワクするステージ",
            },
            "image_id": "dog_esfp_main",
            "keywords": {
                "ko": ["관종", "낙천적", "에너지"],
                "en": ["Attention-lover", "Optimistic", "Energetic"],
                "jp": ["注目好き", "楽天的", "エネルギッシュ"],
            },
            "statsLabels": {
                "sociability": {"ko": "외향적", "en": "Extroverted", "jp": "外向的"},
                "obedience": {"ko": "협조적", "en": "Cooperative", "jp": "協調的"},
                "temperament": {"ko": "활발함", "en": "Energetic", "jp": "活発"},
                "emotionality": {"ko": "감성적", "en": "Sensitive", "jp": "感受性豊か"},
                "sagacity": {"ko": "본능적", "en": "Instinctive", "jp": "本能的"},
            },
            "coreTraits": [
                {
                    "icon": "theater_comedy",
                    "title": {
                        "ko": "타고난 엔터테이너",
                        "en": "Born Entertainer",
                        "jp": "生まれながらのエンターテイナー",
                    },
                    "description": {
                        "ko": "{{pet_name}}에게 세상은 거대한 무대이고, 모든 사람은 관객이에요. 손님이 오면? 즉석 공연이 시작됩니다. 장난감을 물고 신나게 뛰어다니고, 배를 뒤집어 보여주고, 온갖 귀여운 표정을 지어가며 웃음과 관심을 끌어내죠. 사람들이 웃으면 더 신이 나서 한층 업그레이드된 퍼포먼스를 선보여요. 이 친구 곁에서는 우울할 틈이 없어요. {{pet_name}}의 존재 자체가 살아있는 항우울제거든요.",
                        "en": "For {{pet_name}}, the world is a giant stage and everyone is an audience. Guests arriving? The impromptu show begins. Running around excitedly with a toy, rolling over to show their belly, making all sorts of adorable expressions to draw laughter and attention. When people laugh, they get even more excited and deliver an upgraded performance. There's no room for gloom around this friend. {{pet_name}}'s very existence is a living antidepressant.",
                        "jp": "{{pet_name}}にとって世界は巨大なステージで、すべての人が観客です。お客さんが来たら？即興ショーの始まりです。おもちゃをくわえて興奮して走り回り、お腹を見せてひっくり返り、あらゆる可愛い表情で笑いと注目を集めます。人が笑うともっと興奮して、さらにアップグレードしたパフォーマンスを披露します。この子のそばでは憂鬱になる暇がありません。{{pet_name}}の存在自体が生きた抗うつ剤ですから。",
                    },
                },
                {
                    "icon": "sunny",
                    "title": {
                        "ko": "무한 긍정 에너지",
                        "en": "Infinite Positive Energy",
                        "jp": "無限のポジティブエネルギー",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 "오늘"을 200% 즐기는 천재예요. 어제 혼났던 일? 이미 까맣게 잊었어요. 내일 병원 예약? 전혀 걱정 안 해요. 오직 지금 이 순간의 햇살, 바람, 냄새, 그리고 주인의 미소에만 집중하죠. 이 낙천적인 성격 덕분에 작은 일에도 꼬리가 미친 듯이 흔들리고, 평범한 산책도 인생 최고의 모험처럼 즐겨요. {{pet_name}}와 함께라면 일상의 작은 행복을 재발견하게 될 거예요.',
                        "en": "{{pet_name}} is a genius at enjoying \"today\" at 200%. Got scolded yesterday? Already completely forgotten. Vet appointment tomorrow? Not worried at all. They focus only on this moment's sunshine, breeze, scents, and their owner's smile. Thanks to this optimistic nature, their tail wags wildly over little things, and they enjoy ordinary walks like life's greatest adventures. With {{pet_name}}, you'll rediscover the small joys in everyday life.",
                        "jp": "{{pet_name}}は「今日」を200%楽しむ天才です。昨日叱られたこと？もうすっかり忘れています。明日の病院予約？全然心配していません。今この瞬間の日差し、風、匂い、そして飼い主の笑顔だけに集中します。この楽天的な性格のおかげで、小さなことでもしっぽが狂ったように振れ、普通の散歩も人生最高の冒険のように楽しみます。{{pet_name}}と一緒なら、日常の小さな幸せを再発見できるでしょう。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "celebration",
                    "title": {
                        "ko": "매 순간이 파티",
                        "en": "Every Moment is a Party",
                        "jp": "毎瞬間がパーティー",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 하루는 축제의 연속이에요. 아침에 주인이 일어나면? 마치 1년 만에 재회한 것처럼 환호해요. 간식 시간? 월드컵 우승 세리머니 수준의 기쁨이죠. 산책 준비? 집 안을 세 바퀴는 돌아야 직성이 풀려요. 이 폭발적인 에너지는 때로 정신없지만, 함께하는 모든 순간을 특별하게 만들어줘요. 단, 흥분이 지나치면 통제가 어려워지니 적절히 진정시키는 훈련도 필요해요.",
                        "en": "{{pet_name}}'s day is a continuous festival. Owner waking up in the morning? They celebrate like it's a reunion after a year apart. Treat time? Joy at World Cup victory celebration levels. Getting ready for a walk? They can't settle down until they've circled the house at least three times. This explosive energy can be overwhelming at times, but it makes every moment together special. However, when excitement goes too far, control becomes difficult, so training to calm down appropriately is also needed.",
                        "jp": "{{pet_name}}の一日はお祭りの連続です。朝、飼い主が起きたら？まるで1年ぶりの再会のように歓喜します。おやつの時間？ワールドカップ優勝セレモニーレベルの喜びです。散歩の準備？家の中を3周しないと気が済みません。この爆発的なエネルギーは時に大変ですが、一緒に過ごすすべての瞬間を特別にしてくれます。ただし、興奮が過ぎるとコントロールが難しくなるので、適度に落ち着かせるトレーニングも必要です。",
                    },
                },
                {
                    "icon": "groups",
                    "title": {
                        "ko": "모두의 인기스타",
                        "en": "Everyone's Favorite Star",
                        "jp": "みんなの人気スター",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 사람이든 개든 가리지 않고 친구를 사귀어요. 공원에서 5분이면 모든 강아지와 보호자의 이름을 외울 정도죠(있다면요). 이 친구의 사교성은 진짜 대단해서, 처음 보는 사람에게도 마치 오랜 친구에게 하듯 꼬리를 흔들며 다가가요. 관심받는 걸 너무 좋아해서 혼자 있는 시간이 길어지면 외로워해요. {{pet_name}}에게 사회적 교류는 밥만큼이나 중요한 필수 영양소예요.",
                        "en": "{{pet_name}} makes friends with anyone—human or dog, it doesn't matter. They could memorize the names of every dog and owner at the park within 5 minutes (if they could). This friend's social skills are truly remarkable, approaching strangers while wagging their tail as if greeting an old friend. They love attention so much that they get lonely if left alone too long. For {{pet_name}}, social interaction is as essential a nutrient as food.",
                        "jp": "{{pet_name}}は人でも犬でも関係なく友達を作ります。公園で5分もあればすべての犬と飼い主の名前を覚えてしまうほど（できれば、ですが）。この子の社交性は本当にすごくて、初めて会う人にもまるで古い友人のようにしっぽを振りながら近づきます。注目されるのが大好きで、一人の時間が長くなると寂しがります。{{pet_name}}にとって社会的な交流はご飯と同じくらい大切な必須栄養素です。",
                    },
                },
            ],
        },
        # ============================================================
        # ESFJ - 다정한 돌봄이
        # ============================================================
        {
            "id": "ESFJ",
            "alias": {
                "ko": "사교적인 수호자",
                "en": "The Social Guardian",
                "jp": "社交的な守護者",
            },
            "summary": {
                "ko": "가족의 행복을 위해 헌신하는 다정한 살림꾼, 눈치 백단의 사랑꾼",
                "en": "A warm caretaker devoted to the family's happiness, a loving soul with exceptional intuition",
                "jp": "家族の幸せに尽くす優しい世話役、空気を読む達人の愛情深い子",
            },
            "image_id": "dog_esfj_main",
            "keywords": {
                "ko": ["다정함", "눈치왕", "헌신적"],
                "en": ["Affectionate", "Perceptive", "Devoted"],
                "jp": ["優しい", "空気が読める", "献身的"],
            },
            "statsLabels": {
                "sociability": {"ko": "외향적", "en": "Extroverted", "jp": "外向的"},
                "obedience": {"ko": "협조적", "en": "Cooperative", "jp": "協調的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "감성적", "en": "Sensitive", "jp": "感受性豊か"},
                "sagacity": {"ko": "본능적", "en": "Instinctive", "jp": "本能的"},
            },
            "coreTraits": [
                {
                    "icon": "diversity_3",
                    "title": {
                        "ko": "가족 중심의 세계관",
                        "en": "Family-Centered Worldview",
                        "jp": "家族中心の世界観",
                    },
                    "description": {
                        "ko": "{{pet_name}}에게 가족은 우주의 전부예요. 아침에 모든 가족 구성원에게 인사를 돌리고, 누가 외출하면 창가에서 지켜보고, 모두가 모이는 저녁 시간을 가장 행복해해요. 가족이 함께 있을 때 {{pet_name}}의 표정은 완전히 달라져요—편안하고 만족스러운 미소가 얼굴 가득 퍼지죠. 이 친구의 최대 행복은 사랑하는 사람들이 한자리에 모여 있는 것, 그것만으로도 세상을 다 가진 표정을 지어요.",
                        "en": "For {{pet_name}}, family is the entire universe. They greet every family member in the morning, watch from the window when someone leaves, and are happiest during evening time when everyone gathers. {{pet_name}}'s expression completely changes when the family is together—a comfortable, satisfied smile spreads across their face. This friend's greatest happiness is having loved ones gathered in one place; that alone makes them look like they have the whole world.",
                        "jp": "{{pet_name}}にとって家族は宇宙のすべてです。朝はすべての家族に挨拶をして回り、誰かが外出すれば窓辺で見守り、みんなが集まる夕方の時間を一番幸せそうにします。家族が一緒にいる時、{{pet_name}}の表情は完全に変わります—安らかで満足げな笑顔が顔いっぱいに広がります。この子の最大の幸せは愛する人たちが一堂に会すること、それだけで世界を手に入れたような表情をします。",
                    },
                },
                {
                    "icon": "psychology_alt",
                    "title": {
                        "ko": "눈치의 달인",
                        "en": "Master of Reading the Room",
                        "jp": "空気を読む達人",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 눈치력은 거의 초능력 수준이에요. 주인이 기분이 안 좋으면 조용히 다가와 곁에 앉고, 손님이 불편해하면 거리를 두고, 아이가 울면 달려가 핥아주죠. 가족 간에 긴장이 흐르면 슬쩍 끼어들어 분위기를 바꾸려 해요. 마치 가정의 감정 온도계처럼, {{pet_name}}는 미세한 분위기 변화도 감지하고 거기에 맞춰 행동합니다. 이 섬세함 덕분에 누구와도 잘 어울리는 최고의 가정견이에요.",
                        "en": "{{pet_name}}'s perceptiveness is almost at a superpower level. When their owner is feeling down, they quietly approach and sit beside them; when a guest seems uncomfortable, they keep their distance; when a child cries, they run over to give comforting licks. When tension flows between family members, they subtly intervene to change the atmosphere. Like an emotional thermometer for the home, {{pet_name}} detects even subtle mood changes and acts accordingly. Thanks to this sensitivity, they're the ultimate family dog who gets along with everyone.",
                        "jp": "{{pet_name}}の空気を読む力はほぼ超能力レベルです。飼い主の機嫌が悪いと静かに近づいてそばに座り、お客さんが居心地悪そうなら距離を置き、子供が泣けば駆け寄って舐めてあげます。家族間に緊張が流れるとそっと間に入って雰囲気を変えようとします。まるで家庭の感情温度計のように、{{pet_name}}は微妙な雰囲気の変化も感知し、それに合わせて行動します。この繊細さのおかげで、誰とでもうまくやれる最高の家庭犬です。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "routine",
                    "title": {
                        "ko": "규칙적인 일상의 수호자",
                        "en": "Guardian of Routine",
                        "jp": "規則正しい日常の守護者",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 정해진 일상을 사랑해요. 매일 같은 시간에 산책하고, 같은 시간에 밥을 먹고, 같은 시간에 잠드는 것—이 예측 가능한 리듬이 이 친구에게는 안정감을 줘요. 일과가 흐트러지면 불안해하는 모습을 보이기도 하죠. 하지만 그 덕분에 가족의 일상을 챙기는 역할도 해요. 아침에 알람보다 먼저 주인을 깨우고, 저녁이면 산책 시간을 정확히 알려주는 살아있는 스케줄러예요.",
                        "en": "{{pet_name}} loves a set routine. Walking at the same time every day, eating at the same time, going to sleep at the same time—this predictable rhythm gives this friend a sense of security. When routines are disrupted, they may show signs of anxiety. But thanks to this, they also help keep the family's daily life on track. A living scheduler who wakes their owner before the alarm in the morning and precisely announces walk time in the evening.",
                        "jp": "{{pet_name}}は決まった日課が大好きです。毎日同じ時間に散歩し、同じ時間にご飯を食べ、同じ時間に眠る—この予測可能なリズムがこの子に安心感を与えます。日課が乱れると不安そうな様子を見せることも。でもそのおかげで、家族の日常を管理する役割も果たします。朝はアラームより先に飼い主を起こし、夕方には散歩の時間を正確に知らせてくれる生きたスケジューラーです。",
                    },
                },
                {
                    "icon": "favorite",
                    "title": {
                        "ko": "인정받고 싶은 사랑꾼",
                        "en": "A Lover Who Wants to Be Appreciated",
                        "jp": "認められたい愛情深い子",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 가족을 기쁘게 하는 것에서 가장 큰 보람을 느껴요. 명령을 잘 따르고, 얌전히 기다리고, 가르친 대로 행동했을 때 "잘했어!"라는 칭찬을 들으면 온몸이 녹아내리는 것처럼 행복해하죠. 반대로 무시당하거나 냉대를 받으면 눈에 띄게 풀이 죽어요. 이 친구에게 사랑과 인정은 산소와 같아요. 따뜻한 말 한마디, 쓰다듬 한 번이 {{pet_name}}의 하루를 완성시켜줍니다.',
                        "en": '{{pet_name}} finds the greatest fulfillment in pleasing the family. When following commands well, waiting patiently, and behaving as taught earns them a "Good job!" they look happy enough to melt. Conversely, when ignored or treated coldly, they visibly deflate. For this friend, love and recognition are like oxygen. A warm word, a single pat—these complete {{pet_name}}\'s day.',
                        "jp": "{{pet_name}}は家族を喜ばせることに最大のやりがいを感じます。命令をよく聞いて、おとなしく待って、教わった通りに行動して「よくできたね！」と褒められると、全身がとろけるように幸せそうにします。逆に無視されたり冷たくされると、目に見えて元気がなくなります。この子にとって愛と認められることは酸素と同じです。温かい一言、一度の撫でが{{pet_name}}の一日を完成させます。",
                    },
                },
            ],
        },
        # ============================================================
        # ESTP - 대담한 모험가
        # ============================================================
        {
            "id": "ESTP",
            "alias": {
                "ko": "두려움 없는 모험가",
                "en": "The Fearless Adventurer",
                "jp": "恐れ知らずの冒険家",
            },
            "summary": {
                "ko": "생각보다 몸이 먼저, 어떤 상황에서도 거침없이 돌진하는 액션 히어로",
                "en": "Body before mind, an action hero who charges forward fearlessly in any situation",
                "jp": "考えるより先に体が動く、どんな状況でも躊躇なく突き進むアクションヒーロー",
            },
            "image_id": "dog_estp_main",
            "keywords": {
                "ko": ["행동파", "용감함", "적응력"],
                "en": ["Action-oriented", "Brave", "Adaptable"],
                "jp": ["行動派", "勇敢", "適応力"],
            },
            "statsLabels": {
                "sociability": {"ko": "외향적", "en": "Extroverted", "jp": "外向的"},
                "obedience": {"ko": "독립적", "en": "Independent", "jp": "独立的"},
                "temperament": {"ko": "활발함", "en": "Energetic", "jp": "活発"},
                "emotionality": {"ko": "이성적", "en": "Rational", "jp": "理性的"},
                "sagacity": {"ko": "본능적", "en": "Instinctive", "jp": "本能的"},
            },
            "coreTraits": [
                {
                    "icon": "directions_run",
                    "title": {
                        "ko": "멈출 줄 모르는 액션파",
                        "en": "Unstoppable Action Hero",
                        "jp": "止まることを知らないアクション派",
                    },
                    "description": {
                        "ko": '{{pet_name}}에게 "조심해"라는 말은 존재하지 않아요. 높은 곳? 일단 뛰어내려요. 깊은 물? 일단 뛰어들어요. 처음 보는 길? 일단 달려봐요. 이 친구의 모토는 "일단 해보고 생각하자"예요. 덕분에 매일이 스릴 넘치는 모험이지만, 가끔 주인의 심장을 철렁하게 만들기도 하죠. 이 무한한 에너지와 용기는 적절한 운동과 활동으로 분출시켜주지 않으면 온 집안이 놀이터가 될 수 있어요.',
                        "en": 'The words "be careful" don\'t exist for {{pet_name}}. High place? Jump down first. Deep water? Dive in first. Unfamiliar path? Run down it first. This friend\'s motto is "Do it first, think later." Thanks to this, every day is a thrilling adventure, though it sometimes makes their owner\'s heart skip a beat. This infinite energy and courage needs proper exercise and activities to release—otherwise, the whole house becomes a playground.',
                        "jp": "{{pet_name}}に「気をつけて」という言葉は存在しません。高い所？とりあえず飛び降りる。深い水？とりあえず飛び込む。初めての道？とりあえず走ってみる。この子のモットーは「まずやってから考えよう」です。おかげで毎日がスリル満点の冒険ですが、時に飼い主の心臓をドキッとさせることも。この無限のエネルギーと勇気は適切な運動と活動で発散させないと、家中が遊び場になってしまいます。",
                    },
                },
                {
                    "icon": "bolt",
                    "title": {
                        "ko": "번개 같은 반사신경",
                        "en": "Lightning-Fast Reflexes",
                        "jp": "稲妻のような反射神経",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 반응 속도는 놀라워요. 공이 날아오면 눈 깜짝할 사이에 낚아채고, 다람쥐가 보이면 생각할 틈도 없이 추격전이 시작되죠. 이 뛰어난 신체 능력과 순발력은 어질리티나 프리스비 같은 스포츠에서 빛을 발해요. 경쟁심도 강해서 다른 개와 함께 뛰면 절대 지지 않으려고 해요. 이 친구에게 몸을 움직이는 것은 단순한 운동이 아니라 삶의 기쁨 그 자체예요.",
                        "en": "{{pet_name}}'s reaction speed is remarkable. When a ball flies through the air, they snatch it in the blink of an eye; when a squirrel appears, the chase begins before they can even think. This outstanding physical ability and quick reflexes shine in sports like agility or frisbee. They're also highly competitive—when running with other dogs, they refuse to lose. For this friend, physical movement isn't just exercise; it's the joy of life itself.",
                        "jp": "{{pet_name}}の反応速度は驚くべきものです。ボールが飛んでくれば瞬きする間に捕らえ、リスが見えたら考える暇もなく追跡が始まります。この優れた身体能力と瞬発力はアジリティやフリスビーなどのスポーツで輝きます。競争心も強く、他の犬と一緒に走ると絶対に負けまいとします。この子にとって体を動かすことは単なる運動ではなく、人生の喜びそのものです。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "sync",
                    "title": {
                        "ko": "어디서든 적응 완료",
                        "en": "Adapts Anywhere",
                        "jp": "どこでも適応完了",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 환경 변화에 전혀 동요하지 않아요. 새로운 집, 낯선 장소, 처음 만나는 사람들—다른 개들이 긴장할 상황에서도 이 친구는 꼬리 흔들며 탐험을 시작해요. "여기도 재밌겠네!"라는 태도로 어디든 적응하죠. 여행이나 이사를 자주 하는 가정에는 최고의 파트너예요. 단, 너무 적응을 잘해서 남의 집에서도 자기 집처럼 행동하는 건 주의해야 해요.',
                        "en": "{{pet_name}} is completely unfazed by environmental changes. A new home, unfamiliar places, people they've never met—in situations where other dogs would be nervous, this friend starts exploring with a wagging tail. With an attitude of \"This looks fun too!\" they adapt anywhere. The perfect partner for families who travel or move frequently. However, be careful—they adapt so well that they might act like they own the place even in someone else's home.",
                        "jp": "{{pet_name}}は環境の変化に全く動じません。新しい家、見知らぬ場所、初めて会う人々—他の犬が緊張する状況でもこの子はしっぽを振りながら探検を始めます。「ここも楽しそう！」という態度でどこにでも適応します。旅行や引っ越しが多い家庭には最高のパートナーです。ただし、適応しすぎて他人の家でも自分の家のように振る舞うのは要注意です。",
                    },
                },
                {
                    "icon": "local_fire_department",
                    "title": {
                        "ko": "위기의 순간에 빛나는",
                        "en": "Shines in Crisis Moments",
                        "jp": "危機の瞬間に輝く",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 긴급 상황에서 진가를 발휘해요. 다른 개들이 멍하니 있을 때, 이 친구는 이미 행동을 개시하죠. 이상한 소리가 나면 가장 먼저 확인하러 가고, 가족 중 누군가가 위험에 처하면 본능적으로 달려들어요. 이 본능적인 보호 의식과 빠른 판단력은 믿음직스러운 경호원 같아요. 하지만 가끔 위험이 아닌 상황도 위험으로 판단해서 과잉 반응할 때가 있으니, 진짜 위험과 아닌 것을 구별하는 훈련이 도움이 돼요.",
                        "en": "{{pet_name}} shows their true worth in emergency situations. While other dogs stand frozen, this friend is already taking action. When strange sounds occur, they're the first to investigate; when a family member is in danger, they instinctively rush in. This instinctive protective awareness and quick judgment make them like a trustworthy bodyguard. However, they sometimes overreact to non-dangerous situations, so training to distinguish real threats from false alarms can help.",
                        "jp": "{{pet_name}}は緊急事態で真価を発揮します。他の犬がぼんやりしている時、この子はすでに行動を開始しています。おかしな音がすれば真っ先に確認しに行き、家族の誰かが危険にさらされれば本能的に駆けつけます。この本能的な保護意識と素早い判断力は頼もしいボディガードのようです。ただし、時に危険でない状況も危険と判断して過剰反応することがあるので、本当の危険とそうでないものを区別するトレーニングが役立ちます。",
                    },
                },
            ],
        },
        # ============================================================
        # ESTJ - 믿음직한 수호자
        # ============================================================
        {
            "id": "ESTJ",
            "alias": {
                "ko": "훈련된 캡틴",
                "en": "The Disciplined Captain",
                "jp": "訓練されたキャプテン",
            },
            "summary": {
                "ko": "규칙과 질서를 사랑하는 모범생, 흔들림 없는 충성심의 대명사",
                "en": "A model citizen who loves rules and order, the epitome of unwavering loyalty",
                "jp": "規則と秩序を愛する模範生、揺るぎない忠誠心の代名詞",
            },
            "image_id": "dog_estj_main",
            "keywords": {
                "ko": ["규칙준수", "충성심", "성실함"],
                "en": ["Rule-abiding", "Loyal", "Diligent"],
                "jp": ["規則遵守", "忠誠心", "誠実"],
            },
            "statsLabels": {
                "sociability": {"ko": "외향적", "en": "Extroverted", "jp": "外向的"},
                "obedience": {"ko": "협조적", "en": "Cooperative", "jp": "協調的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "이성적", "en": "Rational", "jp": "理性的"},
                "sagacity": {"ko": "본능적", "en": "Instinctive", "jp": "本能的"},
            },
            "coreTraits": [
                {
                    "icon": "verified",
                    "title": {
                        "ko": "규칙의 수호자",
                        "en": "Guardian of Rules",
                        "jp": "規則の守護者",
                    },
                    "description": {
                        "ko": '{{pet_name}}에게 규칙은 단순한 지침이 아니라 삶의 근본이에요. 한번 "안 돼"라고 배운 것은 절대 하지 않고, 허락된 행동만 정확히 해요. 소파에 못 올라간다고요? 10년이 지나도 올라가지 않아요. 이 흔들림 없는 일관성은 훈련을 믿을 수 없이 쉽게 만들어줘요. 단, 한번 잘못 배운 규칙도 똑같이 지키려 하니, 처음부터 올바르게 가르치는 것이 중요해요. 이 친구는 분명한 경계와 기대치를 알려주면 그 안에서 최선을 다합니다.',
                        "en": "For {{pet_name}}, rules aren't just guidelines—they're the foundation of life. What they learn as \"no\" is never done, and they perform only permitted actions precisely. Not allowed on the sofa? They won't climb up even after 10 years. This unwavering consistency makes training incredibly easy. However, they'll follow incorrectly learned rules just as firmly, so teaching correctly from the start is crucial. Give this friend clear boundaries and expectations, and they'll do their absolute best within them.",
                        "jp": "{{pet_name}}にとって規則は単なる指針ではなく、人生の根本です。一度「ダメ」と学んだことは絶対にせず、許された行動だけを正確に行います。ソファに上がっちゃダメ？10年経っても上がりません。この揺るぎない一貫性はトレーニングを信じられないほど簡単にしてくれます。ただし、一度間違って学んだ規則も同様に守ろうとするので、最初から正しく教えることが重要です。この子に明確な境界と期待を示せば、その中で最善を尽くします。",
                    },
                },
                {
                    "icon": "workspace_premium",
                    "title": {
                        "ko": "철통 같은 충성심",
                        "en": "Iron-Clad Loyalty",
                        "jp": "鉄壁の忠誠心",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 충성심은 타의 추종을 불허해요. 한번 주인으로 인정하면, 그 관계는 영원히 흔들리지 않아요. 다른 사람이 아무리 맛있는 간식을 줘도 주인의 명령이 우선이고, 위험한 상황에서는 망설임 없이 가족을 지키려 해요. 이 깊은 헌신은 오랜 시간에 걸쳐 더욱 단단해져요. {{pet_name}}는 가벼운 애정 표현보다 묵묵히 곁을 지키는 것으로 사랑을 보여주는, 진정한 의리의 사나이(혹은 숙녀)예요.",
                        "en": "{{pet_name}}'s loyalty is unrivaled. Once they recognize someone as their owner, that relationship never wavers. No matter how delicious the treats others offer, their owner's commands come first, and in dangerous situations, they unhesitatingly try to protect the family. This deep devotion grows stronger over time. {{pet_name}} shows love not through casual affection but by silently staying by your side—a true gentleman (or lady) of loyalty.",
                        "jp": "{{pet_name}}の忠誠心は他の追随を許しません。一度飼い主と認めたら、その関係は永遠に揺るぎません。他の人がどんなに美味しいおやつをくれても飼い主の命令が優先で、危険な状況では躊躇なく家族を守ろうとします。この深い献身は長い時間をかけてさらに固くなります。{{pet_name}}は軽い愛情表現より黙々とそばにいることで愛を示す、真の義理堅い紳士（または淑女）です。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "schedule",
                    "title": {
                        "ko": "정확한 체내시계",
                        "en": "Precise Internal Clock",
                        "jp": "正確な体内時計",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 체내시계는 스위스 명품 시계보다 정확해요. 아침 7시 산책, 저녁 6시 밥—단 1분의 오차도 허용하지 않죠. 시간이 되면 주인 앞에 딱 앉아서 무언의 압박을 가하고, 그래도 안 되면 짧은 짖음으로 리마인더를 보내요. 이 철저한 시간 관념 덕분에 가족의 일과도 자연스럽게 규칙적으로 바뀌게 돼요. {{pet_name}}와 함께 사는 건 곧 규칙적인 생활 습관을 얻는 거예요.",
                        "en": "{{pet_name}}'s internal clock is more accurate than a Swiss luxury watch. Morning walk at 7 AM, dinner at 6 PM—not even a one-minute deviation is tolerated. When it's time, they sit squarely in front of their owner with silent pressure, and if that doesn't work, they send a reminder with a short bark. Thanks to this thorough sense of time, the family's routine naturally becomes more regular. Living with {{pet_name}} means gaining disciplined life habits.",
                        "jp": "{{pet_name}}の体内時計はスイスの高級時計より正確です。朝7時の散歩、夕方6時のご飯—1分の誤差も許しません。時間になると飼い主の前にぴたっと座って無言のプレッシャーをかけ、それでもダメなら短く吠えてリマインダーを送ります。この徹底した時間観念のおかげで、家族の日課も自然と規則的になります。{{pet_name}}と暮らすことは、規則正しい生活習慣を手に入れることです。",
                    },
                },
                {
                    "icon": "task_alt",
                    "title": {
                        "ko": "맡은 일은 반드시 완수",
                        "en": "Always Completes the Mission",
                        "jp": "任された仕事は必ず完遂",
                    },
                    "description": {
                        "ko": '{{pet_name}}에게 역할을 주면, 그건 신성한 의무가 돼요. "집 지켜"라고 하면 진짜로 온 신경을 곤두세우고 집을 지키고, "기다려"라고 하면 돌처럼 굳어서 기다려요. 이 책임감 있는 태도는 목적이 있는 활동을 할 때 더욱 빛나요. 간단한 심부름 훈련이나 물건 가져오기 같은 "임무"를 주면 {{pet_name}}는 자신의 존재 가치를 확인하며 큰 보람을 느껴요. 할 일이 있을 때 가장 행복한 일꾼이에요.',
                        "en": 'When given a role, it becomes a sacred duty for {{pet_name}}. Say "guard the house" and they truly go on high alert to protect it; say "wait" and they freeze like a statue. This responsible attitude shines brightest during purposeful activities. Give them a "mission" like simple errand training or fetching items, and {{pet_name}} feels great fulfillment confirming their sense of purpose. They\'re happiest when they have a job to do.',
                        "jp": "{{pet_name}}に役割を与えると、それは神聖な義務になります。「家を守って」と言えば本当に神経を研ぎ澄ませて家を守り、「待って」と言えば石のように固まって待ちます。この責任感ある態度は目的のある活動をする時にさらに輝きます。簡単なお使い訓練や物を持ってくるような「任務」を与えると、{{pet_name}}は自分の存在価値を確認して大きなやりがいを感じます。やることがある時が一番幸せな働き者です。",
                    },
                },
            ],
        },
        # ============================================================
        # INFP - 몽상가 시인
        # ============================================================
        {
            "id": "INFP",
            "alias": {
                "ko": "온순한 공상가",
                "en": "The Gentle Dreamer",
                "jp": "穏やかな夢想家",
            },
            "summary": {
                "ko": "자신만의 세계에서 조용히 빛나는 감성적인 영혼, 깊은 유대의 소유자",
                "en": "A sensitive soul quietly shining in their own world, possessing deep bonds",
                "jp": "自分だけの世界で静かに輝く感性豊かな魂、深い絆の持ち主",
            },
            "image_id": "dog_infp_main",
            "keywords": {
                "ko": ["감수성", "평화로움", "깊은 유대"],
                "en": ["Sensitive", "Peaceful", "Deep bonds"],
                "jp": ["感受性", "穏やか", "深い絆"],
            },
            "statsLabels": {
                "sociability": {"ko": "내향적", "en": "Introverted", "jp": "内向的"},
                "obedience": {"ko": "독립적", "en": "Independent", "jp": "独立的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "감성적", "en": "Sensitive", "jp": "感受性豊か"},
                "sagacity": {"ko": "직관적", "en": "Intuitive", "jp": "直感的"},
            },
            "coreTraits": [
                {
                    "icon": "auto_awesome",
                    "title": {
                        "ko": "몽상가의 눈동자",
                        "en": "Eyes of a Dreamer",
                        "jp": "夢想家の瞳",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 가끔 창밖을 멍하니 바라보며 무언가를 생각하는 것 같아요. 뭘 보고 있는지 물어보고 싶을 만큼 깊은 눈빛이죠. 이 친구는 자기만의 내면 세계가 풍요로워서, 혼자 있어도 무료해하지 않고 조용히 사색에 잠겨요. 바람에 흔들리는 나뭇잎, 천천히 움직이는 그림자, 창문에 맺힌 빗방울—다른 개들이 무시하는 작은 것들에서 {{pet_name}}는 끝없는 이야기를 발견해요.",
                        "en": "{{pet_name}} sometimes stares blankly out the window, seemingly lost in thought. Those deep eyes make you want to ask what they're seeing. This friend has such a rich inner world that they don't get bored alone, quietly immersed in contemplation. Leaves swaying in the wind, slowly moving shadows, raindrops on the window—{{pet_name}} discovers endless stories in small things that other dogs ignore.",
                        "jp": "{{pet_name}}は時々窓の外をぼんやり見つめて何か考えているようです。何を見ているか聞きたくなるほど深い眼差しです。この子は自分だけの内面世界が豊かで、一人でいても退屈せず静かに物思いにふけります。風に揺れる木の葉、ゆっくり動く影、窓についた雨粒—他の犬が無視する小さなものから{{pet_name}}は終わりのない物語を見つけます。",
                    },
                },
                {
                    "icon": "nights_stay",
                    "title": {
                        "ko": "조용한 감정의 바다",
                        "en": "A Quiet Sea of Emotions",
                        "jp": "静かな感情の海",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 겉으로 드러내지 않지만, 그 안에는 깊은 감정의 바다가 출렁이고 있어요. 주인의 기분이 안 좋으면 말없이 곁에 다가와 몸을 기대고, 행복한 순간에는 조용히 꼬리를 살랑거리며 함께 기뻐해요. 이 섬세한 공감 능력은 거칠거나 시끄러운 환경에서는 쉽게 지치게 만들기도 해요. {{pet_name}}에게는 편안하고 안전한 자신만의 공간이 꼭 필요해요.",
                        "en": "{{pet_name}} doesn't show it outwardly, but inside, a deep sea of emotions is swelling. When their owner feels down, they silently come close and lean in; during happy moments, they quietly wag their tail and share the joy. This delicate empathy can make them easily exhausted in rough or noisy environments. {{pet_name}} absolutely needs their own comfortable and safe space.",
                        "jp": "{{pet_name}}は表には出しませんが、その中には深い感情の海が揺れています。飼い主の気分が悪いと黙ってそばに来て寄り添い、幸せな瞬間には静かにしっぽを揺らして一緒に喜びます。この繊細な共感能力は、荒っぽかったり騒がしい環境では疲れやすくさせることも。{{pet_name}}には快適で安全な自分だけの空間が必ず必要です。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "spa",
                    "title": {
                        "ko": "평화로운 일상의 시인",
                        "en": "Poet of Peaceful Days",
                        "jp": "平和な日常の詩人",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 이상적인 하루는 조용하고 예측 가능해요. 아침 햇살이 드는 자리에서 낮잠을 자고, 주인 곁에서 조용히 함께 시간을 보내고, 저녁에는 한적한 길을 천천히 산책하는 거죠. 자극적인 환경보다 평온한 분위기를 좋아하고, 갑작스러운 변화에는 적응하는 데 시간이 걸려요. 이 친구와의 생활은 느긋하고 여유로운 리듬을 따라가게 만들어요—그리고 그게 나쁘지 않아요.",
                        "en": "{{pet_name}}'s ideal day is quiet and predictable. Napping in a spot where morning sunlight streams in, spending quiet time beside their owner, and taking a slow evening walk on an uncrowded path. They prefer calm atmospheres to stimulating environments and need time to adapt to sudden changes. Life with this friend leads you to follow a leisurely, relaxed rhythm—and that's not a bad thing.",
                        "jp": "{{pet_name}}の理想的な一日は静かで予測可能です。朝日が差し込む場所で昼寝をして、飼い主のそばで静かに一緒に時間を過ごし、夕方は人気のない道をゆっくり散歩する。刺激的な環境より穏やかな雰囲気を好み、急な変化には適応に時間がかかります。この子との生活はのんびりとしたリズムに従うことになります—そしてそれは悪くありません。",
                    },
                },
                {
                    "icon": "loyalty",
                    "title": {
                        "ko": "하나뿐인 사람",
                        "en": "The One and Only Person",
                        "jp": "たった一人の人",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 많은 사람에게 둘러싸이는 것보다 특별한 한 사람과의 깊은 관계를 원해요. 모든 가족을 좋아하지만, 진짜 마음을 여는 건 딱 한 명—{{pet_name}}가 선택한 "자기 사람"이에요. 그 사람과 함께 있을 때만 보여주는 표정, 그 사람에게만 하는 행동들이 있어요. 이 특별한 유대는 시간이 지날수록 더 깊어지고, 한번 형성되면 평생 변하지 않는 영혼의 연결이 돼요.',
                        "en": '{{pet_name}} wants a deep relationship with one special person rather than being surrounded by many people. They like all family members, but they truly open their heart to only one—"their person" whom {{pet_name}} has chosen. There are expressions shown only when with that person, behaviors reserved only for them. This special bond deepens over time, and once formed, becomes a soul connection that never changes for life.',
                        "jp": "{{pet_name}}は多くの人に囲まれるより、特別な一人との深い関係を望みます。家族みんなを好きですが、本当に心を開くのはたった一人—{{pet_name}}が選んだ「自分の人」です。その人と一緒の時だけ見せる表情、その人にだけする行動があります。この特別な絆は時間が経つほど深まり、一度形成されると生涯変わらない魂のつながりになります。",
                    },
                },
            ],
        },
        # ============================================================
        # INFJ - 신비로운 현자
        # ============================================================
        {
            "id": "INFJ",
            "alias": {"ko": "영혼의 현자", "en": "The Soulful Sage", "jp": "魂の賢者"},
            "summary": {
                "ko": "말없이 모든 것을 꿰뚫어 보는 신비로운 통찰력의 소유자",
                "en": "A mysterious soul with insight that sees through everything without words",
                "jp": "言葉なくすべてを見通す神秘的な洞察力の持ち主",
            },
            "image_id": "dog_infj_main",
            "keywords": {
                "ko": ["통찰력", "헌신적", "신비로움"],
                "en": ["Insightful", "Devoted", "Mysterious"],
                "jp": ["洞察力", "献身的", "神秘的"],
            },
            "statsLabels": {
                "sociability": {"ko": "내향적", "en": "Introverted", "jp": "内向的"},
                "obedience": {"ko": "협조적", "en": "Cooperative", "jp": "協調的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "감성적", "en": "Sensitive", "jp": "感受性豊か"},
                "sagacity": {"ko": "직관적", "en": "Intuitive", "jp": "直感的"},
            },
            "coreTraits": [
                {
                    "icon": "visibility",
                    "title": {
                        "ko": "꿰뚫어 보는 눈",
                        "en": "Eyes That See Through",
                        "jp": "見通す眼",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 눈을 들여다보면, 마치 이 친구가 당신의 마음속까지 읽고 있는 듯한 느낌을 받아요. 말로 표현하기 전에 당신의 기분을 알아채고, 아무도 눈치채지 못한 당신의 피로함을 감지하죠. 손님이 오면 잠깐 눈을 마주치는 것만으로 그 사람의 성격을 파악하는 것 같아요. 이 신비로운 직관력 덕분에 {{pet_name}}는 때때로 개가 아니라 작은 현자처럼 느껴져요.",
                        "en": "When you look into {{pet_name}}'s eyes, you feel as if this friend is reading into your very soul. They sense your mood before you express it in words, detecting your exhaustion when no one else notices. When guests arrive, a brief moment of eye contact seems enough for them to assess that person's character. Thanks to this mysterious intuition, {{pet_name}} sometimes feels less like a dog and more like a small sage.",
                        "jp": "{{pet_name}}の目を覗き込むと、まるでこの子があなたの心の中まで読んでいるような気がします。言葉で表現する前にあなたの気分を察し、誰も気づかないあなたの疲れを感知します。お客さんが来ると、ちょっと目を合わせただけでその人の性格を把握しているようです。この神秘的な直感力のおかげで、{{pet_name}}は時々犬というより小さな賢者のように感じられます。",
                    },
                },
                {
                    "icon": "volunteer_activism",
                    "title": {
                        "ko": "조용한 헌신자",
                        "en": "Silent Devotee",
                        "jp": "静かな献身者",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 사랑 표현은 화려하지 않아요. 미친 듯이 꼬리를 흔들거나 온 집안을 뛰어다니는 대신, 당신이 힘들 때 조용히 발치에 앉아있고, 아플 때 곁을 떠나지 않아요. 존재 자체로 위로를 주는 방식이죠. 이 조용하지만 깊은 헌신은 시간이 지날수록 그 가치를 깨닫게 돼요. {{pet_name}}는 시끄러운 사랑이 아니라 영혼을 어루만지는 사랑을 주는 친구예요.",
                        "en": "{{pet_name}}'s expressions of love aren't flashy. Instead of wagging their tail wildly or running around the house, they sit quietly at your feet when you're having a hard time and never leave your side when you're sick. It's a way of comforting through their very presence. This quiet but deep devotion becomes more appreciated over time. {{pet_name}} gives love that soothes the soul, not loud love.",
                        "jp": "{{pet_name}}の愛情表現は派手ではありません。しっぽを激しく振ったり家中を走り回る代わりに、あなたが辛い時は静かに足元に座り、病気の時はそばを離れません。存在そのもので慰めを与える方法です。この静かだけど深い献身は、時間が経つほどその価値に気づきます。{{pet_name}}は騒がしい愛ではなく、魂を撫でる愛をくれる友達です。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "battery_charging_full",
                    "title": {
                        "ko": "재충전이 필요한 영혼",
                        "en": "A Soul That Needs Recharging",
                        "jp": "充電が必要な魂",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 사회적 상호작용 후에 반드시 혼자만의 시간이 필요해요. 손님이 다녀가거나 활동적인 산책 후에는 조용한 구석에서 에너지를 충전하죠. 이건 당신을 싫어하는 게 아니라, 내면의 균형을 맞추는 과정이에요. 강제로 계속 상호작용을 요구하면 스트레스를 받아요. {{pet_name}}의 "혼자 있는 시간"을 존중해주면, 다시 돌아왔을 때 더 깊은 교감으로 보답해줄 거예요.',
                        "en": "{{pet_name}} absolutely needs alone time after social interactions. After guests leave or following an active walk, they recharge their energy in a quiet corner. This isn't because they dislike you—it's a process of restoring inner balance. Forcing continuous interaction causes stress. Respect {{pet_name}}'s \"alone time,\" and when they return, they'll reward you with an even deeper connection.",
                        "jp": "{{pet_name}}は社会的な交流の後、必ず一人の時間が必要です。お客さんが帰った後や活発な散歩の後は、静かな隅でエネルギーを充電します。これはあなたが嫌いなのではなく、内面のバランスを整える過程です。無理に交流を続けようとするとストレスを感じます。{{pet_name}}の「一人の時間」を尊重すれば、戻ってきた時にもっと深い絆でお返ししてくれます。",
                    },
                },
                {
                    "icon": "psychology",
                    "title": {
                        "ko": "감정의 스펀지",
                        "en": "Emotional Sponge",
                        "jp": "感情のスポンジ",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 주변의 감정을 스펀지처럼 흡수해요. 집안 분위기가 평화로우면 {{pet_name}}도 평온하고, 긴장감이 흐르면 {{pet_name}}도 불안해하죠. 가족 간의 다툼이나 주인의 스트레스를 고스란히 느끼기 때문에, 이 친구의 정서적 건강을 위해서는 안정된 가정 환경이 중요해요. 반대로 {{pet_name}}의 상태를 보면 집안 분위기를 알 수 있어요—살아있는 가정의 바로미터인 셈이죠.",
                        "en": "{{pet_name}} absorbs surrounding emotions like a sponge. When the household atmosphere is peaceful, {{pet_name}} is calm; when tension runs high, {{pet_name}} becomes anxious. Because they fully feel family conflicts or their owner's stress, a stable home environment is important for this friend's emotional health. Conversely, you can tell the household atmosphere by {{pet_name}}'s state—they're a living barometer of the home.",
                        "jp": "{{pet_name}}は周りの感情をスポンジのように吸収します。家の雰囲気が平和なら{{pet_name}}も穏やかで、緊張感が漂えば{{pet_name}}も不安になります。家族間の争いや飼い主のストレスをそのまま感じるため、この子の精神的な健康のためには安定した家庭環境が大切です。逆に{{pet_name}}の状態を見れば家の雰囲気がわかります—生きた家庭のバロメーターというわけです。",
                    },
                },
            ],
        },
        # ============================================================
        # INTP - 조용한 사색가
        # ============================================================
        {
            "id": "INTP",
            "alias": {
                "ko": "조용한 사색가",
                "en": "The Quiet Thinker",
                "jp": "静かな思索家",
            },
            "summary": {
                "ko": "자기만의 방식으로 세상을 관찰하고 분석하는 독립적인 지성파",
                "en": "An independent intellectual who observes and analyzes the world in their own way",
                "jp": "自分なりの方法で世界を観察し分析する独立した知性派",
            },
            "image_id": "dog_intp_main",
            "keywords": {
                "ko": ["독립적", "관찰력", "신중함"],
                "en": ["Independent", "Observant", "Cautious"],
                "jp": ["独立的", "観察力", "慎重"],
            },
            "statsLabels": {
                "sociability": {"ko": "내향적", "en": "Introverted", "jp": "内向的"},
                "obedience": {"ko": "독립적", "en": "Independent", "jp": "独立的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "이성적", "en": "Rational", "jp": "理性的"},
                "sagacity": {"ko": "직관적", "en": "Intuitive", "jp": "直感的"},
            },
            "coreTraits": [
                {
                    "icon": "search",
                    "title": {
                        "ko": "끝없는 관찰자",
                        "en": "Endless Observer",
                        "jp": "終わりなき観察者",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 뛰어들기 전에 반드시 관찰부터 해요. 새로운 장난감이 생기면 다른 개들처럼 바로 물어뜯는 대신, 먼저 빙글빙글 돌며 살펴보고, 코로 킁킁거리고, 발로 톡톡 건드려본 후에야 비로소 "이건 안전하군" 하고 받아들이죠. 새로운 사람이나 환경도 마찬가지예요. 이 신중함 덕분에 위험한 상황에 잘 빠지지 않지만, 가끔은 너무 오래 망설이다 타이밍을 놓치기도 해요.',
                        "en": '{{pet_name}} always observes before diving in. When a new toy arrives, instead of immediately biting it like other dogs, they first circle around it, sniff with their nose, tap it with a paw, and only then accept it with a "This seems safe." The same goes for new people or environments. Thanks to this caution, they rarely get into dangerous situations, but sometimes they hesitate too long and miss the timing.',
                        "jp": "{{pet_name}}は飛び込む前に必ず観察します。新しいおもちゃが来ると、他の犬のようにすぐ噛みつく代わりに、まずぐるぐる回りながら眺め、鼻でクンクン嗅ぎ、足でちょんちょん触ってから、ようやく「これは安全だな」と受け入れます。新しい人や環境も同様です。この慎重さのおかげで危険な状況にはまることは少ないですが、時々長く迷いすぎてタイミングを逃すことも。",
                    },
                },
                {
                    "icon": "lightbulb",
                    "title": {
                        "ko": "조용한 문제 해결사",
                        "en": "Silent Problem Solver",
                        "jp": "静かな問題解決者",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 시끄럽게 짖거나 난리치지 않고 조용히 문제를 해결해요. 공이 소파 밑에 들어갔다고요? 한참 동안 가만히 들여다보다가, 갑자기 딱 맞는 각도를 찾아 한 번에 꺼내죠. 이 친구의 머릿속에서는 항상 무언가가 분석되고 계산되고 있어요. 지능형 퍼즐 장난감을 주면 놀라울 정도로 체계적인 방식으로 해결하는 모습을 볼 수 있어요. 조용하지만 결코 멍청하지 않은 진짜 사색가예요.",
                        "en": "{{pet_name}} solves problems quietly without barking loudly or making a fuss. Ball went under the sofa? They'll stare at it for a while, then suddenly find the perfect angle to retrieve it in one try. Something is always being analyzed and calculated inside this friend's head. Give them an intelligent puzzle toy and you'll see them solve it in a surprisingly systematic way. Quiet but never dull—a true thinker.",
                        "jp": "{{pet_name}}は騒がしく吠えたり大騒ぎせず、静かに問題を解決します。ボールがソファの下に入った？しばらくじっと見つめてから、突然ぴったりの角度を見つけて一発で取り出します。この子の頭の中ではいつも何かが分析され計算されています。知育パズルおもちゃを与えると、驚くほど体系的な方法で解く姿が見られます。静かだけど決して鈍くない、本物の思索家です。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "home",
                    "title": {
                        "ko": "나만의 영역이 필요해",
                        "en": "I Need My Own Territory",
                        "jp": "自分だけの領域が必要",
                    },
                    "description": {
                        "ko": '{{pet_name}}에게는 누구도 방해하지 않는 자신만의 공간이 필수예요. 그곳은 조용한 구석의 침대일 수도, 소파 밑일 수도, 창가 자리일 수도 있어요. 이 "기지"에 있을 때 {{pet_name}}는 가장 편안해하고, 강제로 끌어내려 하면 스트레스를 받아요. 독립적인 성격 탓에 계속 안아주거나 과도한 스킨십을 요구하면 오히려 부담스러워해요. 사랑을 표현하되, 이 친구의 개인 공간은 존중해주세요.',
                        "en": '{{pet_name}} absolutely needs their own space where no one disturbs them. It might be a bed in a quiet corner, under the sofa, or a spot by the window. When in this "base," {{pet_name}} feels most comfortable, and trying to drag them out causes stress. Due to their independent nature, constant hugging or excessive physical affection can feel burdensome. Express your love, but respect this friend\'s personal space.',
                        "jp": "{{pet_name}}には誰にも邪魔されない自分だけの空間が必須です。それは静かな隅のベッドかもしれないし、ソファの下かもしれないし、窓辺の場所かもしれません。この「基地」にいる時、{{pet_name}}は最も快適で、無理に引き出そうとするとストレスを感じます。独立した性格のため、ずっと抱っこしたり過度なスキンシップを求めると逆に負担に感じます。愛情は表現しつつ、この子のパーソナルスペースは尊重してください。",
                    },
                },
                {
                    "icon": "pace",
                    "title": {
                        "ko": "나만의 속도가 있어",
                        "en": "I Have My Own Pace",
                        "jp": "自分のペースがある",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 재촉당하는 걸 싫어해요. 산책할 때 갑자기 멈춰서 무언가를 오래 관찰하기도 하고, 훈련 중에 "생각하는 시간"이 필요하기도 하죠. 이걸 무시하고 서두르면 오히려 역효과가 나요. 이 친구의 페이스를 존중하면 신뢰가 쌓이고, 결국에는 {{pet_name}} 스스로 주인에게 더 맞추려고 노력하게 돼요. 느리지만 확실하게—이게 {{pet_name}}와의 관계를 깊게 만드는 비결이에요.',
                        "en": "{{pet_name}} hates being rushed. During walks they might suddenly stop to observe something for a long time, and during training they may need \"thinking time.\" Ignoring this and hurrying them backfires. When you respect this friend's pace, trust builds, and eventually {{pet_name}} will try to adjust to their owner more on their own. Slow but sure—that's the secret to deepening your relationship with {{pet_name}}.",
                        "jp": "{{pet_name}}は急かされるのが嫌いです。散歩中に突然立ち止まって何かを長く観察することもあるし、トレーニング中に「考える時間」が必要なこともあります。これを無視して急がせると逆効果です。この子のペースを尊重すると信頼が積み重なり、最終的には{{pet_name}}自ら飼い主にもっと合わせようと努力するようになります。ゆっくりでも確実に—これが{{pet_name}}との関係を深める秘訣です。",
                    },
                },
            ],
        },
        # ============================================================
        # INTJ - 전략적 사상가
        # ============================================================
        {
            "id": "INTJ",
            "alias": {
                "ko": "독립적인 기획자",
                "en": "The Independent Mastermind",
                "jp": "独立した策士",
            },
            "summary": {
                "ko": "냉철한 두뇌와 자기만의 철학을 가진 전략가, 쉽게 마음을 열지 않는 고고한 존재",
                "en": "A strategist with a cool mind and their own philosophy, a noble being who doesn't open up easily",
                "jp": "冷静な頭脳と自分だけの哲学を持つ戦略家、簡単に心を開かない気高い存在",
            },
            "image_id": "dog_intj_main",
            "keywords": {
                "ko": ["영리함", "계획적", "독립적"],
                "en": ["Clever", "Calculated", "Independent"],
                "jp": ["賢い", "計画的", "独立的"],
            },
            "statsLabels": {
                "sociability": {"ko": "내향적", "en": "Introverted", "jp": "内向的"},
                "obedience": {"ko": "독립적", "en": "Independent", "jp": "独立的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "이성적", "en": "Rational", "jp": "理性的"},
                "sagacity": {"ko": "직관적", "en": "Intuitive", "jp": "直感的"},
            },
            "coreTraits": [
                {
                    "icon": "chess",
                    "title": {
                        "ko": "세 수 앞을 내다보는",
                        "en": "Three Moves Ahead",
                        "jp": "三手先を読む",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 단순히 반응하는 게 아니라 예측하고 계획해요. 간식 서랍이 어디 있는지, 주인이 어떤 행동을 하면 산책을 가는지, 언제 자신에게 관심이 쏠리는지—모든 패턴을 파악하고 있죠. 그래서 가끔은 주인보다 한 발 앞서 움직이는 것처럼 보여요. 이 전략적 사고력은 훈련에서 양날의 검이에요. 목적을 이해하면 빠르게 배우지만, "이게 왜 필요하지?"라고 납득이 안 되면 완전히 무시해버려요.',
                        "en": "{{pet_name}} doesn't simply react—they predict and plan. Where the treat drawer is, what owner behavior leads to walks, when attention will be on them—they've figured out all the patterns. So sometimes they seem to move one step ahead of their owner. This strategic thinking is a double-edged sword in training. If they understand the purpose, they learn quickly, but if they don't see why it's necessary, they completely ignore it.",
                        "jp": "{{pet_name}}は単に反応するのではなく、予測して計画します。おやつの引き出しがどこにあるか、飼い主のどんな行動が散歩につながるか、いつ自分に注目が集まるか—すべてのパターンを把握しています。だから時々飼い主より一歩先に動いているように見えます。この戦略的思考力はトレーニングでは両刃の剣です。目的を理解すれば早く覚えますが、「これなぜ必要？」と納得できないと完全に無視します。",
                    },
                },
                {
                    "icon": "diamond",
                    "title": {
                        "ko": "쉽게 허락되지 않는 신뢰",
                        "en": "Trust Not Easily Granted",
                        "jp": "簡単には許されない信頼",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 마음을 얻는 건 쉽지 않아요. 처음 보는 사람에게 꼬리 흔들며 달려가는 일은 절대 없고, 오랜 시간 관찰하고 판단한 후에야 조금씩 경계를 풀죠. 하지만 한번 신뢰하기로 결정한 사람에게는 놀라운 충성심을 보여줘요. 이 까다로운 선택 과정을 통과한 주인에게 {{pet_name}}가 보여주는 애정은 그래서 더 특별해요. 쉽게 주어지지 않았기에 더 값진 보석 같은 신뢰예요.",
                        "en": "Winning {{pet_name}}'s heart isn't easy. They never run wagging their tail to strangers; only after long observation and judgment do they gradually lower their guard. But once they decide to trust someone, they show remarkable loyalty. The affection {{pet_name}} shows to an owner who passed this rigorous selection process is therefore more special. Trust that's precious like a gem because it wasn't given easily.",
                        "jp": "{{pet_name}}の心を掴むのは簡単ではありません。初対面の人にしっぽを振って駆け寄ることは絶対になく、長い時間観察し判断してからようやく少しずつ警戒を解きます。でも一度信頼すると決めた人には驚くべき忠誠心を見せます。この厳しい選考過程を通過した飼い主に{{pet_name}}が見せる愛情は、だからこそより特別です。簡単に与えられなかったからこそ、より価値のある宝石のような信頼です。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "auto_mode",
                    "title": {
                        "ko": "효율의 미학",
                        "en": "The Aesthetics of Efficiency",
                        "jp": "効率の美学",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 불필요한 에너지 낭비를 싫어해요. 산책도 목적 없이 어슬렁거리는 것보다 목표 지점을 향해 효율적으로 움직이는 걸 선호하고, 놀이도 의미 없이 반복되면 금방 흥미를 잃죠. 모든 행동에 "이유"가 있어야 해요. 이 합리적인 성격 덕분에 무의미한 짖음이나 과잉 행동이 거의 없지만, 반대로 주인이 원하는 행동도 납득이 돼야 따라요. 설득력 있는 보상 체계가 핵심이에요.',
                        "en": '{{pet_name}} hates unnecessary energy waste. During walks, they prefer moving efficiently toward a destination rather than wandering aimlessly, and they quickly lose interest in play that repeats without meaning. Every action needs a "reason." Thanks to this rational personality, meaningless barking or hyperactive behavior is rare, but conversely, they only follow what their owner wants if it makes sense. A convincing reward system is key.',
                        "jp": "{{pet_name}}は無駄なエネルギー消費を嫌います。散歩も目的なくぶらぶらするより目標地点に向かって効率的に動くことを好み、遊びも意味なく繰り返されるとすぐ興味を失います。すべての行動に「理由」が必要です。この合理的な性格のおかげで無意味な吠えや過剰行動はほとんどありませんが、逆に飼い主が望む行動も納得できないと従いません。説得力のある報酬体系がカギです。",
                    },
                },
                {
                    "icon": "lock",
                    "title": {
                        "ko": "나만의 세계를 지키는",
                        "en": "Guarding My Own World",
                        "jp": "自分だけの世界を守る",
                    },
                    "description": {
                        "ko": "{{pet_name}}에게는 침범당하고 싶지 않은 영역이 있어요. 자신만의 잠자리, 좋아하는 장난감, 혼자 있는 시간—이런 것들이 보장되어야 정서적으로 안정돼요. 여러 마리 반려동물이 있는 집에서 {{pet_name}}는 적당한 거리를 유지하며 자기 영역을 지키려 해요. 이건 차가움이 아니라 건강한 경계예요. 이 독립적인 성격을 이해하고 존중해주면, {{pet_name}}는 자신만의 방식으로 깊은 유대를 보여줄 거예요.",
                        "en": "{{pet_name}} has territories they don't want invaded. Their own bed, favorite toys, alone time—these must be guaranteed for emotional stability. In homes with multiple pets, {{pet_name}} maintains appropriate distance to protect their territory. This isn't coldness but healthy boundaries. If you understand and respect this independent nature, {{pet_name}} will show deep bonds in their own way.",
                        "jp": "{{pet_name}}には侵されたくない領域があります。自分だけの寝床、お気に入りのおもちゃ、一人の時間—これらが保障されてこそ精神的に安定します。複数のペットがいる家で{{pet_name}}は適度な距離を保ち自分の領域を守ろうとします。これは冷たさではなく健全な境界線です。この独立した性格を理解し尊重すれば、{{pet_name}}は自分なりの方法で深い絆を見せてくれるでしょう。",
                    },
                },
            ],
        },
        # ============================================================
        # ISFP - 온화한 예술가
        # ============================================================
        {
            "id": "ISFP",
            "alias": {
                "ko": "예술적인 영혼",
                "en": "The Artistic Soul",
                "jp": "芸術的な魂",
            },
            "summary": {
                "ko": "섬세한 감성으로 세상을 느끼는 온화한 자유로운 영혼",
                "en": "A gentle free spirit who feels the world through delicate senses",
                "jp": "繊細な感性で世界を感じる穏やかで自由な魂",
            },
            "image_id": "dog_isfp_main",
            "keywords": {
                "ko": ["온화함", "자유로움", "섬세함"],
                "en": ["Gentle", "Free-spirited", "Delicate"],
                "jp": ["穏やか", "自由", "繊細"],
            },
            "statsLabels": {
                "sociability": {"ko": "내향적", "en": "Introverted", "jp": "内向的"},
                "obedience": {"ko": "독립적", "en": "Independent", "jp": "独立的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "감성적", "en": "Sensitive", "jp": "感受性豊か"},
                "sagacity": {"ko": "본능적", "en": "Instinctive", "jp": "本能的"},
            },
            "coreTraits": [
                {
                    "icon": "palette",
                    "title": {
                        "ko": "오감으로 느끼는 세상",
                        "en": "A World Felt Through Five Senses",
                        "jp": "五感で感じる世界",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 세상을 온몸으로 느껴요. 산책길의 흙냄새, 바람에 실려오는 소리, 햇살의 온기—다른 개들이 무심히 지나치는 것들을 {{pet_name}}는 깊이 음미하죠. 꽃 앞에서 한참을 서 있거나, 새소리에 귀를 기울이며 고개를 갸웃거리는 모습을 자주 볼 수 있어요. 이 섬세한 감각은 예술가의 영혼과도 같아서, {{pet_name}}와 함께하면 일상 속 작은 아름다움을 다시 발견하게 돼요.",
                        "en": "{{pet_name}} feels the world with their whole being. The smell of earth on walking paths, sounds carried by the wind, the warmth of sunlight—{{pet_name}} deeply savors things other dogs pass by carelessly. You'll often see them standing for a long time in front of flowers or tilting their head to listen to birdsong. This delicate sensibility is like an artist's soul, and being with {{pet_name}} helps you rediscover small beauties in everyday life.",
                        "jp": "{{pet_name}}は世界を全身で感じます。散歩道の土の匂い、風に乗ってくる音、日差しの温かさ—他の犬が何気なく通り過ぎるものを{{pet_name}}は深く味わいます。花の前で長く立っていたり、鳥の声に耳を傾けて首をかしげる姿をよく見かけます。この繊細な感覚は芸術家の魂のようで、{{pet_name}}と一緒にいると日常の小さな美しさを再発見できます。",
                    },
                },
                {
                    "icon": "air",
                    "title": {
                        "ko": "바람처럼 자유롭게",
                        "en": "Free Like the Wind",
                        "jp": "風のように自由に",
                    },
                    "description": {
                        "ko": '{{pet_name}}에게 강요는 금물이에요. 이 친구는 자신만의 리듬으로 살아가며, 억지로 무언가를 시키면 조용히 저항하거나 스트레스를 받아요. 하지만 자유롭게 선택하도록 두면 놀라운 협조성을 보여주죠. 산책 코스를 {{pet_name}}가 고르게 하거나, 놀이 방식을 스스로 결정하게 해보세요. "해야 해"가 아닌 "하고 싶어"로 움직일 때 {{pet_name}}는 가장 행복해요.',
                        "en": 'Forcing things is forbidden with {{pet_name}}. This friend lives by their own rhythm, and making them do something against their will causes quiet resistance or stress. But when given freedom to choose, they show surprising cooperation. Let {{pet_name}} pick the walking route or decide the play style themselves. {{pet_name}} is happiest when they move from "I want to" rather than "I have to."',
                        "jp": "{{pet_name}}に強制は禁物です。この子は自分だけのリズムで生きていて、無理に何かをさせると静かに抵抗したりストレスを感じます。でも自由に選ばせると驚くほどの協調性を見せます。散歩コースを{{pet_name}}に選ばせたり、遊び方を自分で決めさせてみてください。「しなきゃ」ではなく「したい」で動く時、{{pet_name}}は一番幸せです。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "self_improvement",
                    "title": {
                        "ko": "조용한 애정 표현",
                        "en": "Quiet Expressions of Affection",
                        "jp": "静かな愛情表現",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 요란하게 사랑을 표현하지 않아요. 광적으로 꼬리를 흔들거나 폴짝폴짝 뛰는 대신, 조용히 옆에 와서 앉거나 부드럽게 몸을 기대죠. 주인이 힘들어 보이면 말없이 발치에 웅크리고, 기분이 좋을 때는 살짝 코를 비벼요. 이 조용하고 섬세한 애정 표현을 알아차리지 못하면 "얘는 날 좋아하는 걸까?"라고 오해할 수 있지만, 사실 {{pet_name}}는 자신만의 언어로 깊은 사랑을 속삭이고 있는 거예요.',
                        "en": "{{pet_name}} doesn't express love loudly. Instead of wildly wagging their tail or jumping around, they quietly come sit beside you or gently lean against you. When their owner looks tired, they silently curl up at their feet; when feeling good, they softly nuzzle their nose. If you don't notice these quiet, delicate expressions of affection, you might misunderstand and wonder \"Do they even like me?\" But actually, {{pet_name}} is whispering deep love in their own language.",
                        "jp": "{{pet_name}}は派手に愛情を表現しません。激しくしっぽを振ったりぴょんぴょん跳ねる代わりに、静かにそばに来て座ったり、優しく体を寄せます。飼い主が疲れているように見えると黙って足元に丸くなり、機嫌がいい時はそっと鼻を擦り付けます。この静かで繊細な愛情表現に気づかないと「この子は私のこと好きなのかな？」と誤解するかもしれませんが、実は{{pet_name}}は自分だけの言葉で深い愛を囁いているのです。",
                    },
                },
                {
                    "icon": "nature",
                    "title": {
                        "ko": "자연 속의 힐러",
                        "en": "Healer in Nature",
                        "jp": "自然の中のヒーラー",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 자연 속에서 가장 빛나요. 복잡한 도심보다 조용한 공원이나 숲길에서 눈이 반짝이고 발걸음이 가벼워져요. 풀밭에 누워 바람을 맞거나, 시냇물 소리를 들으며 평화로워하는 모습은 마치 명상하는 것 같아요. {{pet_name}}와 함께 자연 속을 걸으면 주인도 덩달아 마음이 치유되는 걸 느낄 수 있어요. 이 친구는 살아있는 힐링 파트너예요.",
                        "en": "{{pet_name}} shines brightest in nature. Their eyes sparkle and steps lighten in quiet parks or forest paths rather than the busy city. Lying in the grass feeling the breeze or listening to stream sounds in peace—it's like watching them meditate. Walking in nature with {{pet_name}}, owners can feel their hearts being healed too. This friend is a living healing partner.",
                        "jp": "{{pet_name}}は自然の中で最も輝きます。複雑な都心より静かな公園や森の道で目がキラキラし、足取りが軽くなります。草原に寝転んで風を浴びたり、小川の音を聞きながら穏やかにしている姿はまるで瞑想しているようです。{{pet_name}}と一緒に自然の中を歩くと、飼い主も心が癒されるのを感じられます。この子は生きたヒーリングパートナーです。",
                    },
                },
            ],
        },
        # ============================================================
        # ISFJ - 헌신적인 수호자
        # ============================================================
        {
            "id": "ISFJ",
            "alias": {
                "ko": "헌신적인 그림자",
                "en": "The Devoted Shadow",
                "jp": "献身的な影",
            },
            "summary": {
                "ko": "말없이 곁을 지키는 가장 충실한 동반자, 그림자처럼 따르는 헌신의 아이콘",
                "en": "The most faithful companion who silently stays by your side, an icon of devotion who follows like a shadow",
                "jp": "黙ってそばを守る最も忠実な伴侶、影のように付き従う献身のアイコン",
            },
            "image_id": "dog_isfj_main",
            "keywords": {
                "ko": ["헌신적", "인내심", "배려심"],
                "en": ["Devoted", "Patient", "Considerate"],
                "jp": ["献身的", "忍耐強い", "思いやり"],
            },
            "statsLabels": {
                "sociability": {"ko": "내향적", "en": "Introverted", "jp": "内向的"},
                "obedience": {"ko": "협조적", "en": "Cooperative", "jp": "協調的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "감성적", "en": "Sensitive", "jp": "感受性豊か"},
                "sagacity": {"ko": "본능적", "en": "Instinctive", "jp": "本能的"},
            },
            "coreTraits": [
                {
                    "icon": "footprint",
                    "title": {
                        "ko": "당신의 그림자",
                        "en": "Your Shadow",
                        "jp": "あなたの影",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 주인이 가는 곳이면 어디든 따라가요. 화장실에 갈 때도 문 앞에서 기다리고, 부엌으로 가면 슬쩍 따라오고, 소파에 앉으면 발치에 자리 잡죠. 이건 집착이 아니라 헌신이에요. {{pet_name}}에게 주인 곁에 있는 것 자체가 가장 큰 행복이거든요. 존재감을 드러내지 않으면서도 항상 곁에 있는 이 조용한 동행은, 시간이 지날수록 그 따뜻함을 깊이 느끼게 해줘요.",
                        "en": "{{pet_name}} follows wherever their owner goes. They wait at the bathroom door, quietly follow to the kitchen, and settle at your feet when you sit on the sofa. This isn't clinginess—it's devotion. For {{pet_name}}, being by their owner's side is the greatest happiness. This quiet companionship that's always there without making its presence obvious lets you feel its warmth more deeply over time.",
                        "jp": "{{pet_name}}は飼い主が行くところならどこでも付いていきます。トイレに行く時もドアの前で待ち、キッチンに行けばそっと付いてきて、ソファに座れば足元に陣取ります。これは執着ではなく献身です。{{pet_name}}にとって飼い主のそばにいること自体が最大の幸せだから。存在感を出さずにいつもそばにいるこの静かな同行は、時が経つほどその温かさを深く感じさせてくれます。",
                    },
                },
                {
                    "icon": "hourglass_empty",
                    "title": {
                        "ko": "끝없는 인내의 소유자",
                        "en": "Possessor of Endless Patience",
                        "jp": "無限の忍耐の持ち主",
                    },
                    "description": {
                        "ko": '{{pet_name}}의 인내심은 놀라워요. 주인이 바쁠 때 짖거나 보채지 않고 조용히 기다리고, 아이들이 거칠게 대해도 묵묵히 받아줘요. "기다려"라고 하면 정말 오랫동안—거의 걱정될 만큼—움직이지 않고 기다리죠. 이 성인군자 같은 인내심은 어떤 가정환경에서도 잘 적응하게 해줘요. 하지만 이렇게 참을성이 좋다고 해서 {{pet_name}}의 필요를 무시하면 안 돼요. 말없이 참는 이 친구의 마음을 먼저 살펴주세요.',
                        "en": "{{pet_name}}'s patience is remarkable. When their owner is busy, they wait quietly without barking or pestering; when children are rough, they silently accept it. When told \"wait,\" they stay still for so long—almost worryingly so. This saint-like patience helps them adapt well to any home environment. But just because they're so patient doesn't mean you should ignore {{pet_name}}'s needs. Please look after this friend who silently endures.",
                        "jp": "{{pet_name}}の忍耐力は驚くべきものです。飼い主が忙しい時は吠えたりせがんだりせず静かに待ち、子供たちが乱暴にしても黙って受け入れます。「待って」と言えば本当に長い間—心配になるほど—動かずに待ちます。この聖人のような忍耐力はどんな家庭環境にもうまく適応させてくれます。でもこんなに我慢強いからといって{{pet_name}}のニーズを無視してはいけません。黙って耐えるこの子の気持ちを先に察してあげてください。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "repeat",
                    "title": {
                        "ko": "변하지 않는 일상의 수호자",
                        "en": "Guardian of Unchanging Routines",
                        "jp": "変わらない日常の守護者",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 예측 가능한 일상에서 안정감을 느껴요. 매일 같은 시간에 일어나고, 같은 코스로 산책하고, 같은 자리에서 밥을 먹는 것—이런 익숙한 패턴이 {{pet_name}}를 행복하게 해요. 갑작스러운 변화는 이 친구를 불안하게 만들 수 있어요. 이사나 가족 구성원의 변화 같은 큰 변화가 있을 때는 {{pet_name}}가 적응할 시간을 충분히 주고, 익숙한 물건이나 냄새로 안심시켜주세요.",
                        "en": "{{pet_name}} feels secure in predictable routines. Waking up at the same time every day, walking the same route, eating in the same spot—these familiar patterns make {{pet_name}} happy. Sudden changes can make this friend anxious. When there are big changes like moving or changes in family members, give {{pet_name}} plenty of time to adjust and reassure them with familiar objects or scents.",
                        "jp": "{{pet_name}}は予測可能な日常に安心感を覚えます。毎日同じ時間に起き、同じコースを散歩し、同じ場所でご飯を食べる—こんな慣れ親しんだパターンが{{pet_name}}を幸せにします。急な変化はこの子を不安にさせることがあります。引っ越しや家族構成の変化など大きな変化がある時は、{{pet_name}}が適応する時間を十分に与え、馴染みのある物や匂いで安心させてあげてください。",
                    },
                },
                {
                    "icon": "health_and_safety",
                    "title": {
                        "ko": "조용한 보살핌",
                        "en": "Quiet Care",
                        "jp": "静かな思いやり",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 가족의 안녕을 묵묵히 살펴요. 누군가 아프면 곁을 떠나지 않고, 슬픈 기색이 보이면 조용히 다가가 위로해요. 가족 중 가장 약한 구성원—아이나 노인—에게 특히 부드럽게 대하고, 본능적으로 그들을 보호하려 하죠. 이 조용한 배려심은 화려하지 않아서 쉽게 간과되지만, 가장 힘들 때 {{pet_name}}가 곁에 있었다는 걸 문득 깨닫게 될 거예요. 가장 필요한 순간에 가장 든든한 친구예요.",
                        "en": "{{pet_name}} quietly watches over the family's wellbeing. When someone is sick, they don't leave their side; when sadness shows, they quietly approach to comfort. They're especially gentle with the weakest family members—children or elderly—and instinctively try to protect them. This quiet consideration is easily overlooked because it's not flashy, but you'll suddenly realize that {{pet_name}} was there during your hardest times. The most reliable friend when you need them most.",
                        "jp": "{{pet_name}}は家族の安寧を黙々と見守ります。誰かが病気なら側を離れず、悲しそうな様子が見えたら静かに近づいて慰めます。家族の中で最も弱い存在—子供やお年寄り—には特に優しく接し、本能的に彼らを守ろうとします。この静かな思いやりは派手ではないので見過ごされがちですが、最も辛い時に{{pet_name}}がそばにいてくれたことにふと気づくでしょう。最も必要な時に最も頼もしい友達です。",
                    },
                },
            ],
        },
        # ============================================================
        # ISTP - 독립적인 장인
        # ============================================================
        {
            "id": "ISTP",
            "alias": {
                "ko": "쿨한 기술자",
                "en": "The Cool Mechanic",
                "jp": "クールな技術者",
            },
            "summary": {
                "ko": "감정에 휘둘리지 않는 냉철함, 자기만의 방식으로 문제를 해결하는 마이웨이 장인",
                "en": "Cool-headed and never swayed by emotions, a craftsman who solves problems their own way",
                "jp": "感情に流されない冷静さ、自分なりの方法で問題を解決するマイウェイの職人",
            },
            "image_id": "dog_istp_main",
            "keywords": {
                "ko": ["차분함", "실용적", "마이웨이"],
                "en": ["Calm", "Practical", "My-way"],
                "jp": ["冷静", "実用的", "マイウェイ"],
            },
            "statsLabels": {
                "sociability": {"ko": "내향적", "en": "Introverted", "jp": "内向的"},
                "obedience": {"ko": "독립적", "en": "Independent", "jp": "独立的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "이성적", "en": "Rational", "jp": "理性的"},
                "sagacity": {"ko": "본능적", "en": "Instinctive", "jp": "本能的"},
            },
            "coreTraits": [
                {
                    "icon": "build",
                    "title": {
                        "ko": "타고난 해결사",
                        "en": "Born Fixer",
                        "jp": "生まれながらの解決者",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 문제 상황에서 당황하거나 짖어대는 대신 침착하게 해결책을 찾아요. 장난감이 가구 틈에 끼었다고요? 흥분하지 않고 이리저리 각도를 바꿔가며 꺼내는 방법을 연구하죠. 이 실용적인 접근 방식은 마치 숙련된 기술자가 고장 난 기계를 고치는 것 같아요. 복잡한 퍼즐 장난감도 차분하게 분석하며 하나씩 해결해나가는 모습은 정말 인상적이에요. 감정이 아닌 논리로 움직이는 쿨한 문제 해결사예요.",
                        "en": "{{pet_name}} calmly finds solutions instead of panicking or barking in problem situations. Toy stuck in furniture? Without getting excited, they study how to get it out by trying different angles. This practical approach is like a skilled mechanic fixing a broken machine. The way they calmly analyze complex puzzle toys and solve them one by one is truly impressive. A cool problem solver who moves with logic, not emotion.",
                        "jp": "{{pet_name}}は問題状況でパニックになったり吠えたりせず、冷静に解決策を見つけます。おもちゃが家具の隙間に挟まった？興奮せずにあれこれ角度を変えながら取り出す方法を研究します。この実用的なアプローチはまるで熟練した技術者が故障した機械を直すようです。複雑なパズルおもちゃも冷静に分析しながら一つずつ解決していく姿は本当に印象的です。感情ではなく論理で動くクールな問題解決者です。",
                    },
                },
                {
                    "icon": "trending_flat",
                    "title": {
                        "ko": "흔들리지 않는 평정심",
                        "en": "Unshakeable Composure",
                        "jp": "揺るがない平常心",
                    },
                    "description": {
                        "ko": '{{pet_name}}는 웬만한 일에 동요하지 않아요. 천둥번개가 쳐도 귀만 살짝 움직이고, 낯선 개가 짖어대도 무심하게 쳐다볼 뿐이죠. 다른 개들이 흥분하는 상황에서도 {{pet_name}}만 유일하게 냉정을 유지하는 경우가 많아요. 이 타고난 평정심은 어떤 환경에서도 스트레스를 덜 받게 해주지만, 가끔은 주인이 "얘 괜찮은 거 맞아?"라고 걱정하게 만들기도 해요. 걱정 마세요, {{pet_name}}는 그냥 쿨한 거예요.',
                        "en": "{{pet_name}} doesn't get fazed by most things. Even when thunder roars, they just twitch their ears slightly; when strange dogs bark at them, they just look back indifferently. In situations where other dogs get excited, {{pet_name}} is often the only one staying cool. This natural composure means less stress in any environment, though sometimes it makes owners worry \"Is this one okay?\" Don't worry—{{pet_name}} is just being cool.",
                        "jp": "{{pet_name}}は大抵のことには動じません。雷が鳴っても耳をピクッと動かすだけで、見知らぬ犬が吠えても無関心に見つめるだけです。他の犬が興奮する状況でも{{pet_name}}だけが冷静を保っていることが多いです。この生まれ持った平常心はどんな環境でもストレスを少なくしてくれますが、時に飼い主に「この子大丈夫かな？」と心配させることも。心配しないで、{{pet_name}}はただクールなだけです。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "do_not_disturb",
                    "title": {
                        "ko": "나만의 시간이 필요해",
                        "en": "I Need My Own Time",
                        "jp": "自分だけの時間が必要",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 혼자 있는 시간을 즐기는 독립적인 성격이에요. 주인이 계속 안아주려 하거나 놀아주려 하면 살짝 피하거나 다른 방으로 가버리기도 해요. 이건 싫어서가 아니라 그냥 개인 시간이 필요한 거예요. 이 친구에게는 스킨십을 강요하지 않는 게 중요해요. {{pet_name}}가 먼저 다가올 때까지 기다려주면, 그때의 교감은 훨씬 더 특별하게 느껴질 거예요.",
                        "en": "{{pet_name}} has an independent personality that enjoys alone time. If their owner keeps trying to hug or play with them, they might dodge slightly or go to another room. This isn't because they dislike it—they just need personal time. It's important not to force physical affection with this friend. If you wait until {{pet_name}} approaches first, that connection will feel much more special.",
                        "jp": "{{pet_name}}は一人の時間を楽しむ独立した性格です。飼い主がずっと抱っこしようとしたり遊ぼうとすると、そっと避けたり別の部屋に行ってしまうことも。これは嫌いだからではなく、ただ個人の時間が必要なだけです。この子にはスキンシップを強要しないことが大切です。{{pet_name}}が先に近づいてくるまで待ってあげれば、その時の交流はずっと特別に感じられるでしょう。",
                    },
                },
                {
                    "icon": "handyman",
                    "title": {
                        "ko": "몸으로 배우는 타입",
                        "en": "Learns by Doing",
                        "jp": "体で覚えるタイプ",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 말로 하는 훈련보다 직접 해보면서 배우는 걸 좋아해요. 같은 명령을 열 번 반복하는 것보다 한 번 직접 경험하게 해주는 게 훨씬 효과적이죠. 어질리티나 프리스비처럼 몸을 쓰는 활동에서 뛰어난 능력을 발휘해요. 머리로 이해하기보다 몸으로 익히는 스타일이라, 실전 위주의 훈련이 이 친구에게 딱 맞아요. 행동으로 보여주면 {{pet_name}}도 행동으로 따라와요.",
                        "en": "{{pet_name}} prefers learning by doing rather than verbal training. One hands-on experience is far more effective than repeating the same command ten times. They excel at physical activities like agility or frisbee. Their style is to learn through their body rather than understanding with their head, so practical training is perfect for this friend. Show them through action, and {{pet_name}} will follow with action.",
                        "jp": "{{pet_name}}は言葉でのトレーニングより実際にやってみて学ぶのが好きです。同じ命令を十回繰り返すより、一度実際に体験させる方がずっと効果的です。アジリティやフリスビーのように体を使う活動で優れた能力を発揮します。頭で理解するより体で覚えるスタイルなので、実践中心のトレーニングがこの子にぴったりです。行動で見せれば{{pet_name}}も行動で付いてきます。",
                    },
                },
            ],
        },
        # ============================================================
        # ISTJ - 성실한 관리자
        # ============================================================
        {
            "id": "ISTJ",
            "alias": {
                "ko": "믿음직한 파수꾼",
                "en": "The Reliable Sentinel",
                "jp": "頼もしい番人",
            },
            "summary": {
                "ko": "묵묵히 자리를 지키는 가장 신뢰할 수 있는 존재, 원칙과 책임의 화신",
                "en": "The most trustworthy presence who silently holds their post, an embodiment of principles and responsibility",
                "jp": "黙々と持ち場を守る最も信頼できる存在、原則と責任の化身",
            },
            "image_id": "dog_istj_main",
            "keywords": {
                "ko": ["책임감", "원칙주의", "충직함"],
                "en": ["Responsible", "Principled", "Faithful"],
                "jp": ["責任感", "原則主義", "忠実"],
            },
            "statsLabels": {
                "sociability": {"ko": "내향적", "en": "Introverted", "jp": "内向的"},
                "obedience": {"ko": "협조적", "en": "Cooperative", "jp": "協調的"},
                "temperament": {"ko": "차분함", "en": "Calm", "jp": "穏やか"},
                "emotionality": {"ko": "이성적", "en": "Rational", "jp": "理性的"},
                "sagacity": {"ko": "본능적", "en": "Instinctive", "jp": "本能的"},
            },
            "coreTraits": [
                {
                    "icon": "security",
                    "title": {
                        "ko": "흔들림 없는 원칙주의",
                        "en": "Unwavering Principles",
                        "jp": "揺るがない原則主義",
                    },
                    "description": {
                        "ko": '{{pet_name}}에게 규칙은 절대적이에요. 한번 "안 돼"라고 배운 것은 주인이 없을 때도 절대 하지 않아요. 소파에 못 올라간다고 배웠으면 아무도 없는 집에서도 소파를 쳐다보지도 않죠. 이 철저한 원칙주의는 가장 신뢰할 수 있는 반려견으로 만들어줘요. "얘한테는 맡겨도 돼"라는 확신이 드는 건 시간문제예요. 대신 한번 정해진 규칙을 바꾸는 건 쉽지 않으니, 처음부터 신중하게 가르쳐야 해요.',
                        "en": "For {{pet_name}}, rules are absolute. Once they learn something is a \"no,\" they never do it even when their owner is away. If taught they can't get on the sofa, they won't even look at it in an empty house. This thorough adherence to principles makes them the most trustworthy companion. It's only a matter of time before you feel confident thinking \"I can trust this one with anything.\" However, changing established rules isn't easy, so teach carefully from the start.",
                        "jp": "{{pet_name}}にとってルールは絶対です。一度「ダメ」と学んだことは飼い主がいない時も絶対にしません。ソファに上がっちゃダメと教わったら、誰もいない家でもソファを見ようともしません。この徹底した原則主義は最も信頼できる伴侶にしてくれます。「この子には任せられる」という確信が生まれるのは時間の問題です。ただし一度決まったルールを変えるのは簡単ではないので、最初から慎重に教える必要があります。",
                    },
                },
                {
                    "icon": "shield",
                    "title": {
                        "ko": "조용한 수호자",
                        "en": "Silent Guardian",
                        "jp": "静かな守護者",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 화려하게 경비견 역할을 하지 않아요. 대신 조용히 집안 구석구석을 순찰하고, 이상한 기척이 있으면 가족에게 알리죠. 밤에 모두가 잠들어도 {{pet_name}}는 가끔 귀를 세우고 집을 지켜요. 이 묵묵한 수호 본능은 강요하지 않아도 자연스럽게 나타나요. 위험한 상황에서도 당황하지 않고 침착하게 대응하는 모습은 마치 노련한 경호원 같아요. 가장 믿음직한 가정의 파수꾼이에요.",
                        "en": "{{pet_name}} doesn't play guard dog in a flashy way. Instead, they quietly patrol every corner of the house and alert the family when something seems off. Even when everyone is asleep at night, {{pet_name}} sometimes keeps watch with ears perked. This silent protective instinct emerges naturally without being forced. The way they respond calmly without panic in dangerous situations is like a seasoned bodyguard. The most reliable sentinel of the home.",
                        "jp": "{{pet_name}}は派手に番犬役をこなしません。代わりに静かに家中をパトロールし、おかしな気配があれば家族に知らせます。夜みんなが眠っても{{pet_name}}は時々耳を立てて家を守っています。この黙々とした守護本能は強制しなくても自然と現れます。危険な状況でも慌てず冷静に対応する姿はまるでベテランのボディガードのようです。最も頼もしい家庭の番人です。",
                    },
                },
            ],
            "dailyLife": [
                {
                    "icon": "event_repeat",
                    "title": {
                        "ko": "시계보다 정확한 생체 리듬",
                        "en": "Biological Rhythm More Accurate Than a Clock",
                        "jp": "時計より正確な体内リズム",
                    },
                    "description": {
                        "ko": "{{pet_name}}의 체내시계는 믿을 수 없을 만큼 정확해요. 아침 6시 59분에 일어나서 주인을 바라보고, 저녁 5시 58분에 밥그릇 앞에 앉아요. 주말이라고 봐주는 법도 없죠. 이 정확성은 가족 전체의 생활 리듬을 규칙적으로 만들어주는 효과가 있어요. {{pet_name}}와 살면 늦잠 잘 일은 없을 거예요. 이 친구가 있으면 알람시계가 필요 없어요—어쩌면 알람보다 더 집요하니까요.",
                        "en": "{{pet_name}}'s internal clock is unbelievably accurate. They wake up at 6:59 AM and stare at their owner, then sit in front of their food bowl at 5:58 PM. Weekends don't get any slack either. This precision has the effect of making the whole family's lifestyle more regular. Living with {{pet_name}} means you'll never oversleep. With this friend, you don't need an alarm clock—they might be even more persistent than one.",
                        "jp": "{{pet_name}}の体内時計は信じられないほど正確です。朝6時59分に起きて飼い主を見つめ、夕方5時58分にはご飯の前に座っています。週末だからといって手加減もありません。この正確さは家族全体の生活リズムを規則的にする効果があります。{{pet_name}}と暮らせば寝坊することはないでしょう。この子がいれば目覚まし時計は要りません—むしろ目覚ましよりしつこいかもしれません。",
                    },
                },
                {
                    "icon": "diversity_1",
                    "title": {
                        "ko": "느리지만 확실한 신뢰",
                        "en": "Slow but Certain Trust",
                        "jp": "遅いけれど確かな信頼",
                    },
                    "description": {
                        "ko": "{{pet_name}}는 새로운 사람에게 쉽게 마음을 열지 않아요. 처음 보는 사람에게는 거리를 두고 관찰하며, 여러 번 만나고 나서야 조금씩 경계를 풀죠. 하지만 한번 신뢰하기로 결정하면 그 관계는 평생 변하지 않아요. 가벼운 친화력보다 깊은 충성심을 가진 타입이에요. 시간이 걸리더라도 {{pet_name}}의 신뢰를 얻으면 세상에서 가장 든든한 동반자를 얻는 거예요. 기다릴 가치가 충분해요.",
                        "en": "{{pet_name}} doesn't open up easily to new people. They keep distance and observe strangers, only gradually lowering their guard after meeting several times. But once they decide to trust someone, that relationship never changes for life. They're the type with deep loyalty rather than easy friendliness. Even if it takes time, earning {{pet_name}}'s trust means gaining the most reliable companion in the world. Definitely worth the wait.",
                        "jp": "{{pet_name}}は新しい人に簡単に心を開きません。初対面の人には距離を置いて観察し、何度も会ってからようやく少しずつ警戒を解きます。でも一度信頼すると決めたら、その関係は一生変わりません。軽い親しみやすさより深い忠誠心を持つタイプです。時間がかかっても{{pet_name}}の信頼を得れば、世界で最も頼もしい伴侶を得ることになります。待つ価値は十分にあります。",
                    },
                },
            ],
        },
    ]



# 인메모리 archetype 맵 구축
ARCHETYPES_BY_CODE = {arc["id"]: arc for arc in get_full_archetypes()}

def get_archetype_data(mbti_code: str, pet_name: str, locale: str) -> dict:
    """mbti_code에 해당하는 archetype 데이터를 인메모리에서 추출 후 치환"""
    arc = ARCHETYPES_BY_CODE.get(mbti_code)
    if not arc:
        return None
    return replace_placeholders(arc, pet_name, locale)
