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
import json
from dotenv import load_dotenv
from openai import AsyncOpenAI
import httpx

# .env 파일의 내용을 로드합니다.
load_dotenv()

# 1. Firebase 인증 및 초기화
if not firebase_admin._apps:
    # 환경 변수에서 인증 정보를 가져옴
    cred_json = os.getenv("FIREBASE_CREDENTIALS")
    
    if cred_json:
        # 서버 환경: 환경 변수 문자열을 JSON으로 파싱해서 사용
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
    else:
        # 로컬 환경: 파일이 있으면 사용 (없으면 에러)
        if os.path.exists("serviceAccountKey.json"):
            cred = credentials.Certificate("serviceAccountKey.json")
        else:
            raise FileNotFoundError("Firebase 인증 정보(파일 또는 환경 변수)가 없습니다.")
            
    firebase_admin.initialize_app(cred)

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
    """V3 페이지별 프롬프트 - 프론트엔드 pageOrder 및 uiText와 완벽 매칭"""
    
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
- **社交性 {stats.get('sociability', 50)}%**: {'外向的で大胆' if high_soc else '控えめで観察力がある'}
- **知性 {stats.get('sagacity', 50)}%**: {'機転が利き鋭い' if high_sag else '直感的で本能的'}
- **感情性 {stats.get('emotionality', 50)}%**: {'共感的で表現豊か' if high_emo else '安定して冷静'}
- **従順性 {stats.get('obedience', 50)}%**: {'ルール指向で集中力がある' if high_obe else '独立心が強く自由な精神'}

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

**知性スコア: {stats.get('sagacity', 50)}%**

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

**従順性スコア: {stats.get('obedience', 50)}%**

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

**社交性スコア: {stats.get('sociability', 50)}%**

## 新しい出会い
{pet_name}は新しい友達を作ることについて**{'熱心' if high_soc else '選択的'}**です。
[ドッグパークや見知らぬ人への具体的なヒントを提供]

## 🏠 変化への適応
**感情性: {stats.get('emotionality', 50)}%**
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
- **Sociability {stats.get('sociability', 50)}%**: {'Outgoing and bold' if high_soc else 'Reserved and observant'}
- **Sagacity {stats.get('sagacity', 50)}%**: {'Quick-witted and sharp' if high_sag else 'Intuitive and instinctive'}
- **Emotionality {stats.get('emotionality', 50)}%**: {'Empathetic and expressive' if high_emo else 'Steady and calm'}
- **Obedience {stats.get('obedience', 50)}%**: {'Rule-oriented and focused' if high_obe else 'Independent and free-spirited'}

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

**Sagacity Score: {stats.get('sagacity', 50)}%**

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

**Obedience Score: {stats.get('obedience', 50)}%**

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

**Sociability Score: {stats.get('sociability', 50)}%**

## New Encounters
{pet_name} is **{'enthusiastic' if high_soc else 'selective'}** about making new friends.
[Provide specific tips for dog parks and strangers]

## 🏠 Adapting to Change
**Emotionality: {stats.get('emotionality', 50)}%**
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


# uvicorn.run은 항상 파일의 맨 마지막에 위치해야 합니다!
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
