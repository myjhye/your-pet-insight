from fastapi import APIRouter, HTTPException
from datetime import datetime
import os
import asyncio
import random
import httpx
from config import db
from routers.refund import auto_refund_if_needed
from routers.email import send_premium_report_email

router = APIRouter(prefix="/api/test", tags=["report"])

# ============================================================
# 답변 데이터 분석 헬퍼 함수들
# ============================================================

def get_trait_level(value: int) -> str:
    """스탯 값을 5단계로 분류"""
    if value >= 80: return "very_high"
    if value >= 65: return "high"
    if value >= 45: return "moderate"
    if value >= 30: return "low"
    return "very_low"


def get_trait_description(value: int, lang: str, trait_name: str) -> str:
    """스탯 값에 따른 세분화된 설명 반환"""
    level = get_trait_level(value)
    # 강도 퍼센트 (Basic Result와 동일한 계산)
    strength = value if value >= 50 else (100 - value)
    
    descriptions = {
        "sociability": {
            "en": {
                "very_high": f"Extremely social ({strength}%) — thrives on constant interaction, may struggle when alone",
                "high": f"Outgoing ({strength}%) — enjoys meeting new dogs and people, confident in social settings",
                "moderate": f"Selectively social ({strength}%) — friendly but choosy about companions",
                "low": f"Reserved ({strength}%) — prefers familiar faces, takes time to warm up",
                "very_low": f"Deeply introverted ({strength}%) — bonds intensely with their human, avoids crowds"
            },
            "jp": {
                "very_high": f"非常に社交的 ({strength}%) — 常に交流を求め、一人でいるのが苦手",
                "high": f"外向的 ({strength}%) — 新しい犬や人との出会いを楽しむ",
                "moderate": f"選択的に社交的 ({strength}%) — 友好的だが仲間を選ぶ",
                "low": f"控えめ ({strength}%) — 馴染みの顔を好み、慣れるまで時間がかかる",
                "very_low": f"深く内向的 ({strength}%) — 飼い主との絆が深く、群衆を避ける"
            }
        },
        "sagacity": {
            "en": {
                "very_high": f"Exceptionally sharp ({strength}%) — learns tricks in 1-2 tries, may outsmart you",
                "high": f"Quick learner ({strength}%) — picks up patterns fast, loves mental challenges",
                "moderate": f"Practically smart ({strength}%) — good instincts, learns at a steady pace",
                "low": f"Instinct-driven ({strength}%) — relies on gut feelings over reasoning",
                "very_low": f"Pure instinct ({strength}%) — lives in the moment, responds to emotion over logic"
            },
            "jp": {
                "very_high": f"非常に鋭い ({strength}%) — 1-2回でトリックを覚える、あなたより賢いかも",
                "high": f"学習が早い ({strength}%) — パターンを素早く把握、知的チャレンジ好き",
                "moderate": f"実践的に賢い ({strength}%) — 良い直感、安定したペースで学ぶ",
                "low": f"本能駆動 ({strength}%) — 推論より直感に頼る",
                "very_low": f"純粋な本能 ({strength}%) — 今を生きる、論理より感情で反応"
            }
        },
        "emotionality": {
            "en": {
                "very_high": f"Highly sensitive ({strength}%) — reads your mood instantly, may absorb your stress",
                "high": f"Emotionally attuned ({strength}%) — expressive and empathetic, wears heart on sleeve",
                "moderate": f"Emotionally balanced ({strength}%) — feels deeply but recovers quickly",
                "low": f"Even-tempered ({strength}%) — calm under pressure, rarely fazed",
                "very_low": f"Stoic ({strength}%) — unflappable composure, processes emotions internally"
            },
            "jp": {
                "very_high": f"非常に敏感 ({strength}%) — あなたの気分を即座に読み取り、ストレスを吸収することも",
                "high": f"感情的に調律 ({strength}%) — 表現豊かで共感的",
                "moderate": f"感情的にバランス ({strength}%) — 深く感じるが素早く回復",
                "low": f"穏やか ({strength}%) — プレッシャーに冷静、めったに動じない",
                "very_low": f"ストイック ({strength}%) — 揺るぎない冷静さ、感情を内面で処理"
            }
        },
        "obedience": {
            "en": {
                "very_high": f"Highly trainable ({strength}%) — lives for structure, aims to please",
                "high": f"Cooperative ({strength}%) — follows rules willingly, responds well to guidance",
                "moderate": f"Negotiable ({strength}%) — follows rules when motivated, has an independent streak",
                "low": f"Free-spirited ({strength}%) — prefers self-direction, creative problem solver",
                "very_low": f"Boldly independent ({strength}%) — marches to their own drum, sees rules as suggestions"
            },
            "jp": {
                "very_high": f"非常に訓練しやすい ({strength}%) — 構造を愛し、喜ばせることを目指す",
                "high": f"協力的 ({strength}%) — 進んでルールに従い、指導によく反応",
                "moderate": f"交渉可能 ({strength}%) — モチベーションがあればルールに従う",
                "low": f"自由な精神 ({strength}%) — 自主性を好み、創造的な問題解決者",
                "very_low": f"大胆に独立 ({strength}%) — 自分のリズムで行進、ルールは提案と見なす"
            }
        }
    }
    
    return descriptions.get(trait_name, {}).get(lang, {}).get(level, f"{trait_name}: {strength}%")


