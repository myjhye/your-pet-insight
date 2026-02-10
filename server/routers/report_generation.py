from fastapi import APIRouter, HTTPException
from datetime import datetime
import os
import asyncio
import random
import httpx
from config import db

router = APIRouter(prefix="/api/test", tags=["report"])

def get_system_prompt_v3(lang: str, pet_name: str, mbti_code: str, archetype_alias: str, stats: dict, owner_summary: str) -> str:
    """V3 시스템 프롬프트 - Markdown 강제 + 직관적 별명 사용"""
    
    if lang == "jp":
        return f"""あなたは犬の性格分析ブロガーです。

【絶対ルール - 必ず守ってください】
1. 最初の行は必ず「# 」で始めてください（例: # 🐕 タイトル）
2. セクションは必ず「## 」で始めてください（例: ## セクション名）
3. 重要な単語は **太字** にしてください
4. 引用は > で始めてください
5. リストは - で始めてください

【{pet_name}のデータ】
性格タイプ: **{archetype_alias}** ({mbti_code})
社交性: {stats.get('sociability', 50)}% | 知性: {stats.get('sagacity', 50)}%
感情性: {stats.get('emotionality', 50)}% | 従順性: {stats.get('obedience', 50)}%
飼い主タイプ: {owner_summary}

【重要】
- MBTIコード({mbti_code})の代わりに「{archetype_alias}」という直感的な名前を使用してください
- 例: "ISTJ"ではなく「{archetype_alias}」と書く

【出力例】
# 🐕 タイトルはここ

## セクション1
本文テキスト。**重要な単語**は太字で。

> 引用ブロックはこのように書きます。"""

    else:  # English
        return f"""You are a dog personality blog writer.

【ABSOLUTE RULES - YOU MUST FOLLOW】
1. First line MUST start with "# " (example: # 🐕 Title Here)
2. Sections MUST start with "## " (example: ## Section Name)
3. Important words in **bold**
4. Quotes start with >
5. Lists start with -

【{pet_name}'s Data】
Personality Type: **{archetype_alias}** ({mbti_code})
Sociability: {stats.get('sociability', 50)}% | Sagacity: {stats.get('sagacity', 50)}%
Emotionality: {stats.get('emotionality', 50)}% | Obedience: {stats.get('obedience', 50)}%
Owner: {owner_summary}

【IMPORTANT】
- Use the intuitive name "{archetype_alias}" instead of the MBTI code "{mbti_code}"
- Example: Write "{archetype_alias}" NOT "ISTJ"

【OUTPUT FORMAT EXAMPLE】
# 🐕 Title Goes Here

## Section 1
Body text here. **Important words** in bold.

> Quote blocks look like this."""


