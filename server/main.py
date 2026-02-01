from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, firestore
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import uuid
import asyncio
import os
import random
from dotenv import load_dotenv
from openai import AsyncOpenAI

# .env 파일의 내용을 로드합니다.
load_dotenv()

# 1. Firebase 인증 및 초기화 (안전한 초기화 - 중복 방지)
if not firebase_admin._apps:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
else:
    firebase_admin.get_app()

db = firestore.client()

# 인메모리 캐시 (서버 실행 중 유지)
cached_questions = {}

# OpenAI 클라이언트 초기화
# 이제 os.getenv가 .env 파일의 값을 가져올 수 있습니다.
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# 2. CORS 설정 (리액트에서 접속 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시에는 리액트 주소만 허용하도록 수정
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 모델 정의
class TestResult(BaseModel):
    result_id: str
    pet_name: str
    locale: str
    answers: List[Dict]
    archetype_id: str


# MBTI 계산 요청 모델
class CalculateRequest(BaseModel):
    petName: str
    mainAnswers: Dict[str, int]   # {"0": 3, "1": -2, ...} 인덱스: 점수(-3~3)
    bonusAnswers: Dict[str, int]  # {"0": 1, "1": -1, ...}
    locale: str = "en"


@app.get("/")
def read_root():
    return {"status": "🔥 Firebase 연결 성공! Your Pet Insight API is running."}


# 언어별 텍스트 필터링 함수
def filter_by_lang(questions_list: list, lang: str) -> list:
    """질문 목록에서 특정 언어의 텍스트만 추출"""
    filtered = []
    for q in questions_list:
        # 해당 언어가 없으면 영어(en)를 기본값으로 사용
        text = q.get("text", {}).get(lang, q.get("text", {}).get("en", ""))
        filtered.append({
            "id": q["id"],
            "axis": q["axis"],
            "is_reverse": q.get("is_reverse", False),
            "text": text  # 이제 text는 객체가 아닌 '문자열'
        })
    return filtered


# [GET] 질문지 불러오기 API - 언어별 필터링 (권장)
@app.get("/api/questions/{version}/{lang}")
async def get_localized_questions(version: str, lang: str):
    # 1. 캐시 확인 (버전_언어 조합으로 키 생성)
    cache_key = f"{version}_{lang}"
    if cache_key in cached_questions:
        return cached_questions[cache_key]
    
    # 2. Firestore에서 원본 데이터 가져오기
    doc_ref = db.collection("assessment_configs").document(version)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="질문지를 찾을 수 없습니다.")
    
    data = doc.to_dict()
    
    # 3. 특정 언어 데이터만 필터링
    result = {
        "stage1": filter_by_lang(data.get("questions", []), lang),
        "stage2": filter_by_lang(data.get("owner_questions", []), lang)
    }
    
    # 4. 결과 캐싱
    cached_questions[cache_key] = result
    return result


# [GET] 질문지 불러오기 API - 전체 언어 (레거시 호환용)
@app.get("/api/questions/{version}")
async def get_questions(version: str):
    # 1. 이미 캐시된 데이터가 있다면 즉시 반환 (DB 호출 없이 ~0.001초)
    if version in cached_questions:
        return cached_questions[version]
    
    # 2. 캐시가 없으면 Firestore에서 가져옴
    doc_ref = db.collection("assessment_configs").document(version)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="질문지를 찾을 수 없습니다.")
    
    data = doc.to_dict()
    
    # 프론트엔드 편의를 위해 데이터를 스테이지별로 정리
    formatted_data = {
        "stage1": data.get("questions", []),       # 1-20번 문항
        "stage2": data.get("owner_questions", [])  # 21-25번 문항 (보호자 성향)
    }
    
    # 3. 가져온 데이터를 캐시에 저장
    cached_questions[version] = formatted_data
    return formatted_data