def extract_notable_answers(answers: list, lang: str) -> dict:
    """
    답변에서 극단적 응답과 주인 성향 상세 정보를 추출합니다.
    
    Returns:
        {
            "pet_signals": [...],      # 펫에 대한 극단적 답변 (강한 특징)
            "owner_profile": str,      # 주인 성향 상세 설명
            "owner_traits": [...],     # 주인 성향 개별 신호
            "compatibility_notes": str  # 케미 분석용 요약
        }
    """
    pet_answers = [a for a in answers if a.get("question_id", 0) <= 20]
    owner_answers = [a for a in answers if a.get("question_id", 0) > 20]
    
    # === 펫 답변에서 극단적 신호 추출 ===
    pet_signals = []
    for a in pet_answers:
        likert = a.get("likert_value", 0)
        q_text = a.get("question_text", "")
        if not q_text:
            continue
        # 극단적 답변만 (강하게 동의/비동의)
        if abs(likert) >= 0.7:
            if lang == "jp":
                direction = "強く当てはまる" if likert > 0 else "全く当てはまらない"
            else:
                direction = "Strongly agree" if likert > 0 else "Strongly disagree"
            pet_signals.append({
                "question": q_text,
                "direction": direction,
                "value": likert
            })
    
    # 최대 6개까지만 (너무 많으면 프롬프트가 길어짐)
    pet_signals = sorted(pet_signals, key=lambda x: abs(x["value"]), reverse=True)[:6]
    
    # === 주인 답변 상세 분석 ===
    owner_traits = []
    
    for a in owner_answers:
        likert = a.get("likert_value", 0)
        q_text = a.get("question_text", "")
        if not q_text:
            continue
        if abs(likert) >= 0.5:
            if lang == "jp":
                direction = "はい" if likert > 0 else "いいえ"
            else:
                direction = "Yes" if likert > 0 else "No"
            owner_traits.append({
                "question": q_text,
                "direction": direction,
                "value": likert
            })
    
    owner_traits = sorted(owner_traits, key=lambda x: abs(x["value"]), reverse=True)[:5]
    
    # 주인 프로필 생성 (5차원)
    if owner_answers:
        avg_likert = sum(a.get("likert_value", 0) for a in owner_answers) / len(owner_answers)
        
        if lang == "jp":
            if avg_likert > 0.6:
                owner_profile = "非常に活発で冒険好きな飼い主。屋外活動やアクティブな遊びを好み、ルーティンより自発性を重視する"
            elif avg_likert > 0.2:
                owner_profile = "活動的でありながらバランスの取れた飼い主。構造と柔軟性のバランスを保ち、適度な活動量を好む"
            elif avg_likert > -0.2:
                owner_profile = "バランス型の飼い主。安定したルーティンを重視しつつ、新しい経験にもオープン"
            elif avg_likert > -0.6:
                owner_profile = "穏やかで忍耐強い飼い主。静かな時間を大切にし、ゆっくりとした散歩やリラックスした活動を好む"
            else:
                owner_profile = "非常に穏やかで内向的な飼い主。平和な環境を重視し、静かな絆の時間を最も大切にする"
        else:
            if avg_likert > 0.6:
                owner_profile = "Highly active and adventurous owner. Prefers outdoor activities and energetic play, values spontaneity over routine"
            elif avg_likert > 0.2:
                owner_profile = "Active yet balanced owner. Maintains a mix of structure and flexibility, enjoys moderate activity levels"
            elif avg_likert > -0.2:
                owner_profile = "Balanced owner. Values stable routines while remaining open to new experiences"
            elif avg_likert > -0.6:
                owner_profile = "Calm and patient owner. Cherishes quiet time, prefers gentle walks and relaxed activities"
            else:
                owner_profile = "Very calm and introverted owner. Prioritizes peaceful environments, treasures quiet bonding moments above all"
    else:
        owner_profile = "Balanced owner" if lang == "en" else "バランス型の飼い主"
    
    # 케미 호환성 노트 생성
    if owner_answers:
        positive_count = sum(1 for a in owner_answers if a.get("likert_value", 0) > 0.3)
        negative_count = sum(1 for a in owner_answers if a.get("likert_value", 0) < -0.3)
        total = len(owner_answers)
        if lang == "jp":
            compatibility_notes = f"飼い主の回答{total}問中、{positive_count}問が積極的、{negative_count}問が消極的な傾向"
        else:
            compatibility_notes = f"Out of {total} owner responses, {positive_count} leaned active/positive, {negative_count} leaned calm/reserved"
    else:
        compatibility_notes = ""
    
    return {
        "pet_signals": pet_signals,
        "owner_profile": owner_profile,
        "owner_traits": owner_traits,
        "compatibility_notes": compatibility_notes
    }