def get_page_prompts_v3(lang: str, pet_name: str, mbti_code: str, archetype_alias: str, stats: dict, owner_summary: str) -> list:
    """V3 페이지별 프롬프트 - 프론트엔드 pageOrder 및 uiText와 완벽 매칭"""
    
    # Basic Result와 동일한 강도 계산 로직 (항상 50~100% 사이로 표시)
    def get_strength_percent(value):
        """원본 값을 강도 퍼센트로 변환 (Basic Result StatBar와 동일)"""
        return value if value >= 50 else (100 - value)
    
    # 원본 값
    soc_raw = stats.get('sociability', 50)
    sag_raw = stats.get('sagacity', 50)
    emo_raw = stats.get('emotionality', 50)
    obe_raw = stats.get('obedience', 50)
    
    # 강도 값 (Basic Result와 동일하게 표시)
    soc_strength = get_strength_percent(soc_raw)
    sag_strength = get_strength_percent(sag_raw)
    emo_strength = get_strength_percent(emo_raw)
    obe_strength = get_strength_percent(obe_raw)
    
    high_soc = stats.get('sociability', 50) >= 55
    high_sag = stats.get('sagacity', 50) >= 55
    high_emo = stats.get('emotionality', 50) >= 55
    high_obe = stats.get('obedience', 50) >= 55
    
    # 탭 이름 매핑 (프론트엔드 uiText.premium.pageTitles와 일치)
    if lang == "jp":
        titles = {
            "table_of_contents": "目次",
            "deep_dive_traits": "性格分析",
            "cognitive_strengths": "認知的強み",
            "owner_chemistry": "相性分析",
            "training_roadmap": "トレーニングガイド",
            "social_adaptation": "社会適応",
            "lifestyle_guide": "ライフスタイルガイド",
            "heartfelt_message": "特別なメッセージ"
        }
    else:  # English
        titles = {
            "table_of_contents": "Table of Contents",
            "deep_dive_traits": "Personality Analysis",
            "cognitive_strengths": "Cognitive Strengths",
            "owner_chemistry": "Chemistry Analysis",
            "training_roadmap": "Training Guide",
            "social_adaptation": "Social Adaptation",
            "lifestyle_guide": "Lifestyle Guide",
            "heartfelt_message": "Special Message"
        }
    
    if lang == "jp":
        return [
            {
                "page": "table_of_contents",
                "prompt": f"""次の形式で正確に作成してください。アプリのナビゲーションと一致させてください:

# 📖 {pet_name}のプレミアムレポート

## {titles['table_of_contents']}

【厳格な制約 - 必ず守ってください】
1. 形式: シンプルな箇条書きリストを使用してください
2. 内容: 「セクションタイトル」と短い「紹介文」（最大10語）のみを書いてください。各セクションが*何を*扱うかを説明するだけです
3. **スポイラー防止ルール**: このセクションでは、具体的な分析結果、スコア、またはアドバイスを絶対に明かさないでください
   - ❌ 悪い例: "認知的強み: {pet_name}は知性80%の天才です。" (詳細すぎる)
   - ✅ 良い例: "認知的強み: {pet_name}が情報を処理し、問題を解決する方法を発見する。" (紹介文のみ)

【リストするセクション】
1. **{titles['deep_dive_traits']}** — 「{archetype_alias}」タイプの理解
2. **{titles['cognitive_strengths']}** — {pet_name}の情報処理方法
3. **{titles['owner_chemistry']}** — 最高のチームになる理由
4. **{titles['training_roadmap']}** — 最適な方法
5. **{titles['social_adaptation']}** — 他の犬や人との出会い
6. **{titles['lifestyle_guide']}** — 完璧なルーティン
7. **{titles['heartfelt_message']}** — {pet_name}からあなたへ

---

> このレポートは{pet_name}の独特な「{archetype_alias}」性格を深く理解するためのものです。

この形式を正確に従ってください。MBTIコードではなく「{archetype_alias}」を使用してください。"""
            },
            {
                "page": "deep_dive_traits",
                "prompt": f"""# 🐕 {titles['deep_dive_traits']}

## 「{archetype_alias}」プロファイル
{pet_name}の分析に基づく:

[重要: これらはユーザーが基本結果画面で見た正確なスコアです]
- **社交性 {soc_strength}%**: {'外向的で大胆' if high_soc else '控えめで観察力がある'}
- **知性 {sag_strength}%**: {'機転が利き鋭い' if high_sag else '直感的で本能的'}
- **感情性 {emo_strength}%**: {'共感的で表現豊か' if high_emo else '安定して冷静'}
- **従順性 {obe_strength}%**: {'ルール指向で集中力がある' if high_obe else '独立心が強く自由な精神'}

> **AIへの注意**: これらのパーセンテージ（{soc_strength}%、{sag_strength}%、{emo_strength}%、{obe_strength}%）は、基本結果に表示された値と同じです。分析でスコアを参照する際は、これらの正確な数値を使用してください。

## 💪 3つの主要な強み
[これらのスコアに基づいて3つの具体的な強みを詳述]

## ⚠️ 課題とヒント
[実践的な解決策を含む1-2つの課題]

---
> "{pet_name}を一言で: 典型的な「{archetype_alias}」で..." """
            },
            {
                "page": "cognitive_strengths",
                "prompt": f"""# 🧠 {titles['cognitive_strengths']}

**知性スコア: {sag_strength}%** (これは基本結果に表示されたスコアと同じです)

## 学習スタイル
{pet_name}は**{'観察→思考→実行' if high_sag else '実行→感じ→学習'}**タイプです。
[これがどのように彼らを独自の方法で賢くするか説明]

## 🧩 問題解決
[スコアに基づいてパズルおもちゃや新しい環境への反応を詳述]

## 3つのメンタルワークアウト
[3つの具体的な頭脳ゲームを推奨]"""
            },
            {
                "page": "owner_chemistry",
                "prompt": f"""# 💕 {titles['owner_chemistry']}

**飼い主のスタイル:** {owner_summary}
**{pet_name}のタイプ:** 「{archetype_alias}」

## なぜ最高のチームなのか
[飼い主と犬の間の3つの相乗効果のポイントを詳述]

## 🔧 バランスを見つける
[潜在的な摩擦ポイントと解決方法に言及]

---
> "一緒に、あなたと{pet_name}は独特な「{archetype_alias}」の絆を作り出します。" """
            },
            {
                "page": "training_roadmap",
                "prompt": f"""# 🎓 {titles['training_roadmap']}

**従順性スコア: {obe_strength}%** (これは基本結果に表示されたスコアと同じです)

## 最適な戦略
**{'ルールベース' if high_obe else 'ゲームベース'}**アプローチに焦点を当てます。
[なぜこれが彼らに効果的なのか説明]

## 📅 2週間アクションプラン
[シンプルな基礎と構築の表またはリストを提供]

## 🏆 モチベーションの秘訣
- **最適なご褒美:** [性格に基づく食べ物/褒め言葉/遊び]
- **避けるべきこと:** [特定のストレッサー]"""
            },
            {
                "page": "social_adaptation",
                "prompt": f"""# 🐾 {titles['social_adaptation']}

**社交性スコア: {soc_strength}%** (これは基本結果に表示されたスコアと同じです)

## 新しい出会い
{pet_name}は新しい友達を作ることについて**{'熱心' if high_soc else '選択的'}**です。
[ドッグパークや見知らぬ人への具体的なヒントを提供]

## 🏠 変化への適応
**感情性: {emo_strength}%** (これは基本結果に表示されたスコアと同じです)
[感度に基づく引っ越しや分離へのヒント]"""
            },
            {
                "page": "lifestyle_guide",
                "prompt": f"""# ☀️ {titles['lifestyle_guide']}

## 朝 (6:00 - 9:00)
- **起床:** {'高エネルギー' if high_soc else 'ゆっくりと着実'}
- **散歩スタイル:** {'活発な探索' if high_soc else 'リラックスした匂い嗅ぎ'}

## 日中と夕方
- **在宅設定:** [一人でいる時のヒント]
- **遊び時間:** [メンタルとフィジカルのバランス]

## 夜
- **リラックス:** [最適な就寝ルーティン]"""
            },
            {
                "page": "heartfelt_message",
                "prompt": f"""# 💌 {titles['heartfelt_message']}

*{pet_name}の心から{owner_summary}な人間へ*

---
親愛なる人間へ、

[「{archetype_alias}」としての{pet_name}の視点から書かれた3-4段落の温かいメッセージ]

---
> "あなたは私の世界の中心です。" """
            }
        ]
    
    else:  # English
        return [
            {
                "page": "table_of_contents",
                "prompt": f"""Write EXACTLY in this format to match the app navigation:

# 📖 {pet_name}'s Premium Report

## {titles['table_of_contents']}

[Strict Constraints - YOU MUST FOLLOW]
1. Format: Use a simple bullet list
2. Content: Write ONLY the 'Section Title' and a short 'Teaser Sentence' (max 10 words) describing *what* the section covers
3. **ANTI-SPOILER RULE**: DO NOT reveal the specific analysis results, scores, or advice in this section
   - ❌ BAD: "Cognitive Strengths: {pet_name} is a genius with 80% sagacity." (Too detailed)
   - ✅ GOOD: "Cognitive Strengths: Discover how {pet_name} processes information and solves problems." (Teaser only)

[Sections to List]
1. **{titles['deep_dive_traits']}** — Understanding the "{archetype_alias}" type
2. **{titles['cognitive_strengths']}** — How {pet_name} processes information
3. **{titles['owner_chemistry']}** — Why you make a great team
4. **{titles['training_roadmap']}** — Methods that work best
5. **{titles['social_adaptation']}** — Meeting dogs and people
6. **{titles['lifestyle_guide']}** — The perfect routine
7. **{titles['heartfelt_message']}** — From {pet_name} to you

---

> This report provides a deep dive into {pet_name}'s unique "{archetype_alias}" personality.

Follow this exact format. Use "{archetype_alias}" instead of the MBTI code."""
            },
            {
                "page": "deep_dive_traits",
                "prompt": f"""# 🐕 {titles['deep_dive_traits']}

## The "{archetype_alias}" Profile
Based on {pet_name}'s analysis:

[IMPORTANT: These are the EXACT scores the user saw in the Basic Results screen]
- **Sociability {soc_strength}%**: {'Outgoing and bold' if high_soc else 'Reserved and observant'}
- **Sagacity {sag_strength}%**: {'Quick-witted and sharp' if high_sag else 'Intuitive and instinctive'}
- **Emotionality {emo_strength}%**: {'Empathetic and expressive' if high_emo else 'Steady and calm'}
- **Obedience {obe_strength}%**: {'Rule-oriented and focused' if high_obe else 'Independent and free-spirited'}

> **Note for AI**: These percentages ({soc_strength}%, {sag_strength}%, {emo_strength}%, {obe_strength}%) are the same values displayed in the Basic Results. Use these exact numbers when referencing scores in your analysis.

## 💪 3 Key Strengths
[Detail 3 specific strengths based on these scores]

## ⚠️ Challenges & Tips
[1-2 challenges with practical solutions]

---
> "{pet_name} in one sentence: A classic '{archetype_alias}' who..." """
            },
            {
                "page": "cognitive_strengths",
                "prompt": f"""# 🧠 {titles['cognitive_strengths']}

**Sagacity Score: {sag_strength}%** (This is the same score shown in Basic Results)

## Learning Style
{pet_name} is a **{'Watch → Think → Do' if high_sag else 'Do → Feel → Learn'}** type.
[Explain how this makes them smart in their own way]

## 🧩 Problem Solving
[Detail how they react to puzzle toys or new environments based on their scores]

## 3 Mental Workouts
[Recommend 3 specific mind games]"""
            },
            {
                "page": "owner_chemistry",
                "prompt": f"""# 💕 {titles['owner_chemistry']}

**Owner Style:** {owner_summary}
**{pet_name}'s Type:** "{archetype_alias}"

## Why You're a Great Team
[Detail 3 points of synergy between the owner and dog]

## 🔧 Finding Balance
[Mention potential friction points and how to resolve them]

---
> "Together, you and {pet_name} create a unique '{archetype_alias}' bond." """
            },
            {
                "page": "training_roadmap",
                "prompt": f"""# 🎓 {titles['training_roadmap']}

**Obedience Score: {obe_strength}%** (This is the same score shown in Basic Results)

## The Best Strategy
Focus on a **{'rule-based' if high_obe else 'game-based'}** approach.
[Explain why this works for them]

## 📅 2-Week Action Plan
[Provide a simple foundation and building-up table or list]

## 🏆 Motivation Secrets
- **Best Rewards:** [Food/Praise/Play based on personality]
- **What to Avoid:** [Specific stressors]"""
            },
            {
                "page": "social_adaptation",
                "prompt": f"""# 🐾 {titles['social_adaptation']}

**Sociability Score: {soc_strength}%** (This is the same score shown in Basic Results)

## New Encounters
{pet_name} is **{'enthusiastic' if high_soc else 'selective'}** about making new friends.
[Provide specific tips for dog parks and strangers]

## 🏠 Adapting to Change
**Emotionality: {emo_strength}%** (This is the same score shown in Basic Results)
[Tips for moving house or separation based on their sensitivity]"""
            },
            {
                "page": "lifestyle_guide",
                "prompt": f"""# ☀️ {titles['lifestyle_guide']}

## Morning (6:00 - 9:00)
- **Wake-up:** {'High energy' if high_soc else 'Slow and steady'}
- **Walk style:** {'Active exploration' if high_soc else 'Relaxed sniffing'}

## Daytime & Evening
- **Home setup:** [Tips for when they are alone]
- **Playtime:** [Mental vs Physical balance]

## Night
- **Wind-down:** [Best bedtime routine]"""
            },
            {
                "page": "heartfelt_message",
                "prompt": f"""# 💌 {titles['heartfelt_message']}

*A message from {pet_name}'s heart to their {owner_summary} human*

---
Dear Human,

[3-4 warm paragraphs written from {pet_name}'s POV as a "{archetype_alias}"]

---
> "You are the center of my world." """
            }
        ]