# [POST] 테스트 결과 저장 API (레거시)
@app.post("/api/save-result")
async def save_result(result: TestResult):
    try:
        db.collection("test_results").document(result.result_id).set(result.dict())
        return {"status": "success", "message": "결과가 성공적으로 저장되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# [POST] MBTI 계산 및 결과 저장 API
# ============================================================
@app.post("/api/calculate")
async def calculate_mbti(request: CalculateRequest):
    try:
        # ---------------------------------------------------------
        # 1. 질문 메타데이터 조회 (axis, is_reverse 정보)
        # ---------------------------------------------------------
        doc_ref = db.collection("assessment_configs").document("dog_v1")
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="질문 설정을 찾을 수 없습니다.")
        
        config_data = doc.to_dict()
        all_questions = config_data.get("questions", []) + config_data.get("owner_questions", [])
        
        # 질문 ID → 메타데이터 매핑 (ID를 문자열로 통일하여 안전하게 처리)
        question_meta = {str(q["id"]): q for q in all_questions}
        
        # ---------------------------------------------------------
        # 2. 점수 변환 (Likert -3~3 → 1~5 척도로 선형 매핑)
        # ---------------------------------------------------------
        def convert_score(likert_score: int) -> float:
            """Likert (-3 ~ 3) → 5점 척도 (1 ~ 5) 선형 매핑"""
            # 선형 변환: ((score + 3) / 6 * 4) + 1
            # -3 → 1, -2 → 1.67, -1 → 2.33, 0 → 3, 1 → 3.67, 2 → 4.33, 3 → 5
            return ((likert_score + 3) / 6 * 4) + 1
        
        # ---------------------------------------------------------
        # 3. 역채점 처리 및 MBTI 축별 점수 합산
        # ---------------------------------------------------------
        axis_scores = {"E": 0, "S": 0, "F": 0, "J": 0}
        axis_question_counts = {"E": 0, "S": 0, "F": 0, "J": 0}  # 각 축별 질문 개수 추적
        all_answers = []
        
        print(f"\n{'='*60}")
        print(f"📋 질문별 점수 계산 시작 (총 {len(request.mainAnswers)}개 질문)")
        print(f"{'='*60}")
        
        # mainAnswers (1~20번 질문)
        for idx_str, likert_value in request.mainAnswers.items():
            # 인덱스 기반 ID 매핑 (인덱스 0 → 질문 ID 1)
            actual_id = str(int(idx_str) + 1)
            meta = question_meta.get(actual_id)
            
            if not meta:
                print(f"⚠️ 질문 ID {actual_id}를 찾을 수 없습니다.")
                continue
            
            # Likert → 5점 척도 선형 변환
            raw_score = convert_score(likert_value)
            
            # 역채점 처리 (5점 척도 기준: 6 - 점수)
            is_reverse = meta.get("is_reverse", False)
            final_score = (6 - raw_score) if is_reverse else raw_score
            
            # 축별 점수 합산
            axis = meta.get("axis")
            if axis in axis_scores:
                axis_scores[axis] += final_score
                axis_question_counts[axis] += 1
                
                # 상세 디버깅 로그
                print(f"Q{actual_id:2s} | Likert: {likert_value:2d} | Raw: {raw_score:5.2f} | "
                      f"Reverse: {is_reverse} | Final: {final_score:5.2f} | "
                      f"Axis: {axis} | 누적: {axis_scores[axis]:6.2f}")
            
            all_answers.append({
                "question_id": int(actual_id),
                "likert_value": likert_value,
                "raw_score": round(raw_score, 2),
                "final_score": round(final_score, 2),
                "axis": axis,
                "is_reverse": is_reverse
            })
        
        print(f"{'='*60}")
        print(f"📊 축별 점수 합계 (질문 개수)")
        print(f"{'='*60}")
        for axis, score in axis_scores.items():
            count = axis_question_counts[axis]
            avg = score / count if count > 0 else 0
            print(f"{axis}축: 총점 {score:6.2f}점 (질문 {count}개, 평균 {avg:.2f}점)")
        print(f"{'='*60}\n")
        
        # bonusAnswers (21~25번 질문) - 보호자 성향, MBTI 계산에는 미포함
        for idx_str, likert_value in request.bonusAnswers.items():
            actual_id = str(20 + int(idx_str) + 1)  # 인덱스 0 → 질문 ID 21
            meta = question_meta.get(actual_id)
            
            raw_score = convert_score(likert_value)
            
            all_answers.append({
                "question_id": int(actual_id),
                "likert_value": likert_value,
                "raw_score": round(raw_score, 2),
                "final_score": round(raw_score, 2),  # 보너스는 역채점 없음
                "axis": meta.get("axis") if meta else "bonus",
                "is_reverse": False
            })
        
        # ---------------------------------------------------------
        # 4. 백분율 Stats 계산 (먼저 계산하여 MBTI 판정에 사용)
        # ---------------------------------------------------------
        def get_stat(score: float) -> int:
            """5~25점 범위를 0~100%로 변환"""
            # (획득점수 - 최소점수5) / (최대점수25 - 최소점수5) * 100
            percentage = ((score - 5) / 20) * 100
            return round(percentage)
        
        stats = {
            "sociability": get_stat(axis_scores["E"]),      # E축
            "sagacity": get_stat(axis_scores["S"]),         # S축
            "emotionality": get_stat(axis_scores["F"]),     # F축
            "obedience": get_stat(axis_scores["J"]),        # J축
        }
        stats["temperament"] = round((stats["sociability"] + stats["obedience"]) / 2)
        
        # 상세 디버깅: Stats 계산 과정 출력
        print(f"\n{'='*60}")
        print(f"📊 백분율 Stats 계산")
        print(f"{'='*60}")
        print(f"E축 점수: {axis_scores['E']:.2f}점 → Sociability: {stats['sociability']}%")
        print(f"S축 점수: {axis_scores['S']:.2f}점 → Sagacity: {stats['sagacity']}%")
        print(f"F축 점수: {axis_scores['F']:.2f}점 → Emotionality: {stats['emotionality']}%")
        print(f"J축 점수: {axis_scores['J']:.2f}점 → Obedience: {stats['obedience']}%")
        print(f"Temperament: {stats['temperament']}% (Sociability + Obedience 평균)")
        print(f"{'='*60}\n")
        
        # ---------------------------------------------------------
        # 5. MBTI 4축 판정 (백분율 50% 기준)
        # ---------------------------------------------------------
        e_i = "E" if stats["sociability"] >= 50 else "I"
        s_n = "S" if stats["sagacity"] >= 50 else "N"
        f_t = "F" if stats["emotionality"] >= 50 else "T"
        j_p = "J" if stats["obedience"] >= 50 else "P"
        
        mbti_code = e_i + s_n + f_t + j_p
        
        # 상세 디버깅: MBTI 판정 과정 출력
        print(f"{'='*60}")
        print(f"🎯 MBTI 판정 (50% 기준)")
        print(f"{'='*60}")
        print(f"E/I: Sociability {stats['sociability']}% → {e_i} ({'Extroverted' if e_i == 'E' else 'Introverted'})")
        print(f"S/N: Sagacity {stats['sagacity']}% → {s_n} ({'Sensing' if s_n == 'S' else 'Intuitive'})")
        print(f"F/T: Emotionality {stats['emotionality']}% → {f_t} ({'Feeling' if f_t == 'F' else 'Thinking'})")
        print(f"J/P: Obedience {stats['obedience']}% → {j_p} ({'Judging' if j_p == 'J' else 'Perceiving'})")
        print(f"\n✅ 최종 MBTI: {mbti_code}")
        print(f"{'='*60}\n")
        
        # ---------------------------------------------------------
        # 6. Archetype 데이터 조회
        # ---------------------------------------------------------
        archetype_ref = db.collection("archetypes").document(mbti_code)
        archetype_doc = archetype_ref.get()
        
        archetype_data = None
        if archetype_doc.exists:
            archetype_data = archetype_doc.to_dict()
            
            # {{pet_name}} 플레이스홀더 치환 함수 (첫 글자 대문자 변환)
            def capitalize_first_letter(s: str) -> str:
                """문자열의 첫 글자를 대문자로 변환"""
                if not s:
                    return s
                return s[0].upper() + s[1:] if len(s) > 1 else s.upper()
            
            def replace_placeholders(obj, pet_name: str, locale: str):
                # 펫 이름 첫 글자 대문자 변환
                display_pet_name = capitalize_first_letter(pet_name)
                
                if isinstance(obj, str):
                    return obj.replace("{{pet_name}}", display_pet_name)
                elif isinstance(obj, dict):
                    # 다국어 처리: locale 키가 있으면 해당 언어만 추출
                    if locale in obj and isinstance(obj[locale], str):
                        return obj[locale].replace("{{pet_name}}", display_pet_name)
                    return {k: replace_placeholders(v, pet_name, locale) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [replace_placeholders(item, pet_name, locale) for item in obj]
                return obj
            
            archetype_data = replace_placeholders(archetype_data, request.petName, request.locale)
        
        # ---------------------------------------------------------
        # 7. 결과 저장 (Firestore)
        # ---------------------------------------------------------
        result_id = str(uuid.uuid4())
        
        # 현재 시간과 30일 뒤 시간 계산
        now = datetime.utcnow()
        expire_at = now + timedelta(days=30)  # 30일 뒤 날짜 계산
        
        result_data = {
            "result_id": result_id,
            "pet_name": request.petName,
            "locale": request.locale,
            "mbti_code": mbti_code,
            "axis_scores": axis_scores,
            "stats": stats,
            "answers": all_answers,
            "archetype": archetype_data,
            "created_at": now,
            "expire_at": expire_at,  # 삭제될 시간을 저장
            "report_status": "not_generated",  # 리포트 생성 상태 초기화
            "report_pages": {},  # 리포트 페이지 데이터 초기화
        }
        
        db.collection("test_results").document(result_id).set(result_data)
        
        # ---------------------------------------------------------
        # 8. 응답 반환
        # ---------------------------------------------------------
        return {
            "resultId": result_id,
            "mbtiCode": mbti_code,
            "stats": stats,
            "archetype": archetype_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"계산 중 오류 발생: {str(e)}")


# [GET] 특정 결과 조회 API
@app.get("/api/results/{result_id}")
async def get_result(result_id: str):
    try:
        # test_results 컬렉션에서 해당 UUID 문서 조회
        doc_ref = db.collection("test_results").document(result_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="결과를 찾을 수 없습니다.")

        # 결과 데이터 반환 (이미 계산된 stats와 archetype 서술 포함)
        return doc.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# [GET] 데이터 셋업 API - 질문 업로드
@app.get("/api/setup")
async def setup_data():
    try:
        from upload_questions import upload_questions
        upload_questions()
        return {"status": "success", "message": "질문 데이터 업로드 완료!"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"status": "error", "message": str(e)}


# [GET] Archetype 셋업 API - 16개 유형 업로드
@app.get("/api/setup-archetypes")
async def setup_archetypes():
    try:
        from upload_archetypes import upload_archetypes
        upload_archetypes()
        return {"status": "success", "message": "16개 유형 데이터 업로드 완료!"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"status": "error", "message": str(e)}


# ============================================================
# V2 프롬프트 함수들
# ============================================================
def get_system_prompt_v2(lang: str, pet_name: str, mbti_code: str, stats: dict, owner_summary: str) -> str:
    """V2 시스템 프롬프트 - 간결하고 명확한 지시"""
    
    mbti_meanings = {
        "E": {"en": "Social & Outgoing", "jp": "社交的で外向的"},
        "I": {"en": "Independent & Reserved", "jp": "独立心があり控えめ"},
        "S": {"en": "Practical & Grounded", "jp": "実践的で現実的"},
        "N": {"en": "Curious & Imaginative", "jp": "好奇心旺盛で想像力豊か"},
        "F": {"en": "Emotional & Empathetic", "jp": "感情豊かで共感的"},
        "T": {"en": "Calm & Logical", "jp": "冷静で論理的"},
        "J": {"en": "Structured & Disciplined", "jp": "規律正しく計画的"},
        "P": {"en": "Flexible & Spontaneous", "jp": "柔軟で自発的"}
    }
    
    traits = [mbti_meanings.get(letter, {}).get(lang, letter) for letter in mbti_code]
    
    if lang == "jp":
        return f"""あなたは犬の性格分析の専門家です。読みやすいブログ記事のように書いてください。

【{pet_name}のプロファイル】
- 性格タイプ: {mbti_code} ({', '.join(traits)})
- 社交性: {stats.get('sociability', 50)}% | 知性: {stats.get('sagacity', 50)}%
- 感情性: {stats.get('emotionality', 50)}% | 従順性: {stats.get('obedience', 50)}%
- 飼い主: {owner_summary}

【フォーマット規則】
✅ Markdownを使用: # 見出し、## 小見出し、**太字**、> 引用、- リスト
✅ 各セクションは簡潔に（2-3段落）
✅ 数値を根拠として自然に言及
✅ 「です/ます」調

❌ 禁止: 過度な時間描写、同じフレーズの繰り返し、長すぎる文章"""

    else:
        return f"""You are a dog personality analysis expert. Write like a friendly, readable blog post.

【{pet_name}'s Profile】
- Type: {mbti_code} ({', '.join(traits)})
- Sociability: {stats.get('sociability', 50)}% | Sagacity: {stats.get('sagacity', 50)}%
- Emotionality: {stats.get('emotionality', 50)}% | Obedience: {stats.get('obedience', 50)}%
- Owner: {owner_summary}

【Format Rules】
✅ Use Markdown: # Heading, ## Subheading, **bold**, > quote, - list
✅ Keep sections concise (2-3 paragraphs each)
✅ Reference stats naturally as evidence
✅ Warm but professional tone

❌ Forbidden: Excessive time descriptions, repetitive phrases, overly long sentences"""


def get_page_prompts_v2(lang: str, pet_name: str, mbti_code: str, stats: dict, owner_summary: str) -> list:
    """V2 페이지별 프롬프트 - 구체적이고 데이터 기반"""
    
    # 특성 판단
    high_soc = stats.get('sociability', 50) >= 55
    high_sag = stats.get('sagacity', 50) >= 55
    high_emo = stats.get('emotionality', 50) >= 55
    high_obe = stats.get('obedience', 50) >= 55
    
    if lang == "jp":
        return [
            {
                "page": "table_of_contents",
                "prompt": f"""# 📖 {pet_name}の性格分析レポート

美しい目次を作成してください（200字以内）:

1. 性格の全体像
2. 学習スタイルと知性
3. 飼い主との相性
4. トレーニング戦略
5. 社会化ガイド
6. 理想の一日
7. {pet_name}からのメッセージ

各項目に絵文字と簡単な説明を1行ずつ追加。"""
            },
            {
                "page": "deep_dive_traits",
                "prompt": f"""# 🐕 {pet_name}の性格：{mbti_code}タイプ

## なぜ{mbti_code}タイプなのか
数値に基づいて説明:
- 社交性 {stats.get('sociability', 50)}%: {'外向的で人懐っこい' if high_soc else '慎重で選択的'}
- 知性 {stats.get('sagacity', 50)}%: {'観察力が鋭い' if high_sag else '直感的'}
- 感情性 {stats.get('emotionality', 50)}%: {'感情豊か' if high_emo else '安定している'}
- 従順性 {stats.get('obedience', 50)}%: {'ルールを好む' if high_obe else '自由を好む'}

## 💪 {pet_name}の3つの強み
具体例を挙げて説明。

## ⚠️ 気をつけたいこと
1-2つの注意点と対策。

> {pet_name}を一言で表すと？"""
            },
            {
                "page": "cognitive_strengths",
                "prompt": f"""# 🧠 {pet_name}の学習スタイル

知性スコア: **{stats.get('sagacity', 50)}%**

## 学習パターン
{'「見て→考えて→やる」タイプ' if high_sag else '「やって→感じて→覚える」タイプ'}
- 新しいことを教える時のコツ
- 避けるべき方法

## 🧩 問題解決の得意分野
- パズルおもちゃへの反応
- 新しい環境での行動

## 知性を活かす3つのアクティビティ
具体的な遊び方を提案。"""
            },
            {
                "page": "owner_chemistry",
                "prompt": f"""# 💕 あなたと{pet_name}の相性

飼い主: **{owner_summary}**
{pet_name}: **{mbti_code}**

## なぜ相性が良いのか
3つの理由を具体的に。

## 🔧 こんな時は要注意
正直に1-2つの課題と解決策。

## 絆を深める毎日の習慣
すぐ実践できる3つの行動。

> この組み合わせの魅力を一言で。"""
            },
            {
                "page": "training_roadmap",
                "prompt": f"""# 🎓 {pet_name}のトレーニング戦略

従順性: **{stats.get('obedience', 50)}%**

## 最適なスタイル
{'ルールベース：一貫性と明確な境界が効果的' if high_obe else 'ゲームベース：遊びながら学ぶのが効果的'}

## 📅 2週間プラン

**Week 1:** 基礎
- 教えるコマンド（3つ）
- 練習時間と頻度

**Week 2:** 応用
- 次のステップ

## 🏆 モチベーションのコツ
- ご褒美の選び方
- ベストタイミング
- NGな方法"""
            },
            {
                "page": "social_adaptation",
                "prompt": f"""# 🐾 {pet_name}の社会化ガイド

社交性: **{stats.get('sociability', 50)}%**

## 他の犬との付き合い方
{'積極的に交流したがるタイプ' if high_soc else '慎重に距離を取るタイプ'}
- 初対面のコツ
- ドッグパークでの注意点

## 人への反応
- 来客時の対応
- 知らない人との接し方

## 環境変化への適応
感情性 {stats.get('emotionality', 50)}%
- 引っ越し時のケア
- 分離不安の{'予防策（リスク高め）' if high_emo else '心配は少ないが念のため'}"""
            },
            {
                "page": "lifestyle_guide",
                "prompt": f"""# ☀️ {pet_name}の理想的な一日

## 🌅 朝 (6:00-9:00)
- 起床後のルーティン
- 朝散歩: {'活発に30-45分' if high_soc else '静かに20-30分'}

## 🏠 日中 (9:00-17:00)
- 留守番の環境設定
- おすすめのおもちゃ

## 🌆 夕方 (17:00-20:00)
- 2回目の散歩
- 頭を使う遊び

## 🌙 夜 (20:00-)
- 就寝準備
- 寝床の環境

時間と具体的なアクションをセットで。"""
            },
            {
                "page": "heartfelt_message",
                "prompt": f"""# 💌 {pet_name}からあなたへ

{pet_name}の視点で飼い主へのメッセージを書いてください。

内容:
- {mbti_code}タイプとして感じること
- {owner_summary}な飼い主への感謝
- これからの日々への期待

**トーン:** 温かく、でも甘すぎず
**長さ:** 150-200字

> 「あなたは{pet_name}にとって最高の飼い主です」という趣旨で締めくくり。"""
            }
        ]
    
    else:  # English
        return [
            {
                "page": "table_of_contents",
                "prompt": f"""# 📖 {pet_name}'s Personality Report

Create a clean table of contents (under 150 words):

1. Personality Overview
2. Learning Style & Intelligence
3. Owner Compatibility
4. Training Strategy
5. Socialization Guide
6. Ideal Daily Routine
7. Message from {pet_name}

Add an emoji and one-line description for each."""
            },
            {
                "page": "deep_dive_traits",
                "prompt": f"""# 🐕 {pet_name}'s Personality: {mbti_code} Type

## Why {mbti_code}?
Based on the scores:
- Sociability {stats.get('sociability', 50)}%: {'Outgoing and friendly' if high_soc else 'Cautious and selective'}
- Sagacity {stats.get('sagacity', 50)}%: {'Sharp observer' if high_sag else 'Intuitive'}
- Emotionality {stats.get('emotionality', 50)}%: {'Expressive' if high_emo else 'Stable'}
- Obedience {stats.get('obedience', 50)}%: {'Loves structure' if high_obe else 'Values freedom'}

## 💪 3 Key Strengths
With specific examples.

## ⚠️ Watch Out For
1-2 challenges with solutions.

> Describe {pet_name} in one sentence."""
            },
            {
                "page": "cognitive_strengths",
                "prompt": f"""# 🧠 How {pet_name} Learns

Sagacity Score: **{stats.get('sagacity', 50)}%**

## Learning Pattern
{'Watch → Think → Do type' if high_sag else 'Do → Feel → Learn type'}
- Tips for teaching new things
- What to avoid

## 🧩 Problem-Solving Strengths
- Response to puzzle toys
- Behavior in new places

## 3 Activities to Engage Their Mind
Specific suggestions."""
            },
            {
                "page": "owner_chemistry",
                "prompt": f"""# 💕 You & {pet_name}: Compatibility

You: **{owner_summary}**
{pet_name}: **{mbti_code}**

## Why You're Great Together
3 specific reasons.

## 🔧 Potential Challenges
1-2 honest points with solutions.

## Daily Habits to Bond
3 easy actions.

> Sum up this pairing in one line."""
            },
            {
                "page": "training_roadmap",
                "prompt": f"""# 🎓 Training Strategy for {pet_name}

Obedience: **{stats.get('obedience', 50)}%**

## Best Approach
{'Rule-based: Consistency and clear boundaries work best' if high_obe else 'Game-based: Learning through play works best'}

## 📅 2-Week Plan

**Week 1:** Foundation
- Commands to teach (3)
- Practice time & frequency

**Week 2:** Building up
- Next steps

## 🏆 Motivation Tips
- Best rewards
- Optimal timing
- What NOT to do"""
            },
            {
                "page": "social_adaptation",
                "prompt": f"""# 🐾 Socialization Guide for {pet_name}

Sociability: **{stats.get('sociability', 50)}%**

## Meeting Other Dogs
{'Actively seeks interaction' if high_soc else 'Takes time to warm up'}
- First meeting tips
- Dog park advice

## Meeting People
- Handling guests
- Strangers

## Adapting to Change
Emotionality {stats.get('emotionality', 50)}%
- Moving tips
- Separation anxiety: {'Higher risk - prevention tips' if high_emo else 'Lower risk but still'}"""
            },
            {
                "page": "lifestyle_guide",
                "prompt": f"""# ☀️ {pet_name}'s Perfect Day

## 🌅 Morning (6:00-9:00)
- Wake-up routine
- Morning walk: {'Active 30-45 min' if high_soc else 'Calm 20-30 min'}

## 🏠 Daytime (9:00-17:00)
- Alone time setup
- Recommended toys

## 🌆 Evening (17:00-20:00)
- Second walk
- Mental stimulation

## 🌙 Night (20:00-)
- Bedtime routine
- Sleep environment

Include times and specific actions."""
            },
            {
                "page": "heartfelt_message",
                "prompt": f"""# 💌 A Message from {pet_name}

Write from {pet_name}'s perspective to their owner.

Include:
- What being {mbti_code} feels like
- Gratitude for a {owner_summary} owner
- Hope for the future

**Tone:** Warm but not overly sentimental
**Length:** 100-150 words

> End with: "You are the perfect owner for {pet_name}." variation."""
            }
        ]


# ============================================================
# V3 프롬프트 함수들 - Markdown 헤딩 강제 버전
# ============================================================
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
    """V3 페이지별 프롬프트 - 직관적인 별명 사용"""
    
    high_soc = stats.get('sociability', 50) >= 55
    high_sag = stats.get('sagacity', 50) >= 55
    high_emo = stats.get('emotionality', 50) >= 55
    high_obe = stats.get('obedience', 50) >= 55
    
    if lang == "jp":
        return [
            {
                "page": "table_of_contents",
                "prompt": f"""次の形式で正確に作成してください:

# 📖 {pet_name}の性格分析レポート

## 目次

1. **性格の全体像** - 「{archetype_alias}」タイプの特徴
2. **学習スタイル** - {pet_name}の認知パターン
3. **飼い主との相性** - 最高のチームになる理由
4. **トレーニング戦略** - 効果的な教育法
5. **社会化ガイド** - 他の犬や人との関わり方
6. **理想の一日** - 完璧なルーティン
7. **特別なメッセージ** - {pet_name}からあなたへ

---

> このレポートは「{archetype_alias}」タイプの{pet_name}の独特な性格を理解し、より深い絆を築くのに役立ちます。

上記の形式を正確に従って作成してください。"""
            },
            {
                "page": "deep_dive_traits",
                "prompt": f"""次の形式で正確に作成してください:

# 🐕 {pet_name}の性格分析

## なぜ「{archetype_alias}」タイプなのか

{pet_name}は「**{archetype_alias}**」タイプです。このタイプの特徴:

{pet_name}のスコアに基づいて説明:
- **社交性 {stats.get('sociability', 50)}%**: {'外向的で人懐っこい' if high_soc else '慎重で選択的'}
- **知性 {stats.get('sagacity', 50)}%**: {'観察力が鋭い' if high_sag else '直感的'}
- **感情性 {stats.get('emotionality', 50)}%**: {'感情表現が豊か' if high_emo else '感情的に安定'}
- **従順性 {stats.get('obedience', 50)}%**: {'ルールを好む' if high_obe else '自由を好む'}

## 💪 {pet_name}の3つの強み

### 強み1: [タイトル]
具体例を挙げて説明。

### 強み2: [タイトル]
具体例を挙げて説明。

### 強み3: [タイトル]
具体例を挙げて説明。

## ⚠️ 注意すべきポイント

[1-2つの課題と解決策]

---

> "{pet_name}を一言で表すと: 「{archetype_alias}」らしい..."

上記の形式を正確に従って作成してください。MBTIコードではなく「{archetype_alias}」を使用してください。"""
            },
            {
                "page": "cognitive_strengths",
                "prompt": f"""次の形式で正確に作成してください:

# 🧠 {pet_name}の学習スタイル

**知性スコア: {stats.get('sagacity', 50)}%**

## 学習パターン

「{archetype_alias}」タイプの{pet_name}は**{'観察→分析→実行' if high_sag else '体験→反応→学習'}**タイプの学習者です。

{'これは、まず観察し、状況を分析してから行動することを意味します。新しいことを教える時は、試す前に明確に実演してください。' if high_sag else 'これは、実践的な経験を通じて最もよく学ぶことを意味します。トレーニングセッションは短く、楽しく、繰り返し行いましょう。'}

## 🧩 問題解決スタイル

### {pet_name}が課題にアプローチする方法:
- **パズルおもちゃ**: [典型的な反応を説明]
- **新しい環境**: [行動を説明]
- **障害物**: [問題を解決する方法を説明]

## 3つの脳を刺激するアクティビティ

### アクティビティ1: [名前]
[{pet_name}のためにそれをどのように行い、なぜ機能するか]

### アクティビティ2: [名前]
[{pet_name}のためにそれをどのように行い、なぜ機能するか]

### アクティビティ3: [名前]
[{pet_name}のためにそれをどのように行い、なぜ機能するか]

---

> "精神的に刺激された{pet_name}は幸せな{pet_name}です。"

上記の形式を正確に従って作成してください。"""
            },
            {
                "page": "owner_chemistry",
                "prompt": f"""次の形式で正確に作成してください:

# 💕 あなたと{pet_name}: 完璧なマッチ

**あなたのタイプ:** {owner_summary}
**{pet_name}のタイプ:** 「{archetype_alias}」

## なぜ相性が良いのか

### 理由1: [タイトル]
[具体的な説明]

### 理由2: [タイトル]
[具体的な説明]

### 理由3: [タイトル]
[具体的な説明]

## 🔧 潜在的な摩擦ポイント

### 課題: [タイトル]
**問題:** [説明]
**解決策:** [実践的なアドバイス]

## 毎日の絆を深める習慣

今日から始められる3つの簡単なこと:

1. **[習慣名]** — [簡単な説明]
2. **[習慣名]** — [簡単な説明]
3. **[習慣名]** — [簡単な説明]

---

> "一緒に、あなたと「{archetype_alias}」タイプの{pet_name}は最高のチームです。"

上記の形式を正確に従って作成してください。"""
            },
            {
                "page": "training_roadmap",
                "prompt": f"""次の形式で正確に作成してください:

# 🎓 {pet_name}のトレーニング戦略

**従順性スコア: {stats.get('obedience', 50)}%**

## 最適なトレーニングアプローチ

「{archetype_alias}」タイプの{pet_name}は**{'ルールベース' if high_obe else 'ゲームベース'}**アプローチに最もよく反応します。

{'これは、明確な境界、一貫したコマンド、構造化されたセッションが効果的であることを意味します。' if high_obe else 'これは、トレーニングを遊びのように感じさせることを意味します。短く、楽しく、多様性のあるセッションで彼らを引き付けます。'}

## 📅 2週間トレーニングプラン

### Week 1: 基礎

| 日 | 焦点 | 時間 |
|-----|------|------|
| 1-2 | おすわり & 名前認識 | 5-10分 × 3 |
| 3-4 | 待て（短時間） | 5-10分 × 3 |
| 5-7 | 呼ばれたら来る | 5-10分 × 3 |

### Week 2: 構築

| 日 | 焦点 | 時間 |
|-----|------|------|
| 1-3 | コマンドの組み合わせ | 10分 × 2 |
| 4-5 | 気を散らすものを追加 | 10分 × 2 |
| 6-7 | 実世界での練習 | 15分 × 1 |

## 🏆 モチベーションのコツ

- **最適なご褒美:** [{pet_name}の性格に特化]
- **最適なタイミング:** [最も受容的な時]
- **避けるべきこと:** [機能しないこと]

---

> "「{archetype_alias}」タイプの{pet_name}には一貫性が鍵です。"

上記の形式を正確に従って作成してください。"""
            },
            {
                "page": "social_adaptation",
                "prompt": f"""次の形式で正確に作成してください:

# 🐾 {pet_name}の社会化ガイド

**社交性スコア: {stats.get('sociability', 50)}%**

## 他の犬との出会い

「{archetype_alias}」タイプの{pet_name}は**{'友達を作ることに熱心' if high_soc else '友情に選択的'}**です。

### 初対面のコツ:
- [コツ1]
- [コツ2]
- [コツ3]

### ドッグパークで:
- [アドバイス1]
- [アドバイス2]

## 新しい人との出会い

### 来客時:
- [{pet_name}が典型的にどのように反応するか]
- [あなたがすべきこと]

### 外で見知らぬ人と:
- [{pet_name}が典型的にどのように反応するか]
- [あなたがすべきこと]

## 🏠 変化への適応

**感情性スコア: {stats.get('emotionality', 50)}%**

### 新しい家への引っ越し:
[{pet_name}の性格に特化した具体的なヒント]

### 分離不安のリスク: {'高い' if high_emo else '低い'}
{'予防が鍵:' if high_emo else 'それでも知っておくと良い:'}
- [ヒント1]
- [ヒント2]

---

> "よく社会化された{pet_name}は、どんな状況でも自信があり、幸せです。"

上記の形式を正確に従って作成してください。"""
            },
            {
                "page": "lifestyle_guide",
                "prompt": f"""次の形式で正確に作成してください:

# ☀️ {pet_name}の完璧な一日

## 🌅 朝 (6:00 - 9:00)

**起床ルーティン:**
「{archetype_alias}」タイプの{pet_name}は{'行動の準備ができてベッドから跳び出る' if high_soc else 'ストレッチしてゆっくり目を覚ます時間を取る'}。

**朝散歩:** {'30-45分の活発な探索' if high_soc else '20-30分の静かで匂いに焦点を当てた散歩'}
- 最適なルートタイプ: [説明]
- 含めるべきアクティビティ: [リスト]

**朝食:** [タイミングとヒント]

## 🏠 日中 (9:00 - 17:00)

**一人で家にいる時:**
- 環境設定: [具体的なヒント]
- おすすめのおもちゃ: [2-3つの特定のタイプをリスト]
- 背景: [音楽/TV/静寂?]

## 🌆 夕方 (17:00 - 20:00)

**2回目の散歩:** [スタイルと時間]

**精神的刺激:**
- [アクティビティ1]
- [アクティビティ2]

**夕食:** [タイミング]

## 🌙 夜 (20:00+)

**リラックスタイムのルーティン:**
- [ステップ1]
- [ステップ2]

**睡眠環境:**
- [ヒント1]
- [ヒント2]

---

> "良いルーティンは{pet_name}を安全で愛されていると感じさせます。"

上記の形式を正確に従って作成してください。"""
            },
            {
                "page": "heartfelt_message",
                "prompt": f"""次の形式で正確に作成してください:

# 💌 {pet_name}からあなたへ

*「{archetype_alias}」タイプの{pet_name}の視点から飼い主への手紙*

---

親愛なる人間へ、

[{pet_name}の視点から3-4段落を書いてください。含めるべき内容:]

- 「{archetype_alias}」タイプの犬であることの感じ方
- {owner_summary}な飼い主を持つことへの感謝
- すべてを意味する小さな瞬間
- 一緒に過ごす未来への希望

[温かく、でも過度にセンチメンタルにならないように。約150-200字。]

---

> "あなたは私の飼い主だけではありません。あなたは私の全世界です。"

愛としっぽの振りを込めて、
**{pet_name}** 🐾

上記の形式を正確に従って作成してください。"""
            }
        ]
    
    else:  # English
        return [
            {
                "page": "table_of_contents",
                "prompt": f"""Write EXACTLY in this format:

# 📖 {pet_name}'s Personality Report

## Table of Contents

1. **Personality Overview** — Understanding the "{archetype_alias}" type
2. **Learning Style** — How {pet_name} processes information
3. **Owner Compatibility** — Why you make a great team
4. **Training Strategy** — Methods that work best
5. **Socialization Guide** — Meeting dogs and people
6. **Ideal Day** — The perfect routine
7. **Special Message** — From {pet_name} to you

---

> This report will help you understand your "{archetype_alias}" type {pet_name}'s unique personality and build a deeper bond.

Follow this exact format. Use "{archetype_alias}" instead of "{mbti_code}"."""
            },
            {
                "page": "deep_dive_traits",
                "prompt": f"""Write EXACTLY in this format:

# 🐕 {pet_name}'s Personality Analysis

## Why "{archetype_alias}" Type?

{pet_name} is a **"{archetype_alias}"** type. Here's what that means:

Based on {pet_name}'s scores:
- **Sociability {stats.get('sociability', 50)}%**: {'Outgoing and friendly' if high_soc else 'Cautious and selective'}
- **Sagacity {stats.get('sagacity', 50)}%**: {'Sharp observer' if high_sag else 'Intuitive learner'}
- **Emotionality {stats.get('emotionality', 50)}%**: {'Expressively emotional' if high_emo else 'Emotionally stable'}
- **Obedience {stats.get('obedience', 50)}%**: {'Loves structure' if high_obe else 'Values freedom'}

## 💪 {pet_name}'s 3 Key Strengths

### Strength 1: [Title]
Explain with a specific real-life example.

### Strength 2: [Title]
Explain with a specific real-life example.

### Strength 3: [Title]
Explain with a specific real-life example.

## ⚠️ Things to Watch For

[1-2 challenges with practical solutions]

---

> "{pet_name} in one sentence: A true '{archetype_alias}' who..."

Follow this exact format. Use "{archetype_alias}" instead of "{mbti_code}"."""
            },
            {
                "page": "cognitive_strengths",
                "prompt": f"""Write EXACTLY in this format:

# 🧠 How {pet_name} Learns

**Sagacity Score: {stats.get('sagacity', 50)}%**

## Learning Pattern

As a "{archetype_alias}" type, {pet_name} is a **{'Watch → Think → Do' if high_sag else 'Do → Feel → Learn'}** learner.

{'This means they prefer to observe first, analyze the situation, then act. When teaching something new, demonstrate it clearly before asking them to try.' if high_sag else 'This means they learn best through hands-on experience. Keep training sessions short, fun, and repetitive.'}

## 🧩 Problem-Solving Style

### How {pet_name} approaches challenges:
- **Puzzle toys**: [describe their typical reaction]
- **New environments**: [describe their behavior]
- **Obstacles**: [describe how they solve problems]

## 3 Brain-Boosting Activities

### Activity 1: [Name]
[How to do it and why it works for {pet_name}]

### Activity 2: [Name]
[How to do it and why it works for {pet_name}]

### Activity 3: [Name]
[How to do it and why it works for {pet_name}]

---

> "A mentally stimulated {pet_name} is a happy {pet_name}."

Follow this exact format."""
            },
            {
                "page": "owner_chemistry",
                "prompt": f"""Write EXACTLY in this format:

# 💕 You & {pet_name}: Perfect Match

**Your Type:** {owner_summary}
**{pet_name}'s Type:** "{archetype_alias}"

## Why You're Great Together

### Reason 1: [Title]
[Specific explanation]

### Reason 2: [Title]
[Specific explanation]

### Reason 3: [Title]
[Specific explanation]

## 🔧 Potential Friction Points

### Challenge: [Title]
**The issue:** [Describe]
**The solution:** [Practical advice]

## Daily Bonding Habits

Here are 3 simple things you can start today:

1. **[Habit name]** — [Brief description]
2. **[Habit name]** — [Brief description]
3. **[Habit name]** — [Brief description]

---

> "Together, you and your '{archetype_alias}' {pet_name} are the perfect team."

Follow this exact format."""
            },
            {
                "page": "training_roadmap",
                "prompt": f"""Write EXACTLY in this format:

# 🎓 Training Strategy for {pet_name}

**Obedience Score: {stats.get('obedience', 50)}%**

## Best Training Approach

As a "{archetype_alias}" type, {pet_name} responds best to a **{'rule-based' if high_obe else 'game-based'}** approach.

{'This means clear boundaries, consistent commands, and structured sessions work well. They appreciate knowing exactly what is expected.' if high_obe else 'This means making training feel like play. Short, fun sessions with lots of variety keep them engaged.'}

## 📅 2-Week Training Plan

### Week 1: Foundation

| Day | Focus | Duration |
|-----|-------|----------|
| 1-2 | Sit & Name recognition | 5-10 min × 3 |
| 3-4 | Stay (short) | 5-10 min × 3 |
| 5-7 | Come when called | 5-10 min × 3 |

### Week 2: Building Up

| Day | Focus | Duration |
|-----|-------|----------|
| 1-3 | Combine commands | 10 min × 2 |
| 4-5 | Add distractions | 10 min × 2 |
| 6-7 | Real-world practice | 15 min × 1 |

## 🏆 Motivation Tips

- **Best rewards:** [specific to {pet_name}'s personality]
- **Optimal timing:** [when they're most receptive]
- **Avoid:** [what doesn't work]

---

> "Consistency is key with your '{archetype_alias}' {pet_name}."

Follow this exact format."""
            },
            {
                "page": "social_adaptation",
                "prompt": f"""Write EXACTLY in this format:

# 🐾 Socialization Guide for {pet_name}

**Sociability Score: {stats.get('sociability', 50)}%**

## Meeting Other Dogs

As a "{archetype_alias}" type, {pet_name} is **{'eager to make friends' if high_soc else 'selective about friendships'}**.

### First Meeting Tips:
- [Tip 1]
- [Tip 2]
- [Tip 3]

### At the Dog Park:
- [Advice 1]
- [Advice 2]

## Meeting New People

### When Guests Visit:
- [How {pet_name} typically reacts]
- [What you should do]

### With Strangers Outside:
- [How {pet_name} typically reacts]
- [What you should do]

## 🏠 Adapting to Change

**Emotionality Score: {stats.get('emotionality', 50)}%**

### Moving to a New Home:
[Specific tips for {pet_name}'s personality]

### Separation Anxiety Risk: {'Higher' if high_emo else 'Lower'}
{'Prevention is key:' if high_emo else 'Still good to know:'}
- [Tip 1]
- [Tip 2]

---

> "A well-socialized {pet_name} is confident and happy in any situation."

Follow this exact format."""
            },
            {
                "page": "lifestyle_guide",
                "prompt": f"""Write EXACTLY in this format:

# ☀️ {pet_name}'s Perfect Day

## 🌅 Morning (6:00 - 9:00)

**Wake-up routine:**
As a "{archetype_alias}" type, {pet_name} {'bounces out of bed ready for action' if high_soc else 'takes a moment to stretch and slowly wake up'}.

**Morning walk:** {'30-45 minutes of active exploration' if high_soc else '20-30 minutes of calm, sniff-focused walking'}
- Best route type: [description]
- Activities to include: [list]

**Breakfast:** [timing and tips]

## 🏠 Daytime (9:00 - 17:00)

**When home alone:**
- Environment setup: [specific tips]
- Recommended toys: [list 2-3 specific types]
- Background: [music/TV/silence?]

## 🌆 Evening (17:00 - 20:00)

**Second walk:** [style and duration]

**Mental stimulation:**
- [Activity 1]
- [Activity 2]

**Dinner:** [timing]

## 🌙 Night (20:00+)

**Wind-down routine:**
- [Step 1]
- [Step 2]

**Sleep environment:**
- [Tip 1]
- [Tip 2]

---

> "A good routine makes {pet_name} feel secure and loved."

Follow this exact format."""
            },
            {
                "page": "heartfelt_message",
                "prompt": f"""Write EXACTLY in this format:

# 💌 A Message from {pet_name}

*Written from {pet_name}'s perspective — a "{archetype_alias}" type — to their owner*

---

Dear Human,

[Write 3-4 paragraphs from {pet_name}'s point of view, including:]

- What it feels like to be a "{archetype_alias}" type dog
- Gratitude for having a {owner_summary} owner
- Small moments that mean everything
- Hope for the future together

[Keep it warm but not overly sentimental. About 150-200 words.]

---

> "You are not just my owner. You are my whole world. And I am so grateful that world is you."

With love and tail wags,
**{pet_name}** 🐾

Follow this exact format."""
            }
        ]


# ============================================================
# [POST] 프리미엄 리포트 생성 API V2
# ============================================================
@app.post("/api/test/generate-report/{result_id}")
async def generate_report(result_id: str, lang: str = "en"):
    """
    V2 리포트 생성 - 개선된 프롬프트 + 명확한 Markdown 출력
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
            """표준 chat.completions.create 사용"""
            max_retries = 3
            retry_delay = 1.5
            
            for attempt in range(max_retries):
                try:
                    print(f"🔄 [{page_info['page']}] Attempt {attempt + 1}/{max_retries}...")
                    
                    # ✅ 표준 OpenAI API 호출
                    response = await openai_client.chat.completions.create(
                        model="gpt-4o-mini",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": page_info["prompt"]}
                        ],
                        max_tokens=1000,
                        temperature=0.7
                    )
                    
                    # ✅ 표준 응답 추출
                    content = response.choices[0].message.content
                    
                    print(f"✅ [{page_info['page']}] Success: {len(content)} chars")
                    
                    if not content or len(content.strip()) < 50:
                        raise ValueError(f"Response too short: {len(content)} chars")
                    
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


# uvicorn.run은 항상 파일의 맨 마지막에 위치해야 합니다!
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