def get_hidden_patterns(stats: dict, lang: str, pet_name: str) -> list:
    """
    2개 이상의 스탯 조합으로 '숨겨진 패턴'을 생성합니다.
    사용자가 "오, 이건 정말 우리 강아지다!"라고 느끼는 핵심 요소.
    """
    soc = stats.get('sociability', 50)
    sag = stats.get('sagacity', 50)
    emo = stats.get('emotionality', 50)
    obe = stats.get('obedience', 50)
    
    patterns = []
    
    # 사교성 + 감정성 조합
    if soc >= 65 and emo >= 65:
        patterns.append({
            "name": "The Emotional Connector" if lang == "en" else "感情的な絆の達人",
            "emoji": "💞",
            "desc": (
                f"{pet_name} forms deep emotional bonds quickly and reads the room like a pro. "
                f"The flip side: may experience separation anxiety or absorb your bad days."
            ) if lang == "en" else (
                f"{pet_name}は素早く深い感情的な絆を形成し、空気を読むプロ。"
                f"裏返しとして、分離不安やあなたの悪い日を吸収する可能性があります。"
            )
        })
    elif soc >= 65 and emo <= 35:
        patterns.append({
            "name": "The Social Butterfly" if lang == "en" else "ソーシャル・バタフライ",
            "emoji": "🦋",
            "desc": (
                f"{pet_name} loves the party but doesn't take things personally. "
                f"They'll greet everyone at the dog park then move on without a backward glance."
            ) if lang == "en" else (
                f"{pet_name}はパーティーが大好きですが、物事を個人的に受け止めません。"
                f"ドッグパークで全員に挨拶した後、振り返らずに次へ進みます。"
            )
        })
    elif soc <= 35 and emo >= 65:
        patterns.append({
            "name": "The One-Person Dog" if lang == "en" else "一途な忠犬",
            "emoji": "🔒",
            "desc": (
                f"{pet_name} doesn't need a crowd — just YOU. Their emotional world revolves entirely around their favorite human. "
                f"Strangers get polite indifference; you get all the love."
            ) if lang == "en" else (
                f"{pet_name}は群衆を必要としません — あなただけ。感情の世界は完全にお気に入りの人間を中心に回っています。"
                f"見知らぬ人には礼儀正しい無関心、あなたにはすべての愛を。"
            )
        })
    
    # 知性 + 従順性 조합
    if sag >= 65 and obe <= 35:
        patterns.append({
            "name": "The Clever Rebel" if lang == "en" else "賢い反逆者",
            "emoji": "🧠",
            "desc": (
                f"{pet_name} understands every command perfectly — and chooses when to follow them. "
                f"They're not disobedient; they're negotiating. Training needs to be a two-way conversation."
            ) if lang == "en" else (
                f"{pet_name}はすべてのコマンドを完璧に理解しています — そしていつ従うかを選びます。"
                f"不従順ではなく、交渉中です。トレーニングは双方向の会話である必要があります。"
            )
        })
    elif sag >= 65 and obe >= 65:
        patterns.append({
            "name": "The Star Student" if lang == "en" else "優等生",
            "emoji": "⭐",
            "desc": (
                f"{pet_name} is the dream trainee: smart enough to learn fast AND willing to follow through. "
                f"Risk: may get bored with repetitive training. Keep leveling up the challenges."
            ) if lang == "en" else (
                f"{pet_name}は理想的な訓練生：素早く学ぶほど賢く、最後までやり遂げる意欲もある。"
                f"リスク：反復的なトレーニングに飽きる可能性。チャレンジをレベルアップし続けてください。"
            )
        })
    elif sag <= 35 and obe >= 65:
        patterns.append({
            "name": "The Loyal Soldier" if lang == "en" else "忠実な兵士",
            "emoji": "🛡️",
            "desc": (
                f"{pet_name} may not be the quickest learner, but their dedication is unmatched. "
                f"They'll repeat a task 100 times if it makes you happy. Patience + consistency = success."
            ) if lang == "en" else (
                f"{pet_name}は最も速い学習者ではないかもしれませんが、その献身は比類がありません。"
                f"あなたを幸せにするなら100回でもタスクを繰り返します。忍耐 + 一貫性 = 成功。"
            )
        })
    
    # 사교성 + 지능 조합
    if soc <= 35 and sag >= 65:
        patterns.append({
            "name": "The Silent Observer" if lang == "en" else "静かな観察者",
            "emoji": "👁️",
            "desc": (
                f"{pet_name} watches everything before acting. They catalog every person, dog, and squirrel "
                f"before deciding if engagement is worth the effort. Quiet ≠ unaware."
            ) if lang == "en" else (
                f"{pet_name}は行動する前にすべてを観察します。すべての人、犬、リスを分類してから"
                f"関わる価値があるか判断します。静か ≠ 無関心。"
            )
        })
    
    # 감정성 + 종순성 조합
    if emo >= 65 and obe <= 35:
        patterns.append({
            "name": "The Drama Queen/King" if lang == "en" else "ドラマの王様/女王様",
            "emoji": "👑",
            "desc": (
                f"{pet_name} feels everything deeply AND insists on doing things their way. "
                f"Expect theatrical protests when things don't go their way, but also the most heartfelt apologies after."
            ) if lang == "en" else (
                f"{pet_name}はすべてを深く感じ、かつ自分のやり方を貫きます。"
                f"思い通りにいかないときの劇的な抗議を予想してください。でもその後の心からの謝罪も。"
            )
        })
    
    # 전체적 밸런스
    all_moderate = all(35 <= stats.get(k, 50) <= 65 for k in ['sociability', 'sagacity', 'emotionality', 'obedience'])
    if all_moderate:
        patterns.append({
            "name": "The Adaptable All-Rounder" if lang == "en" else "万能な適応者",
            "emoji": "🎯",
            "desc": (
                f"{pet_name} doesn't have extreme tendencies in any direction — and that's a superpower. "
                f"They adapt to almost any situation, household, or lifestyle. The ultimate flexible companion."
            ) if lang == "en" else (
                f"{pet_name}はどの方向にも極端な傾向がありません — そしてそれが超能力です。"
                f"ほぼどんな状況、家庭、ライフスタイルにも適応します。究極の柔軟なパートナー。"
            )
        })
    
    # 최소 1개, 최대 3개 반환
    return patterns[:3] if patterns else [{
        "name": "Unique Blend" if lang == "en" else "ユニークなブレンド",
        "emoji": "✨",
        "desc": (
            f"{pet_name}'s personality doesn't fit neatly into common patterns — "
            f"they're a one-of-a-kind mix that makes them uniquely yours."
        ) if lang == "en" else (
            f"{pet_name}の性格は一般的なパターンにきれいに収まりません — "
            f"あなただけのユニークなミックスです。"
        )
    }]


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