# ============================================================
# [POST] 프리미엄 리포트 생성 API V2
# ============================================================
@router.post("/generate-report/{result_id}")
async def generate_report(result_id: str, lang: str = "en"):
    """
    프리미엄 리포트 생성 - 체크 순서: ready → payment → generating
    """
    try:
        # 언어 검증
        if lang not in ["en", "jp"]:
            raise HTTPException(status_code=400, detail="Language must be 'en' or 'jp' only.")

        # 1. Firestore에서 결과 데이터 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Result not found.")

        result_data = doc.to_dict()

        # ★ 2. [중복 방지 - 최우선] 이미 리포트가 ready면 재생성하지 않음
        #    기존 유저(payment_verified 필드 없음)도 여기서 걸려서 정상 반환됨
        if result_data.get("report_status") == "ready" and result_data.get("report_pages"):
            return {
                "status": "success",
                "result_id": result_id,
                "report_status": "ready",
                "pages": list(result_data.get("report_pages", {}).keys()),
                "message": "Report already generated"
            }

        # ★ 3. [보안] 결제 검증 체크 - 리포트가 없는 경우에만 체크
        #    신규 무결제 요청만 여기서 차단됨
        if not result_data.get("payment_verified"):
            raise HTTPException(
                status_code=403,
                detail="Payment not verified. Please complete payment first."
            )

        # ★ 4. [중복 방지] 현재 생성 중이면 중복 요청 방지
        if result_data.get("report_status") == "generating":
            return {
                "status": "success",
                "result_id": result_id,
                "report_status": "generating",
                "message": "Report is currently being generated"
            }

        # === 여기서부터 기존 generate_report 코드 그대로 유지 ===
        pet_name = result_data.get("pet_name", "Pet")
        mbti_code = result_data.get("mbti_code", "ESFP")
        stats = result_data.get("stats", {})
        answers = result_data.get("answers", [])
        
        # ✅ 추가: archetype alias 추출 (The Reliable Sentinel 등)
        archetype_data = result_data.get("archetype", {})
        if archetype_data:
            # 다국어 지원: lang에 맞는 alias 추출
            alias_data = archetype_data.get("alias", {})
            if isinstance(alias_data, dict):
                archetype_alias = alias_data.get(lang, alias_data.get("en", mbti_code))
            else:
                archetype_alias = alias_data if alias_data else mbti_code
        else:
            archetype_alias = mbti_code
        
        # 보너스 답변에서 보호자 성향 추출 (간소화)
        owner_answers = [a for a in answers if a.get("question_id", 0) > 20]
        if owner_answers:
            avg_likert = sum(a.get("likert_value", 0) for a in owner_answers) / len(owner_answers)
            if lang == "jp":
                owner_summary = "活発で積極的" if avg_likert > 0.5 else "バランス型" if avg_likert > -0.5 else "慎重で穏やか"
            else:
                owner_summary = "Active and proactive" if avg_likert > 0.5 else "Balanced and steady" if avg_likert > -0.5 else "Calm and cautious"
        else:
            owner_summary = "Balanced" if lang == "en" else "バランス型"
        
        # 2. 상태 업데이트
        doc_ref.update({
            "report_status": "generating",
            "report_pages": {}
        })
        
        # 3. 특성 판단 (프롬프트에서 사용)
        high_soc = stats.get('sociability', 50) >= 55
        high_sag = stats.get('sagacity', 50) >= 55
        high_emo = stats.get('emotionality', 50) >= 55
        high_obe = stats.get('obedience', 50) >= 55
        
        # 4. V3 프롬프트 생성
        system_prompt = get_system_prompt_v3(lang, pet_name, mbti_code, archetype_alias, stats, owner_summary)
        page_prompts = get_page_prompts_v3(lang, pet_name, mbti_code, archetype_alias, stats, owner_summary)

        # 5. 페이지 생성 함수
        async def generate_page(page_info: dict) -> dict:
            max_retries = 3
            retry_delay = 1.5
            
            for attempt in range(max_retries):
                try:
                    print(f"🔄 [{page_info['page']}] Attempt {attempt + 1}/{max_retries}...")
                    
                    api_key = os.getenv("OPENAI_API_KEY")
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_key}"
                    }
                    
                    payload = {
                        "model": "gpt-5-mini",
                        "input": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": page_info["prompt"]}
                        ],
                        "text": {
                            "format": {"type": "text"},
                            "verbosity": "medium"
                        },
                        "reasoning": {
                            "effort": "medium"
                        },
                        "store": True
                    }
                    
                    async with httpx.AsyncClient(timeout=120.0) as client:
                        response = await client.post(
                            "https://api.openai.com/v1/responses",
                            headers=headers,
                            json=payload
                        )
                        response.raise_for_status()
                        result = response.json()
                    
                    # ✅ 수정된 응답 추출 로직 (List 에러 방지 버전)
                    content_raw = ""

                    # 1. output 배열에서 추출
                    if "output" in result and isinstance(result["output"], list) and len(result["output"]) > 0:
                        for item in result["output"]:
                            # content 필드 확인
                            if "content" in item:
                                val = item["content"]
                                # 만약 content가 리스트라면 (v1/responses 특성) 텍스트만 합침
                                if isinstance(val, list):
                                    content_raw = "".join([part.get("text", "") if isinstance(part, dict) else str(part) for part in val])
                                else:
                                    content_raw = str(val)
                                break

                    # 2. Fallback: text -> content 확인
                    if not content_raw and "text" in result and "content" in result["text"]:
                        val = result["text"]["content"]
                        if isinstance(val, list):
                            content_raw = "".join([part.get("text", "") if isinstance(part, dict) else str(part) for part in val])
                        else:
                            content_raw = str(val)

                    # 최종적으로 문자열임을 보장
                    content = str(content_raw)

                    print(f"✅ [{page_info['page']}] Success: {len(content)} chars")

                    # 내용 검증 및 strip() 호출 (이제 에러가 나지 않습니다)
                    if not content or len(content.strip()) < 50:
                        # 디버깅을 위해 결과 구조 출력
                        print(f"⚠️ [{page_info['page']}] Invalid Content Structure: {result}")
                        raise ValueError(f"Response too short or empty: {len(content)} chars")
                    
                    return {
                        "page": page_info["page"],
                        "content": content,
                        "status": "success"
                    }
                    
                except Exception as e:
                    print(f"⚠️ [{page_info['page']}] Attempt {attempt + 1} failed: {str(e)}")
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (2 ** attempt) + random.random() * 0.5
                        await asyncio.sleep(wait_time)
                    else:
                        return {
                            "page": page_info["page"],
                            "content": f"Generation failed: {str(e)}",
                            "status": "error"
                        }
        
        # 7. 동시성 제한 (3개씩)
        semaphore = asyncio.Semaphore(3)
        
        async def generate_with_limit(page_info: dict) -> dict:
            async with semaphore:
                return await generate_page(page_info)
        
        # 8. 병렬 실행
        print(f"\n{'='*50}")
        print(f"📝 Report V2: {result_id}")
        print(f"🐕 {pet_name} | {mbti_code} | {lang}")
        print(f"{'='*50}")
        
        page_results = await asyncio.gather(
            *[generate_with_limit(page) for page in page_prompts]
        )
        
        # 9. 결과 정리
        report_pages = {}
        for result in page_results:
            report_pages[result["page"]] = {
                "content": result["content"],
                "status": result["status"]
            }
        
        # 10. Firestore 저장
        doc_ref.update({
            "report_pages": report_pages,
            "report_status": "ready",
            "generated_at": datetime.utcnow(),
            "report_version": "v2"
        })
        
        print(f"✅ Report V2 Complete!")
        
        return {
            "status": "success",
            "result_id": result_id,
            "report_status": "ready",
            "pages": list(report_pages.keys()),
            "version": "v2"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        
        try:
            doc_ref.update({"report_status": "failed"})
        except:
            pass
        
        raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")


# ============================================================
# 결제 관련 라우터 등록
# ============================================================