def get_page_prompts_v3(lang: str, pet_name: str, mbti_code: str, archetype_alias: str, stats: dict, owner_summary: str, answer_analysis: dict, trait_descriptions: dict, hidden_patterns: list) -> list:
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
    
    # 공통 데이터 블록 (각 프롬프트에 삽입)
    pet_signals = answer_analysis.get("pet_signals", [])
    owner_traits = answer_analysis.get("owner_traits", [])
    owner_profile = answer_analysis.get("owner_profile", owner_summary)
    compatibility_notes = answer_analysis.get("compatibility_notes", "")
    
    # 펫 신호 텍스트 (프롬프트용)
    if pet_signals:
        if lang == "jp":
            pet_signals_text = "【飼い主の回答から得られた行動シグナル】\n" + "\n".join(
                [f"- \"{s['question']}\": {s['direction']}" for s in pet_signals]
            )
        else:
            pet_signals_text = "【Behavioral Signals from Owner's Responses】\n" + "\n".join(
                [f"- \"{s['question']}\": {s['direction']}" for s in pet_signals]
            )
    else:
        pet_signals_text = ""
    
    # 주인 성향 텍스트 (프롬프트용)
    if owner_traits:
        if lang == "jp":
            owner_traits_text = "【飼い主の性向シグナル】\n" + "\n".join(
                [f"- \"{t['question']}\": {t['direction']}" for t in owner_traits]
            )
        else:
            owner_traits_text = "【Owner Personality Signals】\n" + "\n".join(
                [f"- \"{t['question']}\": {t['direction']}" for t in owner_traits]
            )
    else:
        owner_traits_text = ""
    
    # 숨겨진 패턴 텍스트 (프롬프트용)
    if hidden_patterns:
        if lang == "jp":
            patterns_text = "\n".join(
                [f"- {p['emoji']} **{p['name']}**: {p['desc']}" for p in hidden_patterns]
            )
        else:
            patterns_text = "\n".join(
                [f"- {p['emoji']} **{p['name']}**: {p['desc']}" for p in hidden_patterns]
            )
    else:
        patterns_text = ""
    
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

## The "{archetype_alias}" Profile

Based on {pet_name}'s detailed analysis:

【TRAIT BREAKDOWN — Use these exact descriptions】
- {trait_descriptions['sociability']}
- {trait_descriptions['sagacity']}
- {trait_descriptions['emotionality']}
- {trait_descriptions['obedience']}

{pet_signals_text}

> Use the behavioral signals above to add SPECIFIC, personal details to your analysis.
> For example, if a signal says the dog "strongly agrees" with loving fetch, mention fetch specifically.

## 🔮 Hidden Patterns
These are personality combinations unique to {pet_name}:
{patterns_text}

Elaborate on each hidden pattern with 2-3 sentences, connecting them to the behavioral signals above.

## 💪 3 Key Strengths
[Based on the trait breakdown AND behavioral signals, detail 3 specific strengths. Be concrete — mention actual behaviors, not generic traits.]

## ⚠️ Growth Areas
[1-2 challenges with practical solutions. Reference specific behavioral signals where relevant.]

---
> "{pet_name} in one sentence: A classic '{archetype_alias}' who..." [complete this with a unique sentence that couldn't apply to any other dog]"""
            },
            {
                "page": "cognitive_strengths",
                "prompt": f"""# 🧠 {titles['cognitive_strengths']}

**{trait_descriptions['sagacity']}**

{pet_signals_text}

## 学習スタイル
{pet_name}の知性プロファイルに基づき、彼らは**{
    '視覚的戦略家 — 観察し、計画し、精密に実行する' if sag_raw >= 75 else
    'パターン発見者 — 原因と結果を素早く結びつける' if sag_raw >= 60 else
    '経験的学習者 — 実践で最もよく学び、実践的な練習が必要' if sag_raw >= 40 else
    '感情的直感型 — 指示よりも感情とエネルギーを読む' if sag_raw >= 25 else
    '本能第一反応者 — 瞬間に反応し、反復で学ぶ'
}**です。

[この学習スタイルが日常生活でどのように現れるか、具体的な例で説明してください。上記の関連する行動シグナルを参照してください。]

## 🧩 問題解決プロファイル
[{pet_name}が新しい課題、パズルトイ、不慣れな状況にどのようにアプローチするか。知性 + 従順性の組み合わせに接続: {'戦略的で体系的な' if sag_raw >= 60 and obe_raw >= 60 else '創造的だが非従来型' if sag_raw >= 60 and obe_raw < 40 else '粘り強く決意がある' if sag_raw < 40 and obe_raw >= 60 else '自発的で本能的'}]

## 🎮 {pet_name}のための3つの脳ゲーム
[彼らの学習スタイルに合わせた3つの具体的なメンタルエクササイズを推奨してください。難易度レベルと、各ゲームがこの犬に特に適している理由を含めてください。]"""
            },
            {
                "page": "owner_chemistry",
                "prompt": f"""# 💕 {titles['owner_chemistry']}

**{pet_name}のタイプ:** 「{archetype_alias}」
**飼い主プロファイル:** {owner_profile}

{owner_traits_text}

{pet_signals_text}

**相性データ:** {compatibility_notes}

## なぜ最高のチームなのか
[この飼い主の性格と{pet_name}の特性の間の3つの具体的な相乗効果ポイントを分析してください。
上記の飼い主の性格シグナルとペットの行動シグナルを使用して、具体的な一致を見つけてください。
例：飼い主が長い散歩を楽しむと答えた場合、ペットが高い社交性を持っている場合、これらを接続してください。]

## 🔧 潜在的な摩擦ポイント
[飼い主のスタイルとペットの性格が衝突する可能性がある2つの特定の領域を特定してください。
正直ですが建設的に。それぞれに具体的な解決策を提供してください。
例：穏やかな飼い主 + 高エネルギーの犬 → 特定の移行活動を提案]

## 💡 あなたのユニークな絆強化
[彼らの組み合わせプロファイルに基づいて、この飼い主-ペットペアの絆を特に強化する1つのパーソナライズされた活動または儀式]

---
> "一緒に、あなたと{pet_name}は性格テストが完全に捉えることができない何かを作り出します — 毎日豊かになる生きている、成長する絆。" """
            },
            {
                "page": "training_roadmap",
                "prompt": f"""# 🎓 {titles['training_roadmap']}

**{trait_descriptions['obedience']}**
**組み合わせ:** {trait_descriptions['sagacity']}

{pet_signals_text}

## {pet_name}のトレーニングDNA
トレーニングアプローチ: **{
    'チャレンジ追求者 — 関心を保つために難易度を上げる必要がある' if sag_raw >= 65 and obe_raw >= 65 else
    '交渉者 — 利益が見えれば協力する' if sag_raw >= 65 and obe_raw < 45 else
    '着実な構築者 — 一貫した、忍耐強い反復で繁栄する' if sag_raw < 45 and obe_raw >= 65 else
    '遊び学習者 — 楽しみとして偽装された巧妙なトレーニングが最適' if sag_raw < 45 and obe_raw < 45 else
    'バランス型訓練生 — 構造と遊びの組み合わせに反応する'
}**

[なぜこのアプローチが{pet_name}に特に効果的か、彼らの行動シグナルを参照して説明してください]

## 📅 2週間パーソナライズドプラン

### 第1週: 基礎
- **1-3日目:** [彼らのトレーニングDNAに適した具体的な開始エクササイズ]
- **4-5日目:** [基礎を構築、学習スタイルに調整]
- **6-7日目:** [最初のマイルストーン、具体的な成功基準]

### 第2週: レベルアップ
- **8-10日目:** [段階的なエクササイズ]
- **11-12日目:** [複雑さを追加]
- **13-14日目:** [評価 + お祝いのアイデア]

## 🏆 {pet_name}のモチベーションフォーミュラ
- **主要な報酬:** [食べ物/褒め言葉/遊び — 感情性 + 従順性の組み合わせに基づく]
- **セッション時間:** [具体的な分数 — 知性レベルに基づく]
- **過負荷の警告サイン:** [感情性に基づく]
- **絶対にしてはいけないこと:** [彼らの特定の特性の組み合わせに基づく]"""
            },
            {
                "page": "social_adaptation",
                "prompt": f"""# 🐾 {titles['social_adaptation']}

**{trait_descriptions['sociability']}**
**感情ベースライン:** {trait_descriptions['emotionality']}

{pet_signals_text}

## 新しい犬との出会い
{pet_name}は**{
    '挨拶委員会の議長 — 最初に挨拶し、時には熱心すぎる' if soc_raw >= 75 else
    '友好的な接近者 — 出会いにオープンだが、まず空気を読む' if soc_raw >= 55 else
    '慎重な挨拶者 — 関わる前に評価する時間が必要' if soc_raw >= 35 else
    '選択的社交家 — 友情において質を量より優先'
}**です。

[彼らの正確なプロファイルに基づいたドッグパークの紹介、リード付きの挨拶、プレイデートのダイナミクスのための具体的なヒント]

## 新しい人との出会い
[{pet_name}が家で vs. 外で見知らぬ人に通常どのように反応するか。訪問者のためのヒント。]

## 🏠 変化への適応
感情性{soc_strength}%に基づく:
[引っ越し、新しい家族、スケジュールの変更、旅行のための具体的なガイダンス。
関連する場合は行動シグナルを参照してください。]

## 緊急時の社会的プレイブック
[社会的状況で{pet_name}が圧倒されたときの対処法 — 彼らのプロファイルに基づいた具体的なエスカレーション防止ステップ]"""
            },
            {
                "page": "lifestyle_guide",
                "prompt": f"""# ☀️ {titles['lifestyle_guide']}

**日常計画のための性格スナップショット:**
- {trait_descriptions['sociability']}
- {trait_descriptions['emotionality']}
- {trait_descriptions['obedience']}

{pet_signals_text}

## ☀️ 朝のルーティン（推奨）
- **起床スタイル:** {
    '爆発的なエネルギー — それをチャネルするための即座の活動が必要' if soc_raw >= 70 else
    '穏やかな起床者 — 外出前に穏やかなスタートを感謝する' if soc_raw >= 40 else
    'スロースターター — 自分のペースで目覚めるスペースを与える'
}
- **散歩の推奨:** [彼らの特定の組み合わせに基づいた時間、強度、スタイル]
- **朝の給餌戦略:** [散歩の前または後、彼らのエネルギーパターンに基づく]

## 🌤️ 日中
- **一人の時間の許容度:** {
    '低い — インタラクティブなおもちゃ、バックグラウンドノイズ、または仲間が必要' if soc_raw >= 70 and emo_raw >= 60 else
    '中程度 — 適切な設定で4-5時間処理できる' if 40 <= soc_raw < 70 else
    '良い — より長い期間自己娯楽するのに十分な独立性'
}
- **理想的な環境設定:** [彼らの性格のための具体的な提案]
- **メンタル刺激スケジュール:** [知性レベルに基づく]

## 🌙 夕方のリラックス
- **仕事後の再会:** [感情性に基づいた挨拶方法]
- **夕方の活動:** [プロファイルからのエネルギーパターンに基づく]
- **就寝時の儀式:** [感情的な感受性に適した落ち着く活動]

## 🗓️ 週末スペシャル
[{pet_name}の「{archetype_alias}」性格 + 飼い主のプロファイルに特化して設計された1つの完璧な週末活動]"""
            },
            {
                "page": "heartfelt_message",
                "prompt": f"""# 💌 {titles['heartfelt_message']}

*{pet_name}の心から愛する人間への手紙*

【執筆指示】
- {pet_name}の一人称視点から「{archetype_alias}」として書いてください
- チャネルする性格: {trait_descriptions['sociability']}, {trait_descriptions['emotionality']}
- 対処する飼い主タイプ: {owner_profile}

{pet_signals_text}

【真正性のための重要なルール】
1. 上記から少なくとも2つの具体的な行動シグナルを参照してください（例：フェッチが好きな場合、「ボールを投げる瞬間」に言及）
2. この性格タイプが大切にする1つの具体的な日常の瞬間を含めてください（一般的な「散歩が好き」ではなく — 彼らの特性の組み合わせに特有の何か）
3. {pet_name}が{'高い社交性' if soc_raw >= 65 else '低い社交性' if soc_raw <= 35 else '中程度の社交性'}を持っている場合: 人間について話す方法と世界の残りの部分を反映してください
4. {pet_name}が{'高い感情性' if emo_raw >= 65 else '低い感情性' if emo_raw <= 35 else '中程度の感情性'}を持っている場合: 感情の深さと表現のスタイルに反映してください
5. 飼い主を笑顔にしたり涙を流させたりする何かで終わってください

---
親愛なる人間へ、

[4-5の温かく、個人的な段落を書いてください。これは{pet_name}によってのみ書かれたように感じられるべきです — 他の犬ではありません。]

永遠にあなたのもの、
{pet_name} 🐾

---
> [{pet_name}のユニークな性格の本質を捉えた1つの最終的な引用]"""
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

Based on {pet_name}'s detailed analysis:

【TRAIT BREAKDOWN — Use these exact descriptions】
- {trait_descriptions['sociability']}
- {trait_descriptions['sagacity']}
- {trait_descriptions['emotionality']}
- {trait_descriptions['obedience']}

{pet_signals_text}

> Use the behavioral signals above to add SPECIFIC, personal details to your analysis.
> For example, if a signal says the dog "strongly agrees" with loving fetch, mention fetch specifically.

## 🔮 Hidden Patterns
These are personality combinations unique to {pet_name}:
{patterns_text}

Elaborate on each hidden pattern with 2-3 sentences, connecting them to the behavioral signals above.

## 💪 3 Key Strengths
[Based on the trait breakdown AND behavioral signals, detail 3 specific strengths. Be concrete — mention actual behaviors, not generic traits.]

## ⚠️ Growth Areas
[1-2 challenges with practical solutions. Reference specific behavioral signals where relevant.]

---
> "{pet_name} in one sentence: A classic '{archetype_alias}' who..." [complete this with a unique sentence that couldn't apply to any other dog]"""
            },
            {
                "page": "cognitive_strengths",
                "prompt": f"""# 🧠 {titles['cognitive_strengths']}

**{trait_descriptions['sagacity']}**

{pet_signals_text}

## Learning Style
Based on {pet_name}'s sagacity profile, they are a **{
    'Visual Strategist — watches, plans, then executes with precision' if sag_raw >= 75 else
    'Pattern Spotter — quickly connects cause and effect' if sag_raw >= 60 else
    'Experiential Learner — learns best by doing, needs hands-on practice' if sag_raw >= 40 else
    'Emotional Intuitive — reads feelings and energy rather than instructions' if sag_raw >= 25 else
    'Instinct-First Reactor — responds to the moment, learns through repetition'
}**.

[Explain how this learning style shows up in daily life with specific examples. Reference any relevant behavioral signals above.]

## 🧩 Problem-Solving Profile
[How {pet_name} approaches new challenges, puzzle toys, and unfamiliar situations. Connect to the sagacity + obedience combination: {'strategic and methodical' if sag_raw >= 60 and obe_raw >= 60 else 'creative but unconventional' if sag_raw >= 60 and obe_raw < 40 else 'persistent and determined' if sag_raw < 40 and obe_raw >= 60 else 'spontaneous and instinctive'}]

## 🎮 3 Brain Games for {pet_name}
[Recommend 3 SPECIFIC mental exercises tailored to their learning style. Include difficulty level and why each game suits THIS dog specifically.]"""
            },
            {
                "page": "owner_chemistry",
                "prompt": f"""# 💕 {titles['owner_chemistry']}

**{pet_name}'s Type:** "{archetype_alias}"
**Owner Profile:** {owner_profile}

{owner_traits_text}

{pet_signals_text}

**Compatibility Data:** {compatibility_notes}

## Why You're a Great Team
[Analyze 3 SPECIFIC points of synergy between this owner's personality and {pet_name}'s traits.
Use the owner personality signals and pet behavioral signals above to find concrete matches.
Example: If the owner answered "Yes" to enjoying long walks AND the pet has high sociability, connect these.]

## 🔧 Potential Friction Points
[Identify 2 specific areas where owner style and pet personality might clash.
Be honest but constructive. Provide a concrete solution for each.
Example: If calm owner + high-energy dog → suggest specific transition activities]

## 💡 Your Unique Bond Strengthener
[One personalized activity or ritual that would specifically strengthen THIS owner-pet pair's bond, based on their combined profiles]

---
> "Together, you and {pet_name} create something no personality test can fully capture — a living, growing bond that gets richer every day." """
            },
            {
                "page": "training_roadmap",
                "prompt": f"""# 🎓 {titles['training_roadmap']}

**{trait_descriptions['obedience']}**
**Combined with: {trait_descriptions['sagacity']}**

{pet_signals_text}

## {pet_name}'s Training DNA
Training approach: **{
    'Challenge Seeker — needs increasing difficulty to stay engaged' if sag_raw >= 65 and obe_raw >= 65 else
    'Negotiator — will cooperate if they see the benefit' if sag_raw >= 65 and obe_raw < 45 else
    'Steady Builder — thrives with consistent, patient repetition' if sag_raw < 45 and obe_raw >= 65 else
    'Play Learner — sneaky training disguised as fun works best' if sag_raw < 45 and obe_raw < 45 else
    'Balanced Trainee — responds to a mix of structure and play'
}**

[Explain why this approach works for {pet_name} specifically, referencing their behavioral signals]

## 📅 2-Week Personalized Plan

### Week 1: Foundation
- **Day 1-3:** [Specific starter exercises suited to their training DNA]
- **Day 4-5:** [Building on foundation, adjusted for their learning style]
- **Day 6-7:** [First milestone, with specific success criteria]

### Week 2: Level Up
- **Day 8-10:** [Progressive exercises]
- **Day 11-12:** [Adding complexity]
- **Day 13-14:** [Assessment + celebration ideas]

## 🏆 Motivation Formula for {pet_name}
- **Primary reward:** [Food/Praise/Play — based on their emotionality + obedience combo]
- **Session length:** [Specific minutes — based on sagacity level]
- **Warning signs of overload:** [Based on their emotionality]
- **What to NEVER do:** [Based on their specific trait combination]"""
            },
            {
                "page": "social_adaptation",
                "prompt": f"""# 🐾 {titles['social_adaptation']}

**{trait_descriptions['sociability']}**
**Emotional baseline: {trait_descriptions['emotionality']}**

{pet_signals_text}

## Meeting New Dogs
{pet_name} is a **{
    'Greeting Committee Chair — first to say hello, sometimes too enthusiastically' if soc_raw >= 75 else
    'Friendly Approacher — open to meeting but reads the room first' if soc_raw >= 55 else
    'Cautious Greeter — needs time to assess before engaging' if soc_raw >= 35 else
    'Selective Socializer — quality over quantity in friendships'
}**.

[Specific tips for dog park introductions, on-leash greetings, and playdate dynamics based on their exact profile]

## Meeting New People
[How {pet_name} typically reacts to strangers at home vs. outside. Tips for visitors.]

## 🏠 Adapting to Change
Based on emotionality {emo_strength}%:
[Specific guidance for: moving house, new family members, schedule changes, travel.
Reference behavioral signals where relevant.]

## Emergency Social Playbook
[What to do when {pet_name} is overwhelmed in a social situation — specific de-escalation steps based on their profile]"""
            },
            {
                "page": "lifestyle_guide",
                "prompt": f"""# ☀️ {titles['lifestyle_guide']}

**Personality snapshot for daily planning:**
- {trait_descriptions['sociability']}
- {trait_descriptions['emotionality']}
- {trait_descriptions['obedience']}

{pet_signals_text}

## ☀️ Morning Routine (suggested)
- **Wake-up style:** {
    'Explosive energy — needs immediate activity to channel it' if soc_raw >= 70 else
    'Gentle riser — appreciates a calm start before heading out' if soc_raw >= 40 else
    'Slow starter — give them space to wake up on their own terms'
}
- **Walk recommendation:** [Duration, intensity, and style based on their specific combination]
- **Morning feeding strategy:** [Before or after walk, based on their energy pattern]

## 🌤️ Daytime
- **Alone time tolerance:** {
    'Low — needs interactive toys, background noise, or a companion' if soc_raw >= 70 and emo_raw >= 60 else
    'Moderate — can handle 4-5 hours with proper setup' if 40 <= soc_raw < 70 else
    'Good — independent enough to self-entertain for longer periods'
}
- **Ideal environment setup:** [Specific suggestions for their personality]
- **Mental stimulation schedule:** [Based on sagacity level]

## 🌙 Evening Wind-Down
- **Post-work reunion:** [How to greet them based on their emotionality]
- **Evening activity:** [Based on energy patterns from their profile]
- **Bedtime ritual:** [Calming activities suited to their emotional sensitivity]

## 🗓️ Weekend Special
[One perfect weekend activity designed specifically for {pet_name}'s "{archetype_alias}" personality + their owner's profile]"""
            },
            {
                "page": "heartfelt_message",
                "prompt": f"""# 💌 {titles['heartfelt_message']}

*A letter from {pet_name}'s heart to their beloved human*

【WRITING INSTRUCTIONS】
- Write from {pet_name}'s first-person perspective as a "{archetype_alias}"
- Personality to channel: {trait_descriptions['sociability']}, {trait_descriptions['emotionality']}
- Owner type to address: {owner_profile}

{pet_signals_text}

【CRITICAL RULES FOR AUTHENTICITY】
1. Reference at LEAST 2 specific behavioral signals from above (e.g., if they love fetch, mention "those moments when you throw the ball")
2. Include ONE specific daily moment that THIS personality type would treasure (not generic "I love walks" — something unique to their trait combination)
3. If {pet_name} has {'high sociability' if soc_raw >= 65 else 'low sociability' if soc_raw <= 35 else 'moderate sociability'}: reflect this in how they talk about their human vs. the rest of the world
4. If {pet_name} has {'high emotionality' if emo_raw >= 65 else 'low emotionality' if emo_raw <= 35 else 'moderate emotionality'}: reflect this in the emotional depth and style of expression
5. End with something that will make the owner smile or tear up

---
Dear Human,

[Write 4-5 warm, personal paragraphs. This should feel like it could ONLY have been written by {pet_name} — not any other dog.]

Forever yours,
{pet_name} 🐾

---
> [One final quote that captures {pet_name}'s unique personality essence]"""
            }
        ]


# ============================================================
# [POST] 프리미엄 리포트 생성 API V2
# ============================================================
async def _generate_report_internal(result_id: str, lang: str = "en") -> dict:
    """
    리포트 생성 핵심 로직.
    verify.py의 BackgroundTask에서 호출하거나, API 엔드포인트에서 호출합니다.
    HTTPException 대신 dict를 반환합니다 (백그라운드에서는 HTTP 응답이 없으므로).
    """
    try:
        # 언어 검증
        if lang not in ["en", "jp"]:
            return {"status": "error", "message": "Language must be 'en' or 'jp' only."}

        # 1. Firestore에서 결과 데이터 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()

        if not doc.exists:
            return {"status": "error", "message": "Result not found."}

        result_data = doc.to_dict()

        # ★ 2. [중복 방지 - 최우선] 이미 리포트가 ready면 재생성하지 않음
        #    ready인데 이메일 안 보냈으면 이메일만 재전송
        if result_data.get("report_status") == "ready" and result_data.get("report_pages"):
            # ★ ready인데 이메일 안 보냈으면 이메일만 재전송
            if not result_data.get("email_sent") and result_data.get("customer_email"):
                try:
                    email_result = await send_premium_report_email(
                        to_email=result_data["customer_email"],
                        pet_name=result_data.get("pet_name", "Pet"),
                        report_pages=result_data["report_pages"],
                        lang=lang,
                        result_id=result_id
                    )
                    doc_ref.update({
                        "email_sent": email_result.get("sent", False),
                        "email_sent_at": datetime.utcnow() if email_result.get("sent") else None,
                        "email_id": email_result.get("email_id"),
                    })
                except Exception as e:
                    print(f"⚠️ [EMAIL RETRY] {result_id}: {str(e)}")
            
            return {
                "status": "success",
                "result_id": result_id,
                "report_status": "ready",
                "pages": list(result_data.get("report_pages", {}).keys()),
                "message": "Report already generated"
            }

        # ★ 3. [보안] 결제 검증 체크 - 리포트가 없는 경우에만 체크
        if not result_data.get("payment_verified"):
            return {"status": "error", "message": "Payment not verified. Please complete payment first."}

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
        
        # ★ [개선] 답변 데이터 풍부하게 가공
        answer_analysis = extract_notable_answers(answers, lang)
        owner_summary = answer_analysis["owner_profile"]
        
        # 스탯 세분화 설명
        trait_descriptions = {
            "sociability": get_trait_description(stats.get('sociability', 50), lang, "sociability"),
            "sagacity": get_trait_description(stats.get('sagacity', 50), lang, "sagacity"),
            "emotionality": get_trait_description(stats.get('emotionality', 50), lang, "emotionality"),
            "obedience": get_trait_description(stats.get('obedience', 50), lang, "obedience"),
        }
        
        # 숨겨진 패턴 생성
        hidden_patterns = get_hidden_patterns(stats, lang, pet_name)
        
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
        page_prompts = get_page_prompts_v3(
            lang, pet_name, mbti_code, archetype_alias, stats, owner_summary,
            answer_analysis, trait_descriptions, hidden_patterns
        )

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
        
        # 9. 결과 정리 및 실패 판정
        report_pages = {}
        success_count = 0
        error_count = 0
        
        for result in page_results:
            report_pages[result["page"]] = {
                "content": result["content"],
                "status": result["status"]
            }
            if result["status"] == "success":
                success_count += 1
            else:
                error_count += 1
        
        # ★ 전체 실패 판정: 성공한 페이지가 절반 미만이면 실패로 처리
        total_pages = len(page_prompts)
        is_total_failure = success_count < (total_pages / 2)
        
        if is_total_failure:
            # 리포트 생성 실패 → 자동 환불
            doc_ref.update({
                "report_status": "failed",
                "report_pages": report_pages,  # 부분 결과라도 저장 (디버깅용)
                "failed_at": datetime.utcnow(),
            })
            
            refund_result = await auto_refund_if_needed(
                result_id,
                f"Report generation failed: {success_count}/{total_pages} pages succeeded"
            )
            
            print(f"❌ Report FAILED: {success_count}/{total_pages} pages. Refund: {refund_result.get('refunded')}")
            
            return {
                "status": "failed",
                "result_id": result_id,
                "report_status": "failed",
                "success_pages": success_count,
                "total_pages": total_pages,
                "refund_initiated": refund_result.get("refunded", False),
                "message": f"Report generation failed ({success_count}/{total_pages} pages). "
                           f"{'Automatic refund initiated.' if refund_result.get('refunded') else 'Please contact support.'}"
            }
        
        # 10. 성공 → Firestore 저장
        doc_ref.update({
            "report_pages": report_pages,
            "report_status": "ready",
            "generated_at": datetime.utcnow(),
            "report_version": "v2"
        })
        
        print(f"✅ Report V2 Complete! ({success_count}/{total_pages} pages)")
        
        # ★ 11. 이메일 전송 (실패해도 리포트 상태에 영향 없음)
        email_result = {"sent": False, "message": "No email", "email_id": None}
        customer_email = result_data.get("customer_email")
        if customer_email:
            try:
                email_result = await send_premium_report_email(
                    to_email=customer_email,
                    pet_name=pet_name,
                    report_pages=report_pages,
                    lang=lang,
                    result_id=result_id
                )
                
                # 이메일 전송 결과를 Firestore에 기록
                doc_ref.update({
                    "email_sent": email_result.get("sent", False),
                    "email_sent_at": datetime.utcnow() if email_result.get("sent") else None,
                    "email_id": email_result.get("email_id"),
                })
                
                if email_result.get("sent"):
                    print(f"📧 Report email sent to {customer_email}")
                else:
                    print(f"⚠️ Report email failed: {email_result.get('message')}")
            except Exception as e:
                print(f"⚠️ [EMAIL] Error sending report email (non-blocking): {str(e)}")
                try:
                    doc_ref.update({"email_sent": False, "email_error": str(e)[:200]})
                except:
                    pass
        else:
            print(f"ℹ️ No customer email found for {result_id}, skipping email delivery")
        
        return {
            "status": "success",
            "result_id": result_id,
            "report_status": "ready",
            "pages": list(report_pages.keys()),
            "version": "v2",
            "email_sent": bool(customer_email and email_result.get("sent")) if customer_email else False
        }
        
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        
        # ★ 예상치 못한 에러 → report_status: "failed" + 자동 환불
        try:
            doc_ref.update({"report_status": "failed"})
        except:
            pass
        
        try:
            refund_result = await auto_refund_if_needed(
                result_id,
                f"Unexpected report generation error: {str(e)[:100]}"
            )
            print(f"🔄 [REFUND] Emergency refund for {result_id}: {refund_result}")
        except:
            print(f"❌ [REFUND] Emergency refund also failed for {result_id}")
        
        return {"status": "error", "message": f"Report generation error: {str(e)}"}


@router.post("/generate-report/{result_id}")
async def generate_report(result_id: str, lang: str = "en"):
    """
    프리미엄 리포트 생성 API.
    프론트엔드에서 직접 호출하는 폴백용으로 유지합니다.
    주요 생성은 verify 성공 시 BackgroundTask로 자동 실행됩니다.
    """
    result = await _generate_report_internal(result_id, lang)
    
    if result.get("status") == "error":
        error_message = result.get("message", "Unknown error")
        if "not verified" in error_message:
            raise HTTPException(status_code=403, detail=error_message)
        elif "not found" in error_message:
            raise HTTPException(status_code=404, detail=error_message)
        else:
            raise HTTPException(status_code=500, detail=error_message)
    
    return result


# ============================================================
# 결제 관련 라우터 등록
# ============================================================
